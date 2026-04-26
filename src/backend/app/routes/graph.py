from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import Item
from app.models.item_link import ItemLink
from app.models.user import User
from app.schemas import GraphAnalyzeResponse, GraphData, ItemLinkCreate, ItemLinkResponse
from app.services.agents.graph_analyzer import graph_analyzer
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])


def _normalize_link_type(link_type: str | None) -> str:
    if link_type == "related":
        return "relates_to"
    if link_type in {"subtask_of", "relates_to", "blocks", "updates"}:
        return link_type
    return "relates_to"


@router.get("", response_model=GraphData)
async def get_graph_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all items as nodes and all item_links as edges for the knowledge graph."""
    items = db.query(Item).filter(Item.user_id == current_user.id).all()

    # Build node list
    nodes = [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "subcategory": item.subcategory,
            "life_area": item.life_area,
            "status": item.status,
            "priority": item.priority or 5,
            "tags": [tag for tag in [item.category, item.subcategory, item.life_area, item.status] if tag],
            "val": max(1, (item.priority or 5)),  # Node size based on priority
        }
        for item in items
    ]

    # Get all item IDs for this user
    item_ids = {item.id for item in items}

    # Get links where both source and target belong to this user
    links = (
        db.query(ItemLink)
        .filter(
            ItemLink.source_id.in_(item_ids),
            ItemLink.target_id.in_(item_ids),
        )
        .all()
    )

    links_data = [
        ItemLinkResponse(
            id=link.id,
            source_id=link.source_id,
            target_id=link.target_id,
            link_type=_normalize_link_type(link.link_type),
            weight=link.weight,
            ai_reasoning=link.ai_reasoning,
        )
        for link in links
    ]

    return GraphData(nodes=nodes, links=links_data)


@router.post("/links", response_model=ItemLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_link(
    link_data: ItemLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a manual link between two items."""
    # Verify both items belong to the user
    source = db.query(Item).filter(Item.id == link_data.source_id, Item.user_id == current_user.id).first()
    target = db.query(Item).filter(Item.id == link_data.target_id, Item.user_id == current_user.id).first()

    if not source or not target:
        raise HTTPException(status_code=404, detail="One or both items not found")

    if link_data.source_id == link_data.target_id:
        raise HTTPException(status_code=400, detail="Cannot link an item to itself")

    existing_link = (
        db.query(ItemLink)
        .filter(
            ItemLink.source_id == link_data.source_id,
            ItemLink.target_id == link_data.target_id,
            ItemLink.link_type == link_data.link_type,
        )
        .first()
    )
    if existing_link:
        raise HTTPException(status_code=409, detail="Link already exists")

    new_link = ItemLink(
        source_id=link_data.source_id,
        target_id=link_data.target_id,
        link_type=link_data.link_type,
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    return new_link


@router.post("/analyze", response_model=GraphAnalyzeResponse)
async def analyze_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze the user's items and create AI-suggested graph links."""
    items = db.query(Item).filter(Item.user_id == current_user.id).all()
    if len(items) < 2:
        return GraphAnalyzeResponse(suggested_links=[], created_count=0, skipped_count=0)

    item_ids = {item.id for item in items}
    existing_links = (
        db.query(ItemLink)
        .filter(
            ItemLink.source_id.in_(item_ids),
            ItemLink.target_id.in_(item_ids),
        )
        .all()
    )
    existing_keys = {(link.source_id, link.target_id, _normalize_link_type(link.link_type)) for link in existing_links}

    graph_items = [
        {
            "id": item.id,
            "type": item.category,
            "title": item.title,
            "description": item.description or "",
            "tags": [tag for tag in [item.category, item.subcategory, item.life_area, item.status] if tag],
        }
        for item in items
    ]

    suggestions = graph_analyzer.analyze(graph_items)
    created_links: list[ItemLink] = []
    skipped_count = 0

    for suggestion in suggestions:
        source_id = suggestion.get("source_id")
        target_id = suggestion.get("target_id")
        link_type = _normalize_link_type(suggestion.get("link_type"))

        if (
            source_id not in item_ids
            or target_id not in item_ids
            or source_id == target_id
            or suggestion.get("weight", 0) <= 20
        ):
            skipped_count += 1
            continue

        key = (source_id, target_id, link_type)
        if key in existing_keys:
            skipped_count += 1
            continue

        new_link = ItemLink(
            source_id=source_id,
            target_id=target_id,
            link_type=link_type,
            weight=suggestion.get("weight"),
            ai_reasoning=suggestion.get("ai_reasoning"),
        )
        db.add(new_link)
        db.flush()
        created_links.append(new_link)
        existing_keys.add(key)

    db.commit()
    for link in created_links:
        db.refresh(link)

    return GraphAnalyzeResponse(
        suggested_links=[
            ItemLinkResponse(
                id=link.id,
                source_id=link.source_id,
                target_id=link.target_id,
                link_type=_normalize_link_type(link.link_type),
                weight=link.weight,
                ai_reasoning=link.ai_reasoning,
            )
            for link in created_links
        ],
        created_count=len(created_links),
        skipped_count=skipped_count,
    )


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a link between two items."""
    # Get link and verify ownership via item
    link = db.query(ItemLink).filter(ItemLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # Verify the source item belongs to the user
    source_item = db.query(Item).filter(Item.id == link.source_id, Item.user_id == current_user.id).first()
    if not source_item:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()
    return None
