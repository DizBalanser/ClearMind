from datetime import datetime

from sqlalchemy import JSON, TIMESTAMP, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ProfileUpdate(Base):
    """Append-only history of long-term profile facts extracted by agents."""

    __tablename__ = "profile_updates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    fact = Column(Text, nullable=False)
    old_value_json = Column(JSON, nullable=True)
    new_value_json = Column(JSON, nullable=False, default=dict)
    source = Column(String(50), default="brain_dump")
    reason = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    user = relationship("User", back_populates="profile_updates")

    def __repr__(self):
        return f"<ProfileUpdate(id={self.id}, user_id={self.user_id}, category={self.category})>"
