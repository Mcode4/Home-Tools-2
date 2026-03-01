from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class Property(BaseModel):
    owner_id: int
    name: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=5, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    country: str = Field(min_length=2, max_length=100)
    zip: str = Field(min_length=3, max_length=12)
    details: Optional[Dict[str, Any]] = None
    pinned: bool = False