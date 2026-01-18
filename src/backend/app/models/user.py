from sqlalchemy import Column, Integer, String, TIMESTAMP, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    """User model representing a registered user"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    occupation = Column(String(100))
    
    # User profile data stored as JSON
    goals = Column(JSON, default=dict)  # {career: "...", health: "...", learning: "..."}
    personality = Column(JSON, default=dict)  # {procrastinationLevel: "medium", ...}
    life_areas = Column(JSON, default=list)  # ["Career", "Health", "Learning"]
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = relationship("Item", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
