"""
Agent B — Reflection Agent (gemma-4-31b-it)
A conversational agent that reads past logs from the database to build
an evolving, summarized profile of the user's mental state and habits.
Uses Gemma 4 31B for deep reasoning with native thinking capabilities.
"""

import google.generativeai as genai
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from app.config import get_settings
from app.schemas import ReflectionLLMResponse
from app.services.llm_json import generate_json


class ReflectionAgent:
    """Analyzes user history and provides mental-state reflections using Gemma 4 31B."""

    AGENT_NAME = "reflection"

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.gemini_pro_model)

    def process(
        self,
        user_input: str,
        user_profile: dict,
        chat_history: List[Dict],
        recent_items: List[Dict],
        recent_conversations: List[Dict],
        last_reflection: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Analyze user's history and provide a reflective response.

        Args:
            user_input: The user's reflective query
            user_profile: User's goals, personality, life areas
            chat_history: Last 10 messages for immediate context
            recent_items: Last N items from the database
            recent_conversations: Last N conversation entries
            last_reflection: Most recent reflection summary, if any

        Returns:
            {
                "agent": "reflection",
                "message": "Conversational response",
                "reflection": {
                    "summary": "Updated mental-state summary",
                    "patterns": ["pattern1", ...],
                    "suggestions": ["suggestion1", ...]
                }
            }
        """
        prompt = self._build_prompt(
            user_input, user_profile, chat_history, recent_items,
            recent_conversations, last_reflection
        )

        try:
            result = generate_json(
                self.model,
                prompt,
                ReflectionLLMResponse,
                temperature=0.7,
                max_output_tokens=4096,
                retries=1,
            )

            return {
                "agent": self.AGENT_NAME,
                "message": result.conversational_response,
                "reflection": {
                    "summary": result.mental_state_summary,
                    "patterns": result.patterns,
                    "suggestions": result.suggestions,
                },
            }

        except Exception as e:
            print(f"[ReflectionAgent] Error: {e}")
            return {
                "agent": self.AGENT_NAME,
                "message": "I had trouble analyzing your history right now. Let's try again in a moment.",
                "reflection": None,
            }

    def _build_prompt(
        self,
        user_input: str,
        user_profile: dict,
        chat_history: List[Dict],
        recent_items: List[Dict],
        recent_conversations: List[Dict],
        last_reflection: Optional[Dict],
    ) -> str:
        """Build the reflection analysis prompt with full historical context."""
        goals = user_profile.get("goals", {})
        life_areas = user_profile.get("life_areas", [])
        user_name = user_profile.get("name", "User")
        profile_facts = user_profile.get("context_facts", [])
        facts_text = "\n".join([f"  - {fact}" for fact in profile_facts]) or "  (None specified yet)"

        # Format items history
        items_text = ""
        if recent_items:
            items_lines = []
            for item in recent_items[:50]:  # Cap at 50 items
                status = item.get("status", "pending")
                cat = item.get("category", "unknown")
                title = item.get("title", "")
                created = item.get("created_at", "")
                items_lines.append(f"  [{status}] ({cat}) {title} — created {created}")
            items_text = "\n".join(items_lines)
        else:
            items_text = "  (No items yet)"

        # Format chat history
        history_text = ""
        if chat_history:
            history_lines = []
            for msg in chat_history:
                role = "Assistant" if msg.get("role") == "assistant" else "User"
                content = msg.get("content", "")
                history_lines.append(f"  [{role}]: {content}")
            history_text = "\n".join(history_lines)
        else:
            history_text = "  (No recent messages)"

        # Format old conversation history (from previous architecture, if any)
        conv_text = ""
        if recent_conversations:
            conv_lines = []
            for conv in recent_conversations[:10]:  # Cap at 10
                messages = conv.get("messages", [])
                for msg in messages:
                    role = msg.get("role", "")
                    content = msg.get("content", "")[:200]  # Truncate
                    conv_lines.append(f"  [{role}]: {content}")
            conv_text = "\n".join(conv_lines)
        else:
            conv_text = "  (No old conversation history)"

        # Format previous reflection
        prev_reflection_text = ""
        if last_reflection:
            prev_reflection_text = f"""
**Previous Reflection Summary:**
{last_reflection.get('summary', 'None')}

**Previously Identified Patterns:**
{json.dumps(last_reflection.get('patterns', []), indent=2)}
"""
        else:
            prev_reflection_text = "**Previous Reflection:** None (first reflection session)"

        return f"""You are a thoughtful personal reflection advisor for {user_name}. Your role is to deeply analyze the user's recent activities, tasks, thoughts, and conversations to provide insightful observations about their mental state, behavioral patterns, and habits.

**IMPORTANT: Deep Analysis Required**
Before writing your response, carefully study ALL the data provided below. Cross-reference the conversation history with the items database to find hidden patterns. Consider:
- What themes keep recurring across messages and tasks?
- Are there signs of stress, motivation, procrastination, or growth?
- How do their recent actions align with their stated goals?
- What emotional undertones do you detect in their messages?

**User's Life Areas:** {', '.join(life_areas) if life_areas else 'Not specified'}
**User's Goals:**
{json.dumps(goals, indent=2) if goals else '  (None specified)'}

**Known Long-Term Facts:**
{facts_text}

---

**Recent Items (Tasks, Ideas, Thoughts):**
{items_text}

**Old Conversations (Legacy):**
{conv_text}

**Recent Conversation History (Immediate Context):**
{history_text}

{prev_reflection_text}

---

**User's Current Message:**
"{user_input}"

---

**Your Task:**
1. Deeply analyze the user's recent activity for behavioral patterns (e.g., procrastination, focus areas, emotional state, productivity trends).
2. Update the mental-state summary based on all available data.
3. Provide a warm, empathetic conversational response that addresses what the user said.
4. Offer 2-3 actionable suggestions based on the patterns you identify.

You MUST respond with ONLY a valid JSON object (no extra text before or after), in this exact format:
{{
  "conversational_response": "A warm, personalized response addressing the user's message and sharing key insights. 2-4 paragraphs.",
  "mental_state_summary": "A concise paragraph summarizing the user's current mental state, habits, and trajectory.",
  "patterns": ["Pattern 1: description", "Pattern 2: description"],
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2"]
}}

Be empathetic, not clinical. You're a trusted advisor, not a therapist. Ground your observations in the actual data you see."""
