import re
from collections.abc import Iterable

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.profile_update import ProfileUpdate
from app.models.user_context import UserContext
from app.schemas import MemoryExtractionLLMResponse
from app.services.llm_json import generate_json

VALID_MEMORY_CATEGORIES = {"identity", "constraint", "goal", "general"}


def _memory_key(category: str, fact: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", fact.lower()).strip("_")
    return f"{category}:{normalized[:120]}"


def context_fact(context: UserContext) -> str:
    value = context.value_json if isinstance(context.value_json, dict) else {}
    return (value.get("fact") or "").strip()


def active_context_facts(db: Session, user_id: int) -> list[str]:
    entries = db.query(UserContext).filter(UserContext.user_id == user_id).order_by(UserContext.updated_at.desc()).all()
    return [fact for entry in entries if (fact := context_fact(entry))]


def normalize_memory_candidate(candidate: dict) -> dict | None:
    category = candidate.get("category")
    fact = (candidate.get("fact") or "").strip()
    if category not in VALID_MEMORY_CATEGORIES or not fact:
        return None

    confidence = candidate.get("confidence", 0.8)
    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.8

    return {
        "category": category,
        "fact": fact,
        "confidence": max(0.0, min(1.0, confidence)),
        "reason": candidate.get("reason"),
    }


def filter_new_memory_candidates(
    db: Session,
    user_id: int,
    candidates: Iterable[dict],
) -> list[dict]:
    """Normalize candidates and remove duplicates already saved for this user."""
    existing_keys = {key for (key,) in db.query(UserContext.key).filter(UserContext.user_id == user_id).all()}
    seen_keys: set[str] = set()
    filtered: list[dict] = []

    for candidate in candidates:
        normalized = normalize_memory_candidate(candidate)
        if not normalized:
            continue

        key = _memory_key(normalized["category"], normalized["fact"])
        if key in existing_keys or key in seen_keys:
            continue

        seen_keys.add(key)
        filtered.append(normalized)

    return filtered


def _build_memory_extraction_prompt(
    user_input: str,
    existing_facts: Iterable[str],
    agent_message: str | None = None,
) -> str:
    facts_text = "\n".join([f"  - {fact}" for fact in existing_facts if fact]) or "  (None saved yet)"
    assistant_context = f'\n**Assistant Response Context:**\n"{agent_message}"\n' if agent_message else ""
    return f"""You extract only durable, useful long-term memory facts about a user.

Extract facts that should help future planning, scheduling, reflection, or personalization.

Extract:
- Identity: stable role, study field, work, family context, location when durable.
- Constraints: preferences, dislikes, routines, availability, tools, health/time limitations.
- Goals: important medium or long-term objectives.
- General: stable personal details that do not fit the other categories.

Do NOT extract:
- One-off tasks, temporary moods, today's plans, or facts already listed below.
- Sensitive medical, financial, or legal facts unless the user explicitly says they want this remembered.
- Guesses or inferred facts not directly supported by the user's words.

**Existing Saved Facts:**
{facts_text}
{assistant_context}
**User Message:**
"{user_input}"

Return ONLY valid JSON:
{{
  "memory_candidates": [
    {{
      "category": "identity|constraint|goal|general",
      "fact": "Clear objective fact written in third person, e.g. User prefers morning workouts.",
      "confidence": 0.0,
      "reason": "Brief reason this is durable memory."
    }}
  ]
}}"""


def extract_memory_candidates(
    db: Session,
    user_id: int,
    user_input: str,
    *,
    agent_message: str | None = None,
    model=None,
) -> list[dict]:
    """Return unsaved memory candidates; callers decide whether to persist."""
    existing_facts = active_context_facts(db, user_id)

    if model is None:
        settings = get_settings()
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(settings.gemini_flash_model)

    try:
        result = generate_json(
            model,
            _build_memory_extraction_prompt(user_input, existing_facts, agent_message),
            MemoryExtractionLLMResponse,
            temperature=0.1,
            max_output_tokens=1024,
            retries=1,
        )
    except Exception as exc:
        print(f"[ProfileMemory] Candidate extraction failed: {exc}")
        return []

    return filter_new_memory_candidates(
        db,
        user_id,
        [candidate.model_dump() for candidate in result.memory_candidates],
    )


def save_profile_memory(
    db: Session,
    user_id: int,
    *,
    category: str,
    fact: str,
    source: str = "user",
    confidence: float = 1.0,
    reason: str | None = None,
) -> UserContext | None:
    normalized = normalize_memory_candidate(
        {"category": category, "fact": fact, "confidence": confidence, "reason": reason}
    )
    if not normalized:
        return None

    key = _memory_key(normalized["category"], normalized["fact"])
    context = db.query(UserContext).filter(UserContext.user_id == user_id, UserContext.key == key).first()
    old_value = context.value_json if context else None
    new_value = {"category": normalized["category"], "fact": normalized["fact"]}

    if context:
        context.category = normalized["category"]
        context.value_json = new_value
        context.source = source
        context.confidence = normalized["confidence"]
    else:
        context = UserContext(
            user_id=user_id,
            category=normalized["category"],
            key=key,
            value_json=new_value,
            source=source,
            confidence=normalized["confidence"],
        )
        db.add(context)

    db.add(
        ProfileUpdate(
            user_id=user_id,
            category=normalized["category"],
            fact=normalized["fact"],
            old_value_json=old_value,
            new_value_json=new_value,
            source=source,
            reason=reason,
            confidence=normalized["confidence"],
        )
    )
    db.flush()
    return context


def persist_profile_updates(
    db: Session,
    user_id: int,
    updates: Iterable[dict],
    *,
    source: str = "brain_dump",
) -> list[ProfileUpdate]:
    """Store profile memory facts as both current context and append-only events."""
    saved_updates: list[ProfileUpdate] = []

    for update in updates:
        context = save_profile_memory(
            db,
            user_id,
            category=update.get("category"),
            fact=update.get("fact", ""),
            source=source,
            confidence=update.get("confidence", 1.0),
            reason=update.get("reason"),
        )
        if not context:
            continue
        saved_updates.append(
            db.query(ProfileUpdate).filter(ProfileUpdate.user_id == user_id).order_by(ProfileUpdate.id.desc()).first()
        )

    return saved_updates
