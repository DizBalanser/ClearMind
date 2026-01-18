from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Item(Base):
    """Item model representing tasks, obligations, wishes, goals, ideas, and habits"""
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Item content
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    
    # Classification
    category = Column(String(50), nullable=False)  # task, idea, thought
    subcategory = Column(String(50), nullable=True)  # obligation, goal, habit, project, creative, etc.
    life_area = Column(String(50), nullable=True)  # career, health, learning, relationships, etc.
    
    # Scheduling
    deadline = Column(TIMESTAMP, nullable=True)
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, in_progress, done, archived
    priority = Column(Integer, nullable=True)  # 1-10, calculated by AI
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="items")
    
    def __repr__(self):
        return f"<Item(id={self.id}, title={self.title}, category={self.category})>"
