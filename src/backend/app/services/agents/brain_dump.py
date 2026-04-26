"""
Agent A — Brain Dump Agent (gemini-2.5-flash)
Handles unstructured chaotic thoughts, parsing them into actionable tasks and categories.
This is the core classification engine migrated from the original ClassificationService.
"""

from datetime import datetime
from typing import Any

import google.generativeai as genai

from app.config import get_settings
from app.schemas import BrainDumpLLMResponse
from app.services.llm_json import generate_json


class BrainDumpAgent:
    """Classifies user brain dumps into structured items using Gemini Flash."""

    AGENT_NAME = "brain_dump"

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.gemini_flash_model)

    def process(
        self, user_input: str, user_profile: dict, chat_history: list[dict], existing_items: list[dict] = None
    ) -> dict[str, Any]:
        """
        Main entry point. Classifies input and returns structured agent response.

        Args:
            user_input: Raw text from the user
            user_profile: User's goals, personality, and life areas
            existing_items: Optional list of existing items for link detection

        Returns:
            {
                "agent": "brain_dump",
                "message": "Friendly response text",
                "items": [...classified items...],
                "links": [...detected links between items...]
            }
        """
        extraction = self._classify_input(user_input, user_profile, chat_history)
        classified_items = extraction.get("extracted_items", [])
        links = self._detect_links(classified_items, existing_items or [])
        message = self._generate_response(user_input, classified_items, user_profile.get("name"))

        return {
            "agent": self.AGENT_NAME,
            "message": message,
            "items": classified_items,
            "profile_updates": extraction.get("profile_updates", []),
            "links": links,
        }

    def _classify_input(
        self, user_input: str, user_profile: dict, chat_history: list[dict]
    ) -> dict[str, list[dict[str, Any]]]:
        """Classify user's brain dump into structured items."""
        prompt = self._build_classification_prompt(user_input, user_profile, chat_history)

        try:
            result = generate_json(
                self.model,
                prompt,
                BrainDumpLLMResponse,
                temperature=0.3,
                max_output_tokens=2048,
                retries=1,
            )
            return {
                "extracted_items": [item.model_dump() for item in result.extracted_items],
                "profile_updates": [update.model_dump() for update in result.profile_updates],
            }

        except Exception as e:
            print(f"[BrainDumpAgent] Classification error: {e}")
            return {"extracted_items": [], "profile_updates": []}

    def _build_classification_prompt(self, user_input: str, user_profile: dict, chat_history: list[dict]) -> str:
        """Build the complete prompt including system instructions and user context."""
        goals = user_profile.get("goals", {})
        life_areas = user_profile.get("life_areas", [])
        profile_facts = user_profile.get("context_facts", [])

        goals_text = "\n".join([f"  - {area.capitalize()}: {goal}" for area, goal in goals.items()])
        facts_text = "\n".join([f"  - {fact}" for fact in profile_facts])
        current_date = datetime.now().strftime("%Y-%m-%d")

        history_text = ""
        if chat_history:
            history_text = "\n**Recent Conversation History:**\n"
            for msg in chat_history:
                role = "Assistant" if msg.get("role") == "assistant" else "User"
                history_text += f"[{role}]: {msg.get('content')}\n"

        return f"""You are the "Brain Dump & Memory Agent" for a Personal OS. The user will dictate chaotic streams of consciousness.

YOUR TASKS:
1. Extract actionable items (Tasks, Ideas, Thoughts).
2. MEMORY EXTRACTION: Listen for any "Long-Term Facts" the user mentions about themselves.

WHAT IS A LONG-TERM FACT?
- Core Identity: "I am a frontend developer", "I am studying AI".
- Constraints/Preferences: "I only work out in the mornings", "I hate using Java".
- Major Life Events/Goals: "I am moving to Berlin next month", "My goal for Q3 is to launch this app".
Do NOT extract short-term states as facts (e.g., "I am tired today", "I need to buy milk").

ITEM CLASSIFICATION RULES:
- category must be strictly one of: task, idea, thought.
- Keep item titles concise and put details in description.
- Be generous in extracting items, but do not invent items.
- Use today's date for date reasoning: {current_date}.

---

**User Profile:**
Life Areas: {", ".join(life_areas) if life_areas else "Not specified"}
Goals:
{goals_text if goals_text else "  (None specified yet)"}
Known Long-Term Facts:
{facts_text if facts_text else "  (None specified yet)"}
{history_text}
**User Input:**
"{user_input}"

OUTPUT FORMAT:
You must output ONLY valid JSON in the following structure. If no long-term facts are detected in the current input, leave the `profile_updates` array empty.

{{
  "extracted_items": [
    {{
      "title": "string",
      "category": "string (task, idea, thought)",
      "description": "string"
    }}
  ],
  "profile_updates": [
    {{
      "category": "string (identity, constraint, goal, general)",
      "fact": "string (the extracted fact translated into a clear, objective statement, e.g., 'User prefers working out in the mornings.')"
    }}
  ]
}}"""

    def _detect_links(self, new_items: list[dict], existing_items: list[dict]) -> list[dict]:
        """
        Detect potential links between newly classified items and existing items.
        Uses simple keyword matching for now — can be upgraded to semantic similarity later.
        """
        links = []
        if not existing_items:
            return links

        for new_item in new_items:
            new_title = new_item.get("title", "").lower()
            new_area = new_item.get("life_area", "").lower()

            for existing in existing_items:
                existing_title = existing.get("title", "").lower()
                existing_area = existing.get("life_area", "").lower()

                # Link if same life area and overlapping keywords
                if new_area and new_area == existing_area:
                    new_words = set(new_title.split())
                    existing_words = set(existing_title.split())
                    common = new_words & existing_words - {"the", "a", "an", "to", "for", "and", "or", "my", "i"}
                    if len(common) >= 1:
                        links.append(
                            {
                                "source_title": new_item["title"],
                                "target_id": existing.get("id"),
                                "link_type": "relates_to",
                            }
                        )

        return links

    def _generate_response(self, user_input: str, classified_items: list[dict], user_name: str = None) -> str:
        """Generate a friendly AI response summarizing the classification."""
        if not classified_items:
            return "I understood your message, but I couldn't identify any specific tasks or items to track. Could you clarify what you'd like me to help with?"

        greeting = f"Got it{', ' + user_name if user_name else ''}! "

        # Group by category
        by_category = {}
        for item in classified_items:
            cat = item["category"]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(item)

        # Build response
        response_parts = [greeting + "Let me organize that for you:\n"]

        category_emojis = {"task": "✅", "idea": "💡", "thought": "💭"}

        for category, items in by_category.items():
            emoji = category_emojis.get(category, "•")
            cat_name = category.upper()

            for item in items:
                title = item["title"]
                deadline = item.get("deadline")
                subcategory = item.get("subcategory", "")
                deadline_text = f" (by {deadline[:10]})" if deadline else ""
                subcat_text = f" [{subcategory}]" if subcategory else ""

                response_parts.append(f"\n{emoji} {cat_name}{subcat_text}: {title}{deadline_text}")

                # Add contextual follow-up
                if subcategory == "obligation" and deadline:
                    response_parts.append("   → Added to your priorities. Would you like me to help break this down?")
                elif subcategory in ["habit", "goal"]:
                    response_parts.append("   → Tracking this for you!")
                elif category == "thought":
                    response_parts.append("   → Saved for reflection.")

        return "".join(response_parts)
