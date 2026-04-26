import json
from typing import Any

import google.generativeai as genai

from app.config import get_settings
from app.schemas import GraphAnalyzerLLMResponse
from app.services.llm_json import generate_json


class GraphAnalyzerAgent:
    """Discovers semantic item links for the knowledge graph using Gemma."""

    AGENT_NAME = "graph_analyzer"

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.gemini_pro_model)

    def analyze(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if len(items) < 2:
            return []

        prompt = self._build_prompt(items)
        try:
            result = generate_json(
                self.model,
                prompt,
                GraphAnalyzerLLMResponse,
                temperature=0.2,
                max_output_tokens=4096,
                retries=1,
            )
            return [
                link.model_dump()
                for link in result.suggested_links
                if link.weight > 20 and link.source_id != link.target_id
            ]
        except Exception as exc:
            print(f"[GraphAnalyzerAgent] Error: {exc}")
            return []

    def _build_prompt(self, items: list[dict[str, Any]]) -> str:
        return f"""You are the "Graph Analyzer Agent" for a Personal OS. Your core function is to analyze a list of unstructured user items (Tasks, Thoughts, Ideas) and discover hidden, meaningful semantic relationships between them.

INPUT FORMAT:
You will receive a JSON list of items. Each item has an `id`, `type`, `title`, `description`, and `tags`.

YOUR TASK:
Analyze the items and find pairs that have a logical connection but are not yet linked. For each discovered connection, calculate a "Connection Weight" from 0 to 100 based on the following criteria:
- 10-30: Weak connection (Loose conceptual overlap).
- 40-60: Medium connection (Shared project, similar tags, chronological evolution).
- 70-100: Strong connection (Direct dependency, one item solves the other, duplicate concepts, strict parent-child task relationship).

RULES:
1. Do NOT force connections. If two items are unrelated, do not link them.
2. Only suggest links with a weight greater than 20.
3. Keep the `ai_reasoning` extremely concise (under 15 words).

ITEMS:
{json.dumps(items, ensure_ascii=True, indent=2)}

OUTPUT FORMAT:
You must output ONLY valid JSON in the exact following structure, with no markdown formatting or conversational text:
{{
  "suggested_links": [
    {{
      "source_id": "integer",
      "target_id": "integer",
      "link_type": "string (strictly one of: subtask_of, relates_to, blocks, updates)",
      "weight": "integer (0-100)",
      "ai_reasoning": "string (short explanation)"
    }}
  ]
}}"""


graph_analyzer = GraphAnalyzerAgent()
