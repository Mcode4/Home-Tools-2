from pydantic import BaseModel
from typing import Optional, Dict

class SavedType(BaseModel):
    name: str
    type: str
    extra_info: Optional[Dict] = None
    owner_id: Optional[int] = None