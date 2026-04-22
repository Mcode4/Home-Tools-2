from pydantic import BaseModel
from enum import Enum
from typing import Optional

class PointType(str, Enum):
    radius = "radius"
    line = "line"
    home = "home"
    apartment = "apartment"
    unit = "unit"
    point = "point"

class Point(BaseModel):
    type: PointType
    name: str
    icon: Optional[str] = None
    lng: float
    lat: float
    endLng: Optional[float] = None
    endLat: Optional[float] = None
    radius: Optional[float] = None
    parent_id: Optional[int] = None
    extra_info: Optional[dict] = None