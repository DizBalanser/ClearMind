from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import Item
from app.models.item_link import ItemLink
from app.models.profile_update import ProfileUpdate
from app.models.reflection import Reflection
from app.models.user import User
from app.models.user_context import UserContext
from app.schemas import (
    DashboardActivityDay,
    DashboardAnalyticsResponse,
    DashboardTelemetry,
    DashboardVelocityPoint,
)
from app.utils.dependencies import get_current_user


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _day_range(days: int) -> list[date]:
    end = date.today()
    start = end - timedelta(days=days - 1)
    return [start + timedelta(days=offset) for offset in range(days)]


@router.get("/analytics", response_model=DashboardAnalyticsResponse)
async def get_dashboard_analytics(
    days: int = Query(default=60, ge=30, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return command-center analytics scoped to the current user."""
    dates = _day_range(days)
    start_day = dates[0]
    start_dt = datetime.combine(start_day, datetime.min.time())

    activity_by_day = {
        day: {"task": 0, "idea": 0, "thought": 0}
        for day in dates
    }

    items = (
        db.query(Item)
        .filter(Item.user_id == current_user.id, Item.created_at >= start_dt)
        .all()
    )
    for item in items:
        if not item.created_at:
            continue
        day = item.created_at.date()
        if day not in activity_by_day:
            continue
        category = item.category if item.category in {"task", "idea", "thought"} else "thought"
        activity_by_day[day][category] += 1

    activity = [
        DashboardActivityDay(
            date=day,
            tasks=counts["task"],
            ideas=counts["idea"],
            thoughts=counts["thought"],
            total=counts["task"] + counts["idea"] + counts["thought"],
        )
        for day, counts in activity_by_day.items()
    ]

    user_items = db.query(Item).filter(Item.user_id == current_user.id).all()
    user_item_ids = {item.id for item in user_items}
    links = []
    if user_item_ids:
        links = (
            db.query(ItemLink)
            .filter(
                ItemLink.source_id.in_(user_item_ids),
                ItemLink.target_id.in_(user_item_ids),
            )
            .all()
        )

    velocity = []
    for day in dates:
        end_of_day = datetime.combine(day + timedelta(days=1), datetime.min.time())
        node_count = sum(1 for item in user_items if item.created_at and item.created_at < end_of_day)
        link_count = sum(1 for link in links if link.created_at and link.created_at < end_of_day)
        velocity.append(
            DashboardVelocityPoint(
                date=day,
                nodes=node_count,
                connections=link_count,
            )
        )

    active_profile_rules = (
        db.query(UserContext)
        .filter(UserContext.user_id == current_user.id)
        .count()
    )
    memory_updates = (
        db.query(ProfileUpdate)
        .filter(ProfileUpdate.user_id == current_user.id, ProfileUpdate.created_at >= start_dt)
        .count()
    )
    pending_tasks = (
        db.query(Item)
        .filter(
            Item.user_id == current_user.id,
            Item.category == "task",
            Item.status != "done",
        )
        .count()
    )
    reflections = (
        db.query(Reflection)
        .filter(Reflection.user_id == current_user.id, Reflection.created_at >= start_dt)
        .count()
    )
    hidden_connections = (
        db.query(ItemLink)
        .filter(
            ItemLink.source_id.in_(user_item_ids) if user_item_ids else False,
            ItemLink.target_id.in_(user_item_ids) if user_item_ids else False,
            or_(ItemLink.ai_reasoning.isnot(None), ItemLink.weight.isnot(None)),
        )
        .count()
        if user_item_ids
        else 0
    )

    telemetry = DashboardTelemetry(
        active_profile_rules=active_profile_rules,
        memory_updates=memory_updates,
        graph_connections=len(links),
        hidden_connections=hidden_connections,
        pending_tasks=pending_tasks,
        reflections=reflections,
    )

    return DashboardAnalyticsResponse(
        activity=activity,
        velocity=velocity,
        telemetry=telemetry,
    )
