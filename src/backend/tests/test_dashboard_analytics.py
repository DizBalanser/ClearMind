import os
import unittest
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.conversation import Conversation
from app.models.item import Item
from app.models.item_link import ItemLink
from app.models.message import Message
from app.models.profile_update import ProfileUpdate
from app.models.reflection import Reflection
from app.models.user import User
from app.models.user_context import UserContext
from app.routes.dashboard import get_dashboard_analytics


class DashboardAnalyticsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.Session()
        self.user = User(email="test@example.com", password_hash="hash")
        self.other_user = User(email="other@example.com", password_hash="hash")
        self.db.add_all([self.user, self.other_user])
        self.db.commit()
        self.db.refresh(self.user)
        self.db.refresh(self.other_user)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def _run_analytics(self, days=30, user=None):
        import asyncio

        return asyncio.run(get_dashboard_analytics(
            days=days,
            current_user=user or self.user,
            db=self.db,
        ))

    def test_empty_user_returns_zero_filled_days(self):
        result = self._run_analytics(days=30)

        self.assertEqual(len(result.activity), 30)
        self.assertEqual(len(result.velocity), 30)
        self.assertTrue(all(day.total == 0 for day in result.activity))
        self.assertEqual(result.telemetry.graph_connections, 0)
        self.assertEqual(result.telemetry.active_profile_rules, 0)

    def test_mixed_categories_produce_heatmap_totals(self):
        now = datetime.utcnow()
        self.db.add_all([
            Item(user_id=self.user.id, title="Task", category="task", created_at=now),
            Item(user_id=self.user.id, title="Idea", category="idea", created_at=now),
            Item(user_id=self.user.id, title="Thought", category="thought", created_at=now),
            Item(user_id=self.other_user.id, title="Other", category="task", created_at=now),
        ])
        self.db.commit()

        result = self._run_analytics(days=30)
        today = next(day for day in result.activity if day.date == now.date())

        self.assertEqual(today.tasks, 1)
        self.assertEqual(today.ideas, 1)
        self.assertEqual(today.thoughts, 1)
        self.assertEqual(today.total, 3)

    def test_velocity_is_monotonic_for_items_and_links(self):
        two_days_ago = datetime.utcnow() - timedelta(days=2)
        yesterday = datetime.utcnow() - timedelta(days=1)
        item_a = Item(user_id=self.user.id, title="A", category="task", created_at=two_days_ago)
        item_b = Item(user_id=self.user.id, title="B", category="idea", created_at=yesterday)
        self.db.add_all([item_a, item_b])
        self.db.flush()
        self.db.add(ItemLink(source_id=item_a.id, target_id=item_b.id, created_at=yesterday, ai_reasoning="Related"))
        self.db.commit()

        result = self._run_analytics(days=30)
        nodes = [point.nodes for point in result.velocity]
        connections = [point.connections for point in result.velocity]

        self.assertEqual(nodes, sorted(nodes))
        self.assertEqual(connections, sorted(connections))
        self.assertEqual(result.velocity[-1].nodes, 2)
        self.assertEqual(result.velocity[-1].connections, 1)
        self.assertEqual(result.telemetry.hidden_connections, 1)

    def test_telemetry_is_scoped_to_current_user(self):
        now = datetime.utcnow()
        self.db.add_all([
            UserContext(user_id=self.user.id, category="goal", key="goal:test", value_json={"fact": "User has a goal."}),
            ProfileUpdate(user_id=self.user.id, category="goal", fact="User has a goal.", new_value_json={}, created_at=now),
            Reflection(user_id=self.user.id, summary="summary", created_at=now),
            Item(user_id=self.user.id, title="Pending", category="task", status="pending", created_at=now),
            UserContext(user_id=self.other_user.id, category="goal", key="goal:other", value_json={"fact": "Other fact."}),
            ProfileUpdate(user_id=self.other_user.id, category="goal", fact="Other fact.", new_value_json={}, created_at=now),
        ])
        self.db.commit()

        result = self._run_analytics(days=30)

        self.assertEqual(result.telemetry.active_profile_rules, 1)
        self.assertEqual(result.telemetry.memory_updates, 1)
        self.assertEqual(result.telemetry.reflections, 1)
        self.assertEqual(result.telemetry.pending_tasks, 1)


if __name__ == "__main__":
    unittest.main()
