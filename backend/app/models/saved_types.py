from sqlalchemy import Column, Integer, TEXT, ForeignKey, JSON
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional, Dict
from sqlalchemy.orm import relationship

class SavedType(Base):
    __tablename__ = "saved_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(TEXT, nullable=False)
    type = Column(TEXT, nullable=False)
    extra_info = Column(JSON)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="saved_types")

class SavedTypeSchema(BaseModel):
    name: str
    type: str
    extra_info: Optional[Dict] = None
    owner_id: Optional[int] = None