import asyncio
import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from app.database import Base
from app.models.conversation import Conversation
from app.models.item import Item
from app.models.item_link import ItemLink
from app.models.message import Message
from app.models.reflection import Reflection
from app.models.user import User
from app.routes.chat import send_message
from app.routes.graph import analyze_graph, create_link, delete_link, get_graph_data
from app.routes.items import (
    create_item,
    delete_item,
    get_item,
    get_items,
    update_item,
    update_item_status,
)
from app.schemas import ChatMessage, ItemCreate, ItemLinkCreate, ItemUpdate, RouterLLMResponse
from app.services.orchestrator import Orchestrator


class RoutesAndOrchestratorTests(unittest.TestCase):
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

    def _run(self, coro):
        return asyncio.run(coro)

    # ------------------------------------------------------------------
    # Items Route Coverage (happy + error + edge)
    # ------------------------------------------------------------------
    def test_items_route_happy_paths(self):
        created = self._run(
            create_item(
                ItemCreate(title="Write thesis", category="task", life_area="study", priority=9),
                current_user=self.user,
                db=self.db,
            )
        )
        self.assertEqual(created.title, "Write thesis")

        self.db.add(Item(user_id=self.user.id, title="Side idea", category="idea", status="pending", priority=3))
        self.db.commit()

        filtered = self._run(
            get_items(category="task", status=None, life_area=None, current_user=self.user, db=self.db)
        )
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0].category, "task")

        loaded = self._run(get_item(created.id, current_user=self.user, db=self.db))
        self.assertEqual(loaded.id, created.id)

        updated = self._run(
            update_item(
                created.id,
                ItemUpdate(title="Write thesis draft", priority=10),
                current_user=self.user,
                db=self.db,
            )
        )
        self.assertEqual(updated.title, "Write thesis draft")
        self.assertEqual(updated.priority, 10)

        status_updated = self._run(
            update_item_status(
                created.id,
                {"status": "done"},
                current_user=self.user,
                db=self.db,
            )
        )
        self.assertEqual(status_updated.status, "done")

        result = self._run(delete_item(created.id, current_user=self.user, db=self.db))
        self.assertIsNone(result)

    def test_items_route_error_and_edge_paths(self):
        with self.assertRaises(HTTPException) as missing_get:
            self._run(get_item(999, current_user=self.user, db=self.db))
        self.assertEqual(missing_get.exception.status_code, 404)

        with self.assertRaises(HTTPException) as invalid_status:
            self._run(update_item_status(1, {"status": "bad_status"}, current_user=self.user, db=self.db))
        self.assertEqual(invalid_status.exception.status_code, 400)

        with self.assertRaises(HTTPException) as missing_update:
            self._run(update_item(999, ItemUpdate(title="x"), current_user=self.user, db=self.db))
        self.assertEqual(missing_update.exception.status_code, 404)

        with self.assertRaises(HTTPException) as missing_delete:
            self._run(delete_item(999, current_user=self.user, db=self.db))
        self.assertEqual(missing_delete.exception.status_code, 404)

    # ------------------------------------------------------------------
    # Graph Route Coverage (happy + error + edge)
    # ------------------------------------------------------------------
    def test_graph_routes_happy_paths(self):
        a = Item(user_id=self.user.id, title="Task A", category="task", status="pending", priority=8)
        b = Item(user_id=self.user.id, title="Task B", category="task", status="pending", priority=6)
        self.db.add_all([a, b])
        self.db.commit()
        self.db.refresh(a)
        self.db.refresh(b)

        # legacy type to cover normalization branch in GET graph
        self.db.add(ItemLink(source_id=a.id, target_id=b.id, link_type="related", weight=55, ai_reasoning="legacy"))
        self.db.commit()

        data = self._run(get_graph_data(current_user=self.user, db=self.db))
        self.assertEqual(len(data.nodes), 2)
        self.assertEqual(data.links[0].link_type, "relates_to")

        new_link = self._run(
            create_link(
                ItemLinkCreate(source_id=b.id, target_id=a.id, link_type="blocks"),
                current_user=self.user,
                db=self.db,
            )
        )
        self.assertEqual(new_link.link_type, "blocks")

        self._run(delete_link(new_link.id, current_user=self.user, db=self.db))

    def test_graph_routes_error_and_edge_paths(self):
        own = Item(user_id=self.user.id, title="Own", category="task")
        other = Item(user_id=self.other_user.id, title="Other", category="task")
        self.db.add_all([own, other])
        self.db.commit()
        self.db.refresh(own)
        self.db.refresh(other)

        with self.assertRaises(HTTPException) as missing_items:
            self._run(
                create_link(
                    ItemLinkCreate(source_id=own.id, target_id=other.id, link_type="relates_to"),
                    current_user=self.user,
                    db=self.db,
                )
            )
        self.assertEqual(missing_items.exception.status_code, 404)

        with self.assertRaises(HTTPException) as self_link:
            self._run(
                create_link(
                    ItemLinkCreate(source_id=own.id, target_id=own.id, link_type="relates_to"),
                    current_user=self.user,
                    db=self.db,
                )
            )
        self.assertEqual(self_link.exception.status_code, 400)
        with self.assertRaises(HTTPException) as missing_link:
            self._run(delete_link(9999, current_user=self.user, db=self.db))
        self.assertEqual(missing_link.exception.status_code, 404)

    @patch("app.routes.graph.graph_analyzer.analyze")
    def test_graph_analyze_happy_with_skips(self, mock_analyze):
        i1 = Item(user_id=self.user.id, title="A", category="task", status="pending")
        i2 = Item(user_id=self.user.id, title="B", category="idea", status="pending")
        i3 = Item(user_id=self.user.id, title="C", category="thought", status="pending")
        self.db.add_all([i1, i2, i3])
        self.db.commit()
        self.db.refresh(i1)
        self.db.refresh(i2)
        self.db.refresh(i3)

        mock_analyze.return_value = [
            {"source_id": i2.id, "target_id": i3.id, "link_type": "related", "weight": 85, "ai_reasoning": "valid"},
        ]

        result = self._run(analyze_graph(current_user=self.user, db=self.db))
        self.assertEqual(result.created_count, 1)
        self.assertEqual(result.skipped_count, 0)
        self.assertEqual(result.suggested_links[0].link_type, "relates_to")

    # ------------------------------------------------------------------
    # Chat Route Coverage (happy + error + edge)
    # ------------------------------------------------------------------
    @patch("app.routes.chat.extract_memory_candidates")
    @patch("app.routes.chat.active_context_facts")
    @patch("app.routes.chat.orchestrator.route_and_execute")
    def test_chat_routes_happy_and_edge_paths(self, mock_route, mock_context, mock_memory):
        # seed one history message for history endpoint and chat context
        self.db.add(Message(user_id=self.user.id, role="assistant", content="Old", agent_used="brain_dump"))
        self.db.commit()

        mock_context.return_value = ["User studies AI."]
        mock_memory.return_value = [
            {"category": "goal", "fact": "User wants thesis completion", "confidence": 0.8, "reason": "stated"}
        ]
        mock_route.return_value = {
            "agent": "brain_dump",
            "message": "Captured your plan.",
            "items": [],
            "links": [],
            "schedule": [],
            "reflection": None,
        }

        response = self._run(
            send_message(
                ChatMessage(message="I should prepare slides and submit."),
                current_user=self.user,
                db=self.db,
            )
        )

        self.assertEqual(response.agent, "brain_dump")
        self.assertEqual(len(response.items), 0)
        self.assertEqual(len(response.schedule), 0)
        self.assertIsNone(response.reflection)
        self.assertEqual(len(response.memory_candidates), 1)

        # Verify side effects persisted
        self.assertEqual(self.db.query(Item).filter(Item.user_id == self.user.id).count(), 0)
        self.assertGreaterEqual(self.db.query(Message).filter(Message.user_id == self.user.id).count(), 3)

    @patch("app.routes.chat.active_context_facts", return_value=[])
    @patch("app.routes.chat.orchestrator.route_and_execute", side_effect=RuntimeError("boom"))
    def test_chat_send_message_error_path(self, _mock_route, _mock_context):
        with self.assertRaises(RuntimeError):
            self._run(send_message(ChatMessage(message="hello"), current_user=self.user, db=self.db))

    # ------------------------------------------------------------------
    # Orchestrator Coverage with mocked Gemini integration
    # ------------------------------------------------------------------
    def _build_orchestrator(self):
        with (
            patch("app.services.orchestrator.genai.configure"),
            patch("app.services.orchestrator.genai.GenerativeModel", return_value=MagicMock()),
            patch("app.services.orchestrator.BrainDumpAgent") as brain_cls,
            patch("app.services.orchestrator.ReflectionAgent") as reflection_cls,
            patch("app.services.orchestrator.SchedulerAgent") as scheduler_cls,
            patch("app.services.orchestrator.PlannerAgent") as planner_cls,
        ):
            brain_cls.return_value = MagicMock()
            reflection_cls.return_value = MagicMock()
            scheduler_cls.return_value = MagicMock()
            planner_cls.return_value = MagicMock()
            return Orchestrator()

    def test_orchestrator_classify_intent_happy_invalid_and_error(self):
        orch = self._build_orchestrator()

        with patch(
            "app.services.orchestrator.generate_json",
            return_value=RouterLLMResponse(agent="planner", confidence=0.91, reasoning="strategic question"),
        ):
            routed = orch._classify_intent("Am I on track?")
            self.assertEqual(routed["agent"], "planner")

        with patch(
            "app.services.orchestrator.generate_json",
            return_value=SimpleNamespace(agent="unknown", confidence=0.5, reasoning="bad"),
        ):
            routed = orch._classify_intent("anything")
            self.assertEqual(routed["agent"], "brain_dump")

        with patch("app.services.orchestrator.generate_json", side_effect=Exception("llm down")):
            routed = orch._classify_intent("anything")
            self.assertEqual(routed["agent"], "brain_dump")

    def test_orchestrator_route_dispatch_and_fallback(self):
        orch = self._build_orchestrator()
        db = self.db
        with (
            patch.object(orch, "_run_brain_dump", return_value={"agent": "brain_dump"}) as bd,
            patch.object(orch, "_run_reflection", return_value={"agent": "reflection"}) as rf,
            patch.object(orch, "_run_scheduler", return_value={"agent": "scheduler"}) as sc,
            patch.object(orch, "_run_planner", return_value={"agent": "planner"}) as pl,
        ):
            for agent in ["brain_dump", "reflection", "scheduler", "planner", "unknown"]:
                with patch.object(orch, "_classify_intent", return_value={"agent": agent}):
                    result = orch.route_and_execute("x", {}, [], db, self.user.id)
                    self.assertIn("agent", result)
            self.assertTrue(bd.called)
            self.assertTrue(rf.called)
            self.assertTrue(sc.called)
            self.assertTrue(pl.called)

    def test_orchestrator_run_methods_happy_error_and_edge(self):
        orch = self._build_orchestrator()

        # Seed DB state for methods that query history/items
        task = Item(user_id=self.user.id, title="Pending task", category="task", status="pending", priority=7)
        self.db.add(task)
        self.db.add(Conversation(user_id=self.user.id, messages=[{"role": "user", "content": "hi"}]))
        self.db.commit()
        self.db.refresh(task)

        # Brain dump defaults
        orch.agents["brain_dump"].process.return_value = {"agent": "brain_dump", "message": "ok", "items": []}
        bd = orch._run_brain_dump("dump", {}, [], self.db, self.user.id)
        self.assertEqual(bd["agent"], "brain_dump")
        self.assertIn("schedule", bd)
        self.assertIn("reflection", bd)
        self.assertIn("profile_updates", bd)

        # Reflection: happy path persists new reflection
        orch.agents["reflection"].process.return_value = {
            "agent": "reflection",
            "message": "reflect",
            "reflection": {"summary": "s", "patterns": ["p"], "suggestions": ["x"]},
        }
        refl = orch._run_reflection("reflect", {}, [], self.db, self.user.id)
        self.assertEqual(refl["agent"], "reflection")
        self.assertEqual(self.db.query(Reflection).filter(Reflection.user_id == self.user.id).count(), 1)

        # Reflection edge: no reflection payload should not add a row
        existing_count = self.db.query(Reflection).filter(Reflection.user_id == self.user.id).count()
        orch.agents["reflection"].process.return_value = {"agent": "reflection", "message": "none", "reflection": None}
        orch._run_reflection("reflect", {}, [], self.db, self.user.id)
        self.assertEqual(self.db.query(Reflection).filter(Reflection.user_id == self.user.id).count(), existing_count)

        # Scheduler with valid and invalid datetime blocks
        orch.agents["scheduler"].process.return_value = {
            "agent": "scheduler",
            "message": "scheduled",
            "schedule": [
                {
                    "item_id": task.id,
                    "title": "block",
                    "estimated_duration_minutes": 30,
                    "scheduled_start": "2026-01-01T09:00:00",
                    "scheduled_end": "2026-01-01T09:30:00",
                },
                {
                    "item_id": task.id,
                    "title": "bad date",
                    "estimated_duration_minutes": 15,
                    "scheduled_start": "bad-date",
                    "scheduled_end": "bad-date",
                },
            ],
        }
        sch = orch._run_scheduler("plan", {}, [], self.db, self.user.id)
        self.assertEqual(sch["agent"], "scheduler")
        refreshed_task = self.db.query(Item).filter(Item.id == task.id).first()
        self.assertEqual(refreshed_task.estimated_duration, 15)

        # Planner defaults
        orch.agents["planner"].process.return_value = {"agent": "planner", "message": "strategy"}
        planner = orch._run_planner("plan", {}, [], self.db, self.user.id)
        self.assertEqual(planner["agent"], "planner")
        self.assertIn("items", planner)
        self.assertIn("schedule", planner)


if __name__ == "__main__":
    unittest.main()
