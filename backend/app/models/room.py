from sqlalchemy import Column, Integer, Float, TEXT, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional, Any

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=False)
    type = Column(TEXT, nullable=False)
    name = Column(TEXT, nullable=False)
    length = Column(Float)
    width = Column(Float)
    height = Column(Float)
    position = Column(JSON)

    floor = relationship("Floor", back_populates="rooms")

class RoomSchema(BaseModel):
    floor_id: int
    type: str
    name: str
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    position: Optional[Any] = None
