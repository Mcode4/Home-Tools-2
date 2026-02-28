from pydantic import BaseModel
from typing import Optional, Dict

class SavedTypes(BaseModel):
    name: str
    type: str
    extra_info: Optional[Dict] = None