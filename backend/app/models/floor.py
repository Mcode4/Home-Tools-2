from pydantic import BaseModel
from typing import Optional, Dict

class Floor(BaseModel):
    owner_id: int
    property_id: int
    name: str
    bedrooms: int
    bathrooms: int
    extra_rooms: Optional[Dict] = None