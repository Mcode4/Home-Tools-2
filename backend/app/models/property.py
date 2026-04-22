from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class Property(BaseModel):
    owner_id: Optional[int] = None
    name: str = Field(min_length=1, max_length=100)
    address: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    zip: Optional[str] = None
    lat: float
    lng: float
    details: Optional[Dict[str, Any]] = None