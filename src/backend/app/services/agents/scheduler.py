"""
Agent C — Scheduler Agent (gemini-2.5-flash)
Takes tasks and assigns estimated durations and optimal time blocks.
Uses Flash model for fast structured JSON output.
"""

from datetime import datetime
from typing import Any

import google.generativeai as genai

from app.config import get_settings
from app.schemas import SchedulerLLMResponse
from app.services.llm_json import generate_json


class SchedulerAgent:
    """Creates optimized daily/weekly schedules from pending tasks using Gemini Flash."""

    AGENT_NAME = "scheduler"

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.gemini_pro_model)

    def process(
        self, user_input: str, user_profile: dict, chat_history: list[dict], pending_items: list[dict]
    ) -> dict[str, Any]:
        """
        Generate an optimized schedule from the user's pending tasks.

        Returns:
            { "agent": "scheduler", "message": "...", "schedule": [...] }
        """
        if not pending_items:
            return {
                "agent": self.AGENT_NAME,
                "message": "You don't have any pending tasks to schedule! Add some tasks first via Brain Dump.",
                "schedule": [],
            }

        prompt = self._build_prompt(user_input, user_profile, chat_history, pending_items)

        try:
            result = generate_json(
                self.model,
                prompt,
                SchedulerLLMResponse,
                temperature=0.2,
                max_output_tokens=2048,
                retries=1,
            )
            return {
                "agent": self.AGENT_NAME,
                "message": result.summary,
                "schedule": [block.model_dump() for block in result.schedule],
            }
        except Exception as e:
            print(f"[SchedulerAgent] Error: {e}")
            return {
                "agent": self.AGENT_NAME,
                "message": "I had trouble creating your schedule. Please try again.",
                "schedule": [],
            }

    def _build_prompt(
        self, user_input: str, user_profile: dict, chat_history: list[dict], pending_items: list[dict]
    ) -> str:
        """Build the scheduling prompt."""
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_time = datetime.now().strftime("%H:%M")
        profile_facts = user_profile.get("context_facts", [])
        facts_text = "\n".join([f"  - {fact}" for fact in profile_facts]) or "  (None specified yet)"

        items_lines = []
        for item in pending_items:
            deadline_text = f", deadline: {item.get('deadline')}" if item.get("deadline") else ""
            items_lines.append(
                f'  - ID:{item["id"]} | "{item["title"]}" | '
                f"priority:{item.get('priority', 5)} | "
                f"category:{item.get('category', 'task')}"
                f"{deadline_text}"
            )
        items_text = "\n".join(items_lines)

        history_text = ""
        if chat_history:
            history_lines = []
            for msg in chat_history:
                role = "Assistant" if msg.get("role") == "assistant" else "User"
                history_lines.append(f"[{role}]: {msg.get('content')}")
            history_text = "\n**Recent Conversation History:**\n" + "\n".join(history_lines) + "\n"

        return f"""You are a personal scheduling assistant. Create an optimized daily schedule from pending tasks.

**Today:** {current_date} | **Now:** {current_time}

**Known Long-Term Facts:**
{facts_text}

**Pending Tasks:**
{items_text}
{history_text}
**User's Request:** "{user_input}"

**Rules:**
1. Prioritize tasks with deadlines and higher priority scores.
2. Place demanding tasks in the morning (09:00-12:00).
3. Schedule breaks between intensive blocks.
4. Estimate realistic durations (15-120 min per block).
5. Don't schedule past 20:00 unless asked.
6. If too many tasks, schedule highest priority and note the rest.

**Output JSON:**
{{"summary": "Friendly 2-3 sentence summary.", "schedule": [{{"item_id": <int>, "title": "...", "estimated_duration_minutes": <int>, "scheduled_start": "YYYY-MM-DDTHH:MM:SS", "scheduled_end": "YYYY-MM-DDTHH:MM:SS"}}]}}

Return ONLY valid JSON."""
