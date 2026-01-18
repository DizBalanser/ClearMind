from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.item import Item
from app.models.conversation import Conversation
from app.schemas import ChatMessage, ChatResponse, ClassifiedItem
from app.utils.dependencies import get_current_user
from app.services.classification_service import classification_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    message: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main chat endpoint - receives user message, classifies it, saves items, returns response
    """
    
    # Build user profile for classification
    user_profile = {
        'goals': current_user.goals or {},
        'personality': current_user.personality or {},
        'life_areas': current_user.life_areas or []
    }
    
    # Classify the input using AI
    classified_items = classification_service.classify_input(
        user_input=message.message,
        user_profile=user_profile
    )
    
    # Save classified items to database
    saved_items = []
    for item_data in classified_items:
        # Parse deadline if present
        deadline = None
        if item_data.get('deadline'):
            try:
                deadline = datetime.fromisoformat(item_data['deadline'])
            except:
                pass
        
        new_item = Item(
            user_id=current_user.id,
            title=item_data['title'],
            description=item_data.get('description'),
            category=item_data['category'],
            subcategory=item_data.get('subcategory'),
            life_area=item_data.get('life_area'),
            deadline=deadline,
            priority=item_data.get('priority', 5),
            status='pending'
        )
        
        db.add(new_item)
        saved_items.append(new_item)
    
    db.commit()
    
    # Generate friendly AI response
    ai_response = classification_service.generate_response(
        user_input=message.message,
        classified_items=classified_items,
        user_name=current_user.name
    )
    
    # Save conversation
    conversation = Conversation(
        user_id=current_user.id,
        messages=[
            {
                "role": "user",
                "content": message.message,
                "timestamp": datetime.utcnow().isoformat()
            },
            {
                "role": "assistant",
                "content": ai_response,
                "timestamp": datetime.utcnow().isoformat()
            }
        ]
    )
    db.add(conversation)
    db.commit()
    
    # Convert to response format
    response_items = [
        ClassifiedItem(
            title=item['title'],
            category=item['category'],
            subcategory=item.get('subcategory'),
            life_area=item.get('life_area'),
            deadline=item.get('deadline'),
            priority=item.get('priority', 5),
            description=item.get('description')
        )
        for item in classified_items
    ]
    
    return ChatResponse(
        message=ai_response,
        items=response_items
    )
