from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile_update import ProfileUpdate
from app.models.user import User
from app.models.user_context import UserContext
from app.schemas import (
    ProfileUpdateResponse,
    ProfileQuestionResponse,
    ProfileQuestionnaireSubmit,
    UserContextCreate,
    UserContextResponse,
    UserContextUpdate,
    UserProfileMemoryResponse,
)
from app.services.profile_memory import _memory_key, save_profile_memory
from app.utils.dependencies import get_current_user


router = APIRouter(prefix="/profile", tags=["Profile Memory"])


PROFILE_QUESTIONS = [
    {
        "id": "current_role",
        "category": "identity",
        "prompt": "What is your current main role or occupation?",
        "placeholder": "I am a computer science student working on an AI thesis.",
    },
    {
        "id": "study_work_focus",
        "category": "identity",
        "prompt": "What topics, projects, or fields are you focused on right now?",
        "placeholder": "I am focused on AI agents, full-stack apps, and productivity systems.",
    },
    {
        "id": "top_goal",
        "category": "goal",
        "prompt": "What is your most important goal for the next few months?",
        "placeholder": "My top goal is to finish and present my thesis successfully.",
    },
    {
        "id": "secondary_goal",
        "category": "goal",
        "prompt": "What is another goal you want the assistant to keep in mind?",
        "placeholder": "I want to build a strong portfolio project.",
    },
    {
        "id": "work_style",
        "category": "constraint",
        "prompt": "How do you prefer to work or study?",
        "placeholder": "I prefer clear steps, short explanations, and practical examples.",
    },
    {
        "id": "best_time",
        "category": "constraint",
        "prompt": "When are you usually most productive?",
        "placeholder": "I am most productive late at night.",
    },
    {
        "id": "avoid",
        "category": "constraint",
        "prompt": "What should the assistant avoid when helping you?",
        "placeholder": "Avoid long theory unless I ask for it.",
    },
    {
        "id": "motivation",
        "category": "general",
        "prompt": "What motivates you when you feel stuck?",
        "placeholder": "Small wins and seeing visible progress motivate me.",
    },
    {
        "id": "communication",
        "category": "constraint",
        "prompt": "How should the assistant communicate with you?",
        "placeholder": "Be direct, friendly, and explain only what matters.",
    },
    {
        "id": "life_area",
        "category": "general",
        "prompt": "Which life areas should the assistant pay attention to?",
        "placeholder": "University, thesis, coding, health, and family.",
    },
    {
        "id": "deadline_context",
        "category": "goal",
        "prompt": "Are there important deadlines or milestones it should remember?",
        "placeholder": "My thesis deadline is in June.",
    },
    {
        "id": "personal_rule",
        "category": "constraint",
        "prompt": "What personal rule or routine should future plans respect?",
        "placeholder": "Do not schedule deep work before 10 AM.",
    },
]


def _context_response(context: UserContext) -> UserContextResponse:
    value = context.value_json if isinstance(context.value_json, dict) else {}
    return UserContextResponse(
        id=context.id,
        category=context.category,
        key=context.key,
        fact=value.get("fact", ""),
        source=context.source,
        confidence=context.confidence,
        created_at=context.created_at,
        updated_at=context.updated_at,
    )


def _update_response(update: ProfileUpdate) -> ProfileUpdateResponse:
    return ProfileUpdateResponse(
        id=update.id,
        category=update.category,
        fact=update.fact,
        source=update.source,
        confidence=update.confidence,
        created_at=update.created_at,
    )


@router.get("", response_model=UserProfileMemoryResponse)
async def get_profile_memory(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return active long-term memory and recent extraction events."""
    context_entries = (
        db.query(UserContext)
        .filter(UserContext.user_id == current_user.id)
        .order_by(UserContext.updated_at.desc())
        .all()
    )
    updates = (
        db.query(ProfileUpdate)
        .filter(ProfileUpdate.user_id == current_user.id)
        .order_by(ProfileUpdate.created_at.desc())
        .limit(limit)
        .all()
    )

    return UserProfileMemoryResponse(
        context=[_context_response(entry) for entry in context_entries],
        updates=[_update_response(update) for update in updates],
    )


@router.post("/context", response_model=UserContextResponse)
async def create_context_rule(
    payload: UserContextCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a user-approved AI memory fact."""
    fact = payload.fact.strip()
    if not fact:
        raise HTTPException(status_code=400, detail="Fact cannot be empty")

    context = save_profile_memory(
        db,
        current_user.id,
        category=payload.category,
        fact=fact,
        source=payload.source or "user",
        confidence=payload.confidence,
        reason="User approved memory fact",
    )
    if not context:
        raise HTTPException(status_code=400, detail="Invalid memory fact")

    db.commit()
    db.refresh(context)
    return _context_response(context)


@router.get("/questions", response_model=list[ProfileQuestionResponse])
async def get_profile_questions(
    current_user: User = Depends(get_current_user),
):
    """Return a short guided profile questionnaire."""
    return PROFILE_QUESTIONS


@router.post("/questions", response_model=list[UserContextResponse])
async def submit_profile_questions(
    payload: ProfileQuestionnaireSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save reviewed questionnaire answers as explicit user-approved memory."""
    saved: list[UserContext] = []
    for answer in payload.answers:
        fact = answer.fact.strip()
        if not fact:
            continue

        context = save_profile_memory(
            db,
            current_user.id,
            category=answer.category,
            fact=fact,
            source="questionnaire",
            confidence=1.0,
            reason=f"Saved from profile question: {answer.question_id}",
        )
        if context:
            saved.append(context)

    db.commit()
    for context in saved:
        db.refresh(context)
    return [_context_response(context) for context in saved]


@router.put("/context/{context_id}", response_model=UserContextResponse)
async def update_context_rule(
    context_id: int,
    payload: UserContextUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Correct an active AI memory fact."""
    context = (
        db.query(UserContext)
        .filter(UserContext.id == context_id, UserContext.user_id == current_user.id)
        .first()
    )
    if not context:
        raise HTTPException(status_code=404, detail="Context rule not found")

    fact = payload.fact.strip()
    if not fact:
        raise HTTPException(status_code=400, detail="Fact cannot be empty")

    old_value = context.value_json if isinstance(context.value_json, dict) else None
    new_value = {"category": payload.category, "fact": fact}

    context.category = payload.category
    context.key = _memory_key(payload.category, fact)
    context.value_json = new_value
    context.source = "user"
    context.confidence = 1.0
    context.updated_at = datetime.utcnow()

    db.add(
        ProfileUpdate(
            user_id=current_user.id,
            category=payload.category,
            fact=fact,
            old_value_json=old_value,
            new_value_json=new_value,
            source="user",
            reason="User corrected memory fact",
            confidence=1.0,
        )
    )
    db.commit()
    db.refresh(context)
    return _context_response(context)


@router.delete("/context/{context_id}", status_code=204)
async def delete_context_rule(
    context_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove an active AI memory fact."""
    context = (
        db.query(UserContext)
        .filter(UserContext.id == context_id, UserContext.user_id == current_user.id)
        .first()
    )
    if not context:
        raise HTTPException(status_code=404, detail="Context rule not found")

    old_value = context.value_json if isinstance(context.value_json, dict) else None
    fact = old_value.get("fact", "") if old_value else ""
    db.add(
        ProfileUpdate(
            user_id=current_user.id,
            category=context.category,
            fact=fact or "Deleted memory fact",
            old_value_json=old_value,
            new_value_json={},
            source="user",
            reason="User deleted memory fact",
            confidence=context.confidence,
        )
    )
    db.delete(context)
    db.commit()
    return None
