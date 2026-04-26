from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import Item
from app.models.item_link import ItemLink
from app.models.message import Message
from app.models.user import User
from app.schemas import (
    AgentChatResponse,
    ChatMessage,
    ClassifiedItem,
    MessageResponse,
    ReflectionSummary,
    ScheduleBlock,
)
from app.services.orchestrator import orchestrator
from app.services.profile_memory import active_context_facts, extract_memory_candidates
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/history", response_model=list[MessageResponse])
async def get_chat_history(
    limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Fetch recent chat history for the user"""
    messages = (
        db.query(Message)
        .filter(Message.user_id == current_user.id)
        .order_by(Message.timestamp.desc())
        .limit(limit)
        .all()
    )
    # Reverse to chronological order
    return messages[::-1]


@router.post("", response_model=AgentChatResponse)
async def send_message(
    message: ChatMessage, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Main chat endpoint — routes to the appropriate agent via the Orchestrator.
    Returns a unified response with agent name, message, items, schedule, and/or reflection.
    """

    context_facts = active_context_facts(db, current_user.id)

    # Build user profile for agents
    user_profile = {
        "name": current_user.name,
        "goals": current_user.goals or {},
        "personality": current_user.personality or {},
        "life_areas": current_user.life_areas or [],
        "context_facts": context_facts,
    }

    # Fetch recent history
    history = (
        db.query(Message).filter(Message.user_id == current_user.id).order_by(Message.timestamp.desc()).limit(10).all()
    )
    history_data = [
        {"role": msg.role, "content": msg.content, "agent_used": msg.agent_used} for msg in reversed(history)
    ]

    # Route through orchestrator
    result = orchestrator.route_and_execute(
        user_input=message.message,
        user_profile=user_profile,
        chat_history=history_data,
        db=db,
        user_id=current_user.id,
    )

    # Save classified items to database (brain_dump agent)
    saved_item_ids = []
    for item_data in result.get("items", []):
        deadline = None
        if item_data.get("deadline"):
            try:
                deadline = datetime.fromisoformat(item_data["deadline"])
            except (ValueError, TypeError):
                pass

        new_item = Item(
            user_id=current_user.id,
            title=item_data["title"],
            description=item_data.get("description"),
            category=item_data["category"],
            subcategory=item_data.get("subcategory"),
            life_area=item_data.get("life_area"),
            deadline=deadline,
            priority=item_data.get("priority", 5),
            status="pending",
        )

        db.add(new_item)
        db.flush()  # Get the ID before commit
        saved_item_ids.append((new_item.id, item_data.get("title", "")))

    memory_candidates = extract_memory_candidates(
        db,
        current_user.id,
        message.message,
        agent_message=result.get("message", ""),
    )

    # Save detected links
    for link_data in result.get("links", []):
        target_id = link_data.get("target_id")
        if target_id and saved_item_ids:
            # Find the source item by title match
            for saved_id, saved_title in saved_item_ids:
                if (
                    link_data.get("source_title", "").lower() in saved_title.lower()
                    or saved_title.lower() in link_data.get("source_title", "").lower()
                ):
                    link_type = link_data.get("link_type", "relates_to")
                    if link_type == "related":
                        link_type = "relates_to"
                    existing_link = (
                        db.query(ItemLink)
                        .filter(
                            ItemLink.source_id == saved_id,
                            ItemLink.target_id == target_id,
                            ItemLink.link_type == link_type,
                        )
                        .first()
                    )
                    if not existing_link:
                        new_link = ItemLink(
                            source_id=saved_id,
                            target_id=target_id,
                            link_type=link_type,
                            weight=link_data.get("weight"),
                            ai_reasoning=link_data.get("ai_reasoning"),
                        )
                        db.add(new_link)
                    break

    db.commit()

    # Save messages to database
    user_msg = Message(user_id=current_user.id, role="user", content=message.message)
    db.add(user_msg)

    assistant_msg = Message(
        user_id=current_user.id,
        role="assistant",
        content=result.get("message", ""),
        agent_used=result.get("agent", "brain_dump"),
    )
    db.add(assistant_msg)
    db.commit()

    # Build response
    response_items = [
        ClassifiedItem(
            title=item["title"],
            category=item["category"],
            subcategory=item.get("subcategory"),
            life_area=item.get("life_area"),
            deadline=item.get("deadline"),
            priority=item.get("priority", 5),
            description=item.get("description"),
        )
        for item in result.get("items", [])
    ]

    response_schedule = [
        ScheduleBlock(
            item_id=block["item_id"],
            title=block.get("title", ""),
            estimated_duration_minutes=block.get("estimated_duration_minutes", 30),
            scheduled_start=block.get("scheduled_start", ""),
            scheduled_end=block.get("scheduled_end", ""),
        )
        for block in result.get("schedule", [])
    ]

    response_reflection = None
    reflection_data = result.get("reflection")
    if reflection_data:
        response_reflection = ReflectionSummary(
            summary=reflection_data.get("summary", ""),
            patterns=reflection_data.get("patterns", []),
            suggestions=reflection_data.get("suggestions", []),
        )

    return AgentChatResponse(
        agent=result.get("agent", "brain_dump"),
        message=result.get("message", ""),
        items=response_items,
        schedule=response_schedule,
        reflection=response_reflection,
        memory_candidates=memory_candidates,
    )
