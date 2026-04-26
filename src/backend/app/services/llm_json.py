import json
import re
from typing import Any, TypeVar

import google.generativeai as genai
from pydantic import BaseModel, TypeAdapter

T = TypeVar("T", bound=BaseModel)


class LLMJSONError(ValueError):
    """Raised when a model response cannot be parsed or validated as JSON."""


def parse_json_response(text: str) -> dict[str, Any]:
    """Parse strict JSON output with a small salvage path for legacy fenced replies."""
    cleaned = re.sub(r"<think>.*?</think>", "", text or "", flags=re.DOTALL).strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
        if fence_match:
            parsed = json.loads(fence_match.group(1))
        else:
            brace_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if not brace_match:
                raise LLMJSONError(f"No valid JSON found in response: {cleaned[:200]}...")
            parsed = json.loads(brace_match.group(0))

    if not isinstance(parsed, dict):
        raise LLMJSONError("Model response must be a JSON object.")
    return parsed


def validate_json_response(text: str, schema: type[T]) -> T:
    """Parse model output and validate it against a Pydantic schema."""
    return TypeAdapter(schema).validate_python(parse_json_response(text))


def generate_json(
    model: Any,
    prompt: str,
    schema: type[T] | None = None,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 2048,
    retries: int = 1,
) -> T | dict[str, Any]:
    """Generate JSON from a Gemini/Gemma model with bounded retry validation."""
    last_error: Exception | None = None

    for attempt in range(retries + 1):
        retry_prompt = prompt
        if attempt:
            retry_prompt = (
                f"{prompt}\n\nYour previous response was invalid JSON or failed schema validation. "
                "Return ONLY one valid JSON object matching the requested schema."
            )

        try:
            response = model.generate_content(
                retry_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                    response_mime_type="application/json",
                ),
            )
            if schema is None:
                return parse_json_response(response.text)
            return validate_json_response(response.text, schema)
        except Exception as exc:
            last_error = exc

    raise LLMJSONError(f"Could not generate valid JSON after {retries + 1} attempt(s): {last_error}")
