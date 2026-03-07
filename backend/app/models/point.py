from pydantic import BaseModel
from enum import Enum
from typing import Optional

class PointType(str, Enum):
    icon = "icon"
    radius = "radius"
    marker = "marker"

class Point(BaseModel):
    type: PointType
    name: str
    icon: Optional[str]
    lng: float
    lat: float
    radius: Optional[float]