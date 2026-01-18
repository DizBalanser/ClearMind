from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas import UserResponse, UserProfile
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    profile_data: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    
    # Update fields
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.occupation is not None:
        current_user.occupation = profile_data.occupation
    
    current_user.goals = profile_data.goals
    current_user.personality = profile_data.personality
    current_user.life_areas = profile_data.life_areas
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
