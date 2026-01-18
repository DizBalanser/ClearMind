from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime


# ============================================================================
# Authentication Schemas
# ============================================================================

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


# ============================================================================
# User Schemas
# ============================================================================

class UserProfile(BaseModel):
    """Schema for user profile data"""
    name: Optional[str] = None
    occupation: Optional[str] = None
    goals: Dict[str, str] = Field(default_factory=dict)
    personality: Dict[str, str] = Field(default_factory=dict)
    life_areas: List[str] = Field(default_factory=list)


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    name: Optional[str]
    occupation: Optional[str]
    goals: Dict
    personality: Dict
    life_areas: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Item Schemas
# ============================================================================

class ItemCreate(BaseModel):
    """Schema for creating an item manually"""
    title: str
    description: Optional[str] = None
    category: str  # task, idea, thought
    subcategory: Optional[str] = None  # obligation, goal, habit, project, creative, etc.
    life_area: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[int] = None


class ItemUpdate(BaseModel):
    """Schema for updating an item"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    life_area: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[int] = None


class ItemResponse(BaseModel):
    """Schema for item response"""
    id: int
    user_id: int
    title: str
    description: Optional[str]
    category: str
    subcategory: Optional[str]
    life_area: Optional[str]
    deadline: Optional[datetime]
    status: str
    priority: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Chat Schemas
# ============================================================================

class ChatMessage(BaseModel):
    """Schema for incoming chat message"""
    message: str


class ClassifiedItem(BaseModel):
    """Schema for a classified item from AI"""
    title: str
    category: str  # task, idea, thought
    subcategory: Optional[str] = None
    life_area: Optional[str] = None
    deadline: Optional[str] = None  # ISO format string
    priority: int
    description: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chat response with classified items"""
    message: str  # AI's response text
    items: List[ClassifiedItem]  # Classified items
