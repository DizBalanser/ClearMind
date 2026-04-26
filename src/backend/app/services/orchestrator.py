"""
Orchestrator — Central Router (gemini-2.5-flash)
Analyzes user input and routes to the appropriate specialized agent.
Uses Flash model for minimal latency on the routing decision.
"""

import google.generativeai as genai
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.item import Item
from app.models.conversation import Conversation
from app.models.reflection import Reflection
from app.models.item_link import ItemLink
from app.schemas import RouterLLMResponse
from app.services.agents.brain_dump import BrainDumpAgent
from app.services.agents.reflection import ReflectionAgent
from app.services.agents.scheduler import SchedulerAgent
from app.services.agents.planner import PlannerAgent
from app.services.llm_json import generate_json


class Orchestrator:
    """
    Routes user messages to the appropriate agent based on intent classification.
    Uses gemini-2.5-flash for fast routing decisions.
    """

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.router_model = genai.GenerativeModel(settings.gemini_flash_model)

        # Initialize all agents
        self.agents = {
            "brain_dump": BrainDumpAgent(),
            "reflection": ReflectionAgent(),
            "scheduler": SchedulerAgent(),
            "planner": PlannerAgent(),
        }

    def route_and_execute(
        self,
        user_input: str,
        user_profile: dict,
        chat_history: List[Dict[str, Any]],
        db: Session,
        user_id: int,
    ) -> Dict[str, Any]:
        """
        Main entry point. Routes the user's message to the correct agent and returns the result.

        Args:
            user_input: The raw user message
            user_profile: User's goals, personality, life areas, name
            db: Database session for querying history
            user_id: Current user's ID

        Returns:
            Standardized agent response dict with keys:
            - agent: str (which agent handled it)
            - message: str (response text)
            - items: list (classified items, if any)
            - schedule: list (schedule blocks, if any)
            - reflection: dict or None (reflection data, if any)
            - links: list (detected item links, if any)
        """
        # Step 1: Route to the correct agent
        routing = self._classify_intent(user_input)
        agent_name = routing.get("agent", "brain_dump")

        # Step 2: Execute the selected agent
        if agent_name == "brain_dump":
            return self._run_brain_dump(user_input, user_profile, chat_history, db, user_id)
        elif agent_name == "reflection":
            return self._run_reflection(user_input, user_profile, chat_history, db, user_id)
        elif agent_name == "scheduler":
            return self._run_scheduler(user_input, user_profile, chat_history, db, user_id)
        elif agent_name == "planner":
            return self._run_planner(user_input, user_profile, chat_history, db, user_id)
        else:
            # Fallback to brain_dump
            return self._run_brain_dump(user_input, user_profile, chat_history, db, user_id)

    def _classify_intent(self, user_input: str) -> Dict[str, Any]:
        """Use Flash to quickly classify the user's intent for routing."""
        prompt = f"""You are a router that classifies user messages into exactly one agent category.

**Agents:**
- "brain_dump": For unstructured thoughts, task lists, ideas, things the user wants to capture and organize. Keywords: "I need to", "remind me", "I have an idea", listing tasks, capturing thoughts.
- "reflection": For introspective questions about patterns, habits, mental state, how they've been doing. Keywords: "how am I doing", "what patterns", "reflect", "my habits", "mental state".
- "scheduler": For scheduling, planning a day/week, time management, organizing when to do things. Keywords: "plan my day", "schedule", "when should I", "organize my time", "weekly plan".
- "planner": For strategic/long-term questions about goals, life direction, progress assessment. Keywords: "am I on track", "my goals", "career progress", "long-term", "strategic", "life plan".

**User Message:** "{user_input}"

Return JSON: {{"agent": "brain_dump|reflection|scheduler|planner", "confidence": 0.0-1.0, "reasoning": "brief explanation"}}"""

        try:
            result = generate_json(
                self.router_model,
                prompt,
                RouterLLMResponse,
                temperature=0.1,
                max_output_tokens=1024,
                retries=1,
            )
            agent = result.agent

            # Validate agent name
            if agent not in self.agents:
                agent = "brain_dump"

            print(f"[Orchestrator] Routed to '{agent}' (confidence: {result.confidence}): {result.reasoning}")
            return {"agent": agent}

        except Exception as e:
            print(f"[Orchestrator] Routing error, falling back to brain_dump: {e}")
            return {"agent": "brain_dump"}

    def _run_brain_dump(self, user_input: str, user_profile: dict, chat_history: List[Dict], db: Session, user_id: int) -> Dict[str, Any]:
        """Execute Brain Dump agent with existing items for link detection."""
        existing_items = db.query(Item).filter(Item.user_id == user_id).order_by(Item.created_at.desc()).limit(50).all()
        existing_items_data = [
            {"id": i.id, "title": i.title, "life_area": i.life_area, "category": i.category}
            for i in existing_items
        ]

        result = self.agents["brain_dump"].process(user_input, user_profile, chat_history, existing_items_data)

        # Ensure standard response shape
        result.setdefault("schedule", [])
        result.setdefault("reflection", None)
        result.setdefault("profile_updates", [])
        return result

    def _run_reflection(self, user_input: str, user_profile: dict, chat_history: List[Dict], db: Session, user_id: int) -> Dict[str, Any]:
        """Execute Reflection agent with historical context."""
        # Get recent items
        recent_items = db.query(Item).filter(Item.user_id == user_id).order_by(Item.created_at.desc()).limit(50).all()
        recent_items_data = [
            {
                "id": i.id, "title": i.title, "category": i.category,
                "subcategory": i.subcategory, "status": i.status,
                "life_area": i.life_area, "priority": i.priority,
                "created_at": i.created_at.isoformat() if i.created_at else "",
            }
            for i in recent_items
        ]

        # Get recent conversations
        recent_convos = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(Conversation.created_at.desc()).limit(10).all()
        recent_convos_data = [{"messages": c.messages} for c in recent_convos]

        # Get last reflection
        last_reflection = db.query(Reflection).filter(
            Reflection.user_id == user_id
        ).order_by(Reflection.created_at.desc()).first()
        last_reflection_data = None
        if last_reflection:
            last_reflection_data = {
                "summary": last_reflection.summary,
                "patterns": last_reflection.patterns or [],
                "suggestions": last_reflection.suggestions or [],
            }

        result = self.agents["reflection"].process(
            user_input, user_profile, chat_history,
            recent_items_data, recent_convos_data, last_reflection_data
        )

        # Save the new reflection if we got one
        if result.get("reflection"):
            new_reflection = Reflection(
                user_id=user_id,
                summary=result["reflection"].get("summary", ""),
                patterns=result["reflection"].get("patterns", []),
                suggestions=result["reflection"].get("suggestions", []),
            )
            db.add(new_reflection)
            db.commit()

        # Ensure standard response shape
        result.setdefault("items", [])
        result.setdefault("schedule", [])
        result.setdefault("links", [])
        result.setdefault("profile_updates", [])
        return result

    def _run_scheduler(self, user_input: str, user_profile: dict, chat_history: List[Dict], db: Session, user_id: int) -> Dict[str, Any]:
        """Execute Scheduler agent with pending tasks."""
        pending_items = db.query(Item).filter(
            Item.user_id == user_id,
            Item.status == "pending",
            Item.category == "task",
        ).order_by(Item.priority.desc(), Item.deadline.asc()).all()

        pending_data = [
            {
                "id": i.id, "title": i.title, "priority": i.priority,
                "category": i.category, "subcategory": i.subcategory,
                "deadline": i.deadline.isoformat() if i.deadline else None,
            }
            for i in pending_items
        ]

        result = self.agents["scheduler"].process(user_input, user_profile, chat_history, pending_data)

        # Update items with schedule data
        for block in result.get("schedule", []):
            item_id = block.get("item_id")
            if item_id:
                item = db.query(Item).filter(Item.id == item_id, Item.user_id == user_id).first()
                if item:
                    item.estimated_duration = block.get("estimated_duration_minutes")
                    try:
                        from datetime import datetime
                        if block.get("scheduled_start"):
                            item.scheduled_start = datetime.fromisoformat(block["scheduled_start"])
                        if block.get("scheduled_end"):
                            item.scheduled_end = datetime.fromisoformat(block["scheduled_end"])
                    except (ValueError, TypeError):
                        pass
        db.commit()

        # Ensure standard response shape
        result.setdefault("items", [])
        result.setdefault("reflection", None)
        result.setdefault("links", [])
        result.setdefault("profile_updates", [])
        return result

    def _run_planner(self, user_input: str, user_profile: dict, chat_history: List[Dict], db: Session, user_id: int) -> Dict[str, Any]:
        """Execute Planner agent with all items."""
        all_items = db.query(Item).filter(Item.user_id == user_id).all()
        all_items_data = [
            {
                "id": i.id, "title": i.title, "category": i.category,
                "subcategory": i.subcategory, "status": i.status,
                "life_area": i.life_area, "priority": i.priority,
            }
            for i in all_items
        ]

        result = self.agents["planner"].process(user_input, user_profile, chat_history, all_items_data)

        # Ensure standard response shape
        result.setdefault("items", [])
        result.setdefault("schedule", [])
        result.setdefault("links", [])
        result.setdefault("profile_updates", [])
        return result


# Singleton instance
orchestrator = Orchestrator()
