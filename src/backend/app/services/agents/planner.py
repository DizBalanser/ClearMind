"""
Agent D — Strategic Life Planner (gemma-4-31b-it)
Acts as an adviser, looking at long-term Goals in the database and
cross-referencing them with daily actions. Uses Gemma 4 31B for deep reasoning.
"""

import json
from typing import Any

import google.generativeai as genai

from app.config import get_settings
from app.schemas import PlannerLLMResponse
from app.services.llm_json import generate_json


class PlannerAgent:
    """Provides strategic life advice by cross-referencing goals with actions using Gemma 4 31B."""

    AGENT_NAME = "planner"

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.gemini_pro_model)

    def process(
        self, user_input: str, user_profile: dict, chat_history: list[dict], all_items: list[dict]
    ) -> dict[str, Any]:
        """
        Analyze alignment between user's goals and their actual activity.

        Returns:
            { "agent": "planner", "message": "Strategic advice...", "reflection": {...} }
        """
        prompt = self._build_prompt(user_input, user_profile, chat_history, all_items)

        try:
            result = generate_json(
                self.model,
                prompt,
                PlannerLLMResponse,
                temperature=0.7,
                max_output_tokens=4096,
                retries=1,
            )
            return {
                "agent": self.AGENT_NAME,
                "message": result.strategic_advice,
                "reflection": {
                    "summary": result.alignment_summary,
                    "patterns": result.gap_analysis,
                    "suggestions": result.action_items,
                },
            }
        except Exception as e:
            print(f"[PlannerAgent] Error: {e}")
            return {
                "agent": self.AGENT_NAME,
                "message": "I had trouble analyzing your goals right now. Please try again.",
                "reflection": None,
            }

    def _build_prompt(
        self, user_input: str, user_profile: dict, chat_history: list[dict], all_items: list[dict]
    ) -> str:
        """Build the strategic planning prompt."""
        goals = user_profile.get("goals", {})
        life_areas = user_profile.get("life_areas", [])
        user_name = user_profile.get("name", "User")
        profile_facts = user_profile.get("context_facts", [])
        facts_text = "\n".join([f"  - {fact}" for fact in profile_facts]) or "  (None specified yet)"

        # Separate items by status
        completed = [i for i in all_items if i.get("status") == "done"]
        pending = [i for i in all_items if i.get("status") == "pending"]
        ideas = [i for i in all_items if i.get("category") == "idea"]

        def format_items(items_list: list[dict], limit: int = 30) -> str:
            if not items_list:
                return "  (None)"
            lines = []
            for item in items_list[:limit]:
                lines.append(f"  - ({item.get('category')}/{item.get('subcategory', 'general')}) {item.get('title')}")
            return "\n".join(lines)

        history_text = ""
        if chat_history:
            history_lines = []
            for msg in chat_history:
                role = "Assistant" if msg.get("role") == "assistant" else "User"
                history_lines.append(f"[{role}]: {msg.get('content')}")
            history_text = "\n**Recent Conversation History:**\n" + "\n".join(history_lines) + "\n"

        return f"""You are a strategic life advisor for {user_name}. Your role is to deeply analyze the alignment between their stated goals and actual behavior.

**IMPORTANT: Deep Analysis Required**
Before writing your response, carefully cross-reference the conversation history, completed tasks, pending tasks, and ideas against the user's stated goals. Consider:
- Which goals have active tasks supporting them? Which are neglected?
- What does the pattern of completed vs pending tasks reveal about execution habits?
- Are there ideas that could be converted into concrete goal-aligned tasks?
- What does the recent conversation history reveal about the user's current priorities and mindset?

**User's Goals:**
{json.dumps(goals, indent=2) if goals else "(No goals defined yet)"}

**Life Areas:** {", ".join(life_areas) if life_areas else "Not specified"}

**Known Long-Term Facts:**
{facts_text}

**Completed Tasks ({len(completed)}):**
{format_items(completed)}

**Pending Tasks ({len(pending)}):**
{format_items(pending)}

**Ideas & Thoughts ({len(ideas)}):**
{format_items(ideas)}
{history_text}
**User's Question:** "{user_input}"

**Your Task:**
1. Assess how well the user's daily actions align with their stated goals.
2. Identify gaps — goals that have no corresponding tasks or activity.
3. Identify strengths — areas where the user is making consistent progress.
4. Provide concrete, actionable next steps to better align actions with goals.

You MUST respond with ONLY a valid JSON object (no extra text before or after), in this exact format:
{{
  "strategic_advice": "A warm, 3-4 paragraph strategic analysis addressing the user's question. Be specific, referencing actual tasks and goals.",
  "alignment_summary": "One paragraph summarizing goal-action alignment.",
  "gap_analysis": ["Gap 1: description", "Gap 2: description"],
  "action_items": ["Specific action 1", "Specific action 2", "Specific action 3"]
}}

Be encouraging but honest. Ground advice in their actual data."""
