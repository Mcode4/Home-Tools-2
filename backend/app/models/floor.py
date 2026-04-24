from sqlalchemy import Column, Integer, TEXT, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional, Dict, Any

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("property.id", ondelete="CASCADE"), nullable=False)
    name = Column(TEXT, nullable=False)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    extra_rooms = Column(TEXT) # Stored as JSON string or text for now, match schema

    # Relationships
    owner = relationship("User", back_populates="floors")
    property = relationship("Property", back_populates="floors")

class FloorSchema(BaseModel):
    property_id: int
    name: str
    bedrooms: int
    bathrooms: int
    extra_rooms: Optional[Any] = None