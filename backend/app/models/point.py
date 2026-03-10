from pydantic import BaseModel
from enum import Enum
from typing import Optional

class PointType(str, Enum):
    icon = "icon"
    radius = "radius"
    marker = "marker"
    line = "line"

class Point(BaseModel):
    type: PointType
    name: str
    icon: Optional[str] = None
    lng: float
    lat: float
    endLng: Optional[float] = None
    endLat: Optional[float] = None
    radius: Optional[float] = None