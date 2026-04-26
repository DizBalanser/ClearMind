from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ItemLink(Base):
    """ItemLink model representing edges in the knowledge graph between items."""
    __tablename__ = "item_links"

    id = Column(Integer, primary_key=True, index=True)

    source_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)

    # Link type: "subtask_of", "relates_to", "blocks", "updates"
    link_type = Column(String(50), default="relates_to")
    weight = Column(Integer, nullable=True)
    ai_reasoning = Column(Text, nullable=True)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    source = relationship("Item", foreign_keys=[source_id], back_populates="links_from")
    target = relationship("Item", foreign_keys=[target_id], back_populates="links_to")

    def __repr__(self):
        return f"<ItemLink(id={self.id}, {self.source_id} -> {self.target_id}, type={self.link_type})>"
