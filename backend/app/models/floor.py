from sqlalchemy import Column, Integer, Float, TEXT, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional, Any

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("property.id", ondelete="CASCADE"), nullable=False)
    name = Column(TEXT, nullable=False)
    level_number = Column(Integer, default=1)
    bedroom_count = Column(Integer, default=0)
    bathroom_count = Column(Integer, default=0)
    length = Column(Float)
    width = Column(Float)
    height = Column(Float)
    position = Column(JSON)

    owner = relationship("User", back_populates="floors")
    property = relationship("Property", back_populates="floors")
    rooms = relationship("Room", back_populates="floor", cascade="all, delete-orphan")

class FloorSchema(BaseModel):
    property_id: int
    name: str
    level_number: Optional[int] = 1
    bedroom_count: Optional[int] = 0
    bathroom_count: Optional[int] = 0
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    position: Optional[Any] = None
