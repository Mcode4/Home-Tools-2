from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, TEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(TEXT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="maps")
    points = relationship("Point", back_populates="map", cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="map", cascade="all, delete-orphan")


# Pydantic Schemas
class MapBase(BaseModel):
    name: str
    description: Optional[str] = None

class MapCreate(MapBase):
    pass

class MapUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class MapResponse(MapBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
