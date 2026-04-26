from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from icalendar import Calendar, Event
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas import ScheduleUpdate
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/schedule", tags=["Schedule"])


@router.get("", response_model=list[dict])
async def get_schedule(
    start_date: str | None = Query(None, description="ISO date string YYYY-MM-DD"),
    end_date: str | None = Query(None, description="ISO date string YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get scheduled items for the user within an optional date range."""
    query = db.query(Item).filter(
        Item.user_id == current_user.id,
        Item.scheduled_start.isnot(None),
    )

    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Item.scheduled_start >= start)
        except ValueError:
            pass

    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Item.scheduled_end <= end)
        except ValueError:
            pass

    items = query.order_by(Item.scheduled_start.asc()).all()

    return [
        {
            "item_id": item.id,
            "title": item.title,
            "category": item.category,
            "subcategory": item.subcategory,
            "priority": item.priority,
            "status": item.status,
            "estimated_duration_minutes": item.estimated_duration,
            "scheduled_start": item.scheduled_start.isoformat() if item.scheduled_start else None,
            "scheduled_end": item.scheduled_end.isoformat() if item.scheduled_end else None,
        }
        for item in items
    ]


@router.put("/{item_id}")
async def update_schedule_block(
    item_id: int,
    schedule_data: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a scheduled item's time block (for drag-and-drop on frontend)."""
    item = (
        db.query(Item)
        .filter(
            Item.id == item_id,
            Item.user_id == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if schedule_data.scheduled_start:
        try:
            item.scheduled_start = datetime.fromisoformat(schedule_data.scheduled_start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_start format")

    if schedule_data.scheduled_end:
        try:
            item.scheduled_end = datetime.fromisoformat(schedule_data.scheduled_end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_end format")

    if schedule_data.estimated_duration_minutes is not None:
        item.estimated_duration = schedule_data.estimated_duration_minutes

    db.commit()
    db.refresh(item)

    return {
        "item_id": item.id,
        "title": item.title,
        "scheduled_start": item.scheduled_start.isoformat() if item.scheduled_start else None,
        "scheduled_end": item.scheduled_end.isoformat() if item.scheduled_end else None,
        "estimated_duration_minutes": item.estimated_duration,
    }


@router.get("/export")
async def export_ics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all scheduled items as an .ics calendar file."""
    items = (
        db.query(Item)
        .filter(
            Item.user_id == current_user.id,
            Item.scheduled_start.isnot(None),
        )
        .order_by(Item.scheduled_start.asc())
        .all()
    )

    cal = Calendar()
    cal.add("prodid", "-//ClearMind//Phase2//EN")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")

    for item in items:
        event = Event()
        event.add("summary", item.title)
        event.add("description", item.description or f"Category: {item.category}")
        event.add("dtstart", item.scheduled_start)

        if item.scheduled_end:
            event.add("dtend", item.scheduled_end)

        event.add("priority", max(1, min(9, 10 - (item.priority or 5))))  # iCal priority is inverted (1=high)
        event.add("uid", f"clearmind-item-{item.id}@clearmind.app")

        cal.add_component(event)

    ics_content = cal.to_ical()

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=clearmind-schedule.ics"},
    )
