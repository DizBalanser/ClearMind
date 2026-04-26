from datetime import datetime

from sqlalchemy import JSON, TIMESTAMP, Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Reflection(Base):
    """Reflection model storing evolving mental-state summaries from Agent B."""

    __tablename__ = "reflections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Evolving mental-state summary
    summary = Column(Text, nullable=True)

    # Identified patterns as JSON array: ["tends to procrastinate on...", ...]
    patterns = Column(JSON, default=list)

    # Actionable suggestions as JSON array: ["Consider breaking down...", ...]
    suggestions = Column(JSON, default=list)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reflections")

    def __repr__(self):
        return f"<Reflection(id={self.id}, user_id={self.user_id})>"
