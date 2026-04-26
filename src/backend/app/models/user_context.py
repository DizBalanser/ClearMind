from datetime import datetime

from sqlalchemy import JSON, TIMESTAMP, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class UserContext(Base):
    """Current normalized long-term facts known about a user."""

    __tablename__ = "user_context"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    key = Column(String(255), nullable=False)
    value_json = Column(JSON, nullable=False, default=dict)
    source = Column(String(50), default="brain_dump")
    confidence = Column(Float, default=1.0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="context_entries")

    def __repr__(self):
        return f"<UserContext(id={self.id}, user_id={self.user_id}, key={self.key})>"
