from datetime import datetime

from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Message(Base):
    """Message model storing individual chat logs for rolling history"""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(String, nullable=False)
    agent_used = Column(String, nullable=True)  # e.g., "brain_dump", "scheduler"
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<Message(id={self.id}, user_id={self.user_id}, role='{self.role}')>"
