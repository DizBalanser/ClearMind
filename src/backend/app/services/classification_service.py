import google.generativeai as genai
from typing import List, Dict, Any
import json
from datetime import datetime
from app.config import get_settings

settings = get_settings()


class ClassificationService:
    """Service for classifying user inputs using Google Gemini"""
    
    def __init__(self):
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def classify_input(self, user_input: str, user_profile: dict) -> List[Dict[str, Any]]:
        """
        Classify user's brain dump into structured items
        
        Args:
            user_input: The raw text from the user
            user_profile: User's goals, personality, and life areas
        
        Returns:
            List of classified items with structure:
            [{
                "title": "Exam on Friday",
                "description": "Database exam",
                "category": "obligation",
                "life_area": "career",
                "deadline": "2026-01-10T00:00:00",
                "priority": 9
            }, ...]
        """
        prompt = self._build_full_prompt(user_input, user_profile)
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    response_mime_type="application/json"
                )
            )
            
            result = json.loads(response.text)
            return result.get("items", [])
        
        except Exception as e:
            print(f"Error in classification: {e}")
            return []
    
    def _build_full_prompt(self, user_input: str, user_profile: dict) -> str:
        """Build the complete prompt including system instructions and user context"""
        goals = user_profile.get('goals', {})
        life_areas = user_profile.get('life_areas', [])
        
        goals_text = "\n".join([f"  - {area.capitalize()}: {goal}" for area, goal in goals.items()])
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        return f"""You are a personal productivity assistant that classifies user inputs into structured items.

Your job is to:
1. Identify discrete entries from unstructured text
2. Classify each item into the correct MAIN CATEGORY and SUBCATEGORY
3. Extract deadlines if mentioned
4. Assign appropriate life areas
5. Calculate priority based on urgency and user goals

**Main Categories & Subcategories:**

1. **task**: Actionable items that need to be done
   - Subcategories: obligation (hard deadlines), goal (milestones), habit (recurring), deadline (time-sensitive)

2. **idea**: Creative or future-oriented concepts
   - Subcategories: project (buildable), creative (artistic), improvement (optimization)

3. **thought**: Reflections, learnings, and mental notes
   - Subcategories: reflection (self-insight), learning (knowledge), memory (remember), question (to explore)

**Life Areas:**
career, health, learning, relationships, hobbies, finance, personal

**Priority Scale (1-10):**
- 9-10: Urgent with near deadline (tomorrow, this week)
- 7-8: Important for user's main goals
- 5-6: Moderate importance
- 3-4: Low priority or far future
- 1-2: Ideas and thoughts for later

**Output Format:**
Return JSON: {{"items": [{{"title": "...", "description": "...", "category": "task|idea|thought", "subcategory": "...", "life_area": "...", "deadline": "YYYY-MM-DDTHH:MM:SS or null", "priority": 1-10}}]}}

**Guidelines:**
- Extract date/time mentions and convert to ISO format (assume current year if not specified)
- If no specific date, leave deadline as null
- Be generous in extracting items - don't miss anything the user mentioned
- Keep titles concise (under 50 chars), put details in description
- Default to 'task' category if uncertain

---

**Today's Date:** {current_date}

**User Profile:**
Life Areas: {', '.join(life_areas) if life_areas else 'Not specified'}
Goals:
{goals_text if goals_text else '  (None specified yet)'}

**User Input:**
"{user_input}"

Classify this input into structured items. Extract all distinct tasks/ideas/thoughts the user mentioned.
Return ONLY valid JSON with the items array."""
    
    def generate_response(self, user_input: str, classified_items: List[Dict], user_name: str = None) -> str:
        """
        Generate a friendly AI response summarizing the classification
        
        Args:
            user_input: Original user message
            classified_items: The classified items
            user_name: Optional user name for personalization
        
        Returns:
            Friendly response text
        """
        if not classified_items:
            return "I understood your message, but I couldn't identify any specific tasks or items to track. Could you clarify what you'd like me to help with?"
        
        greeting = f"Got it{', ' + user_name if user_name else ''}! "
        
        # Group by category
        by_category = {}
        for item in classified_items:
            cat = item['category']
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(item)
        
        # Build response
        response_parts = [greeting + "Let me organize that for you:\n"]
        
        category_emojis = {
            'task': '✅',
            'idea': '💡',
            'thought': '💭'
        }
        
        for category, items in by_category.items():
            emoji = category_emojis.get(category, '•')
            cat_name = category.upper()
            
            for item in items:
                title = item['title']
                deadline = item.get('deadline')
                subcategory = item.get('subcategory', '')
                deadline_text = f" (by {deadline[:10]})" if deadline else ""
                subcat_text = f" [{subcategory}]" if subcategory else ""
                
                response_parts.append(f"\n{emoji} {cat_name}{subcat_text}: {title}{deadline_text}")
                
                # Add contextual follow-up
                if subcategory == 'obligation' and deadline:
                    response_parts.append(f"   → Added to your priorities. Would you like me to help break this down?")
                elif subcategory in ['habit', 'goal']:
                    response_parts.append(f"   → Tracking this for you!")
                elif category == 'thought':
                    response_parts.append(f"   → Saved for reflection.")
        
        return "".join(response_parts)


# Singleton instance
classification_service = ClassificationService()
