from sqlalchemy import Column, Integer, String, Float, ForeignKey, TEXT, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from pydantic import BaseModel
from enum import Enum
from typing import Optional

class PointType(str, Enum):
    radius = "radius"
    line = "line"
    home = "home"
    apartment = "apartment"
    unit = "unit"
    icon = "icon"
    marker = "marker"

class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(TEXT, nullable=False)
    name = Column(TEXT, nullable=False)
    icon = Column(TEXT)
    lng = Column(Float, nullable=False)
    lat = Column(Float, nullable=False)
    endlng = Column(Float)
    endlat = Column(Float)
    radius = Column(Float)
    parent_id = Column(Integer)
    extra_info = Column(JSON)

class PointSchema(BaseModel):
    type: PointType
    name: str
    icon: Optional[str] = None
    lng: float
    lat: float
    endlng: Optional[float] = None
    endlat: Optional[float] = None
    radius: Optional[float] = None
    parent_id: Optional[int] = None
    extra_info: Optional[dict] = None