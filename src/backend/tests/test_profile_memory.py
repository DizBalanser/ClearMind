import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.profile_update import ProfileUpdate
from app.models.user import User
from app.models.user_context import UserContext
from app.routes.profile import create_context_rule, delete_context_rule
from app.schemas import MemoryExtractionLLMResponse, UserContextCreate
from app.services.profile_memory import (
    extract_memory_candidates,
    filter_new_memory_candidates,
    persist_profile_updates,
    save_profile_memory,
)


class ProfileMemoryTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()
        self.user = User(email="test@example.com", password_hash="hash")
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_persist_profile_updates_creates_context_and_event(self):
        saved = persist_profile_updates(
            self.db,
            self.user.id,
            [{"category": "identity", "fact": "User is studying AI."}],
        )
        self.db.commit()

        self.assertEqual(len(saved), 1)
        self.assertEqual(self.db.query(UserContext).count(), 1)
        self.assertEqual(self.db.query(ProfileUpdate).count(), 1)

    def test_invalid_profile_update_is_skipped(self):
        saved = persist_profile_updates(
            self.db,
            self.user.id,
            [{"category": "temporary", "fact": "User is tired today."}],
        )
        self.db.commit()

        self.assertEqual(saved, [])
        self.assertEqual(self.db.query(UserContext).count(), 0)
        self.assertEqual(self.db.query(ProfileUpdate).count(), 0)

    def test_save_profile_memory_creates_context_and_audit_event(self):
        context = save_profile_memory(
            self.db,
            self.user.id,
            category="constraint",
            fact="User prefers practical examples.",
            source="chat_confirmed",
            confidence=0.9,
        )
        self.db.commit()

        self.assertIsNotNone(context)
        self.assertEqual(self.db.query(UserContext).count(), 1)
        self.assertEqual(self.db.query(ProfileUpdate).count(), 1)
        self.assertEqual(context.source, "chat_confirmed")

    def test_filter_new_memory_candidates_removes_existing_and_invalid(self):
        save_profile_memory(
            self.db,
            self.user.id,
            category="goal",
            fact="User wants to finish their thesis.",
            source="user",
        )
        self.db.commit()

        candidates = filter_new_memory_candidates(
            self.db,
            self.user.id,
            [
                {"category": "goal", "fact": "User wants to finish their thesis."},
                {"category": "temporary", "fact": "User is tired today."},
                {"category": "identity", "fact": "User studies AI.", "confidence": 0.8},
            ],
        )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0]["fact"], "User studies AI.")

    def test_extract_memory_candidates_does_not_persist(self):
        response = MemoryExtractionLLMResponse(
            memory_candidates=[
                {
                    "category": "identity",
                    "fact": "User is studying AI.",
                    "confidence": 0.9,
                    "reason": "The user stated it directly.",
                }
            ]
        )

        with patch("app.services.profile_memory.generate_json", return_value=response):
            candidates = extract_memory_candidates(
                self.db,
                self.user.id,
                "I am studying AI.",
                model=object(),
            )

        self.assertEqual(len(candidates), 1)
        self.assertEqual(self.db.query(UserContext).count(), 0)
        self.assertEqual(self.db.query(ProfileUpdate).count(), 0)

    def test_profile_create_and_delete_routes_audit_changes(self):
        import asyncio

        created = asyncio.run(
            create_context_rule(
                UserContextCreate(
                    category="general",
                    fact="User likes concise explanations.",
                    source="user",
                    confidence=1.0,
                ),
                current_user=self.user,
                db=self.db,
            )
        )

        self.assertEqual(created.fact, "User likes concise explanations.")
        self.assertEqual(self.db.query(UserContext).count(), 1)
        self.assertEqual(self.db.query(ProfileUpdate).count(), 1)

        asyncio.run(delete_context_rule(created.id, current_user=self.user, db=self.db))

        self.assertEqual(self.db.query(UserContext).count(), 0)
        self.assertEqual(self.db.query(ProfileUpdate).count(), 2)


if __name__ == "__main__":
    unittest.main()
