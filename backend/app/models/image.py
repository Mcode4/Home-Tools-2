from pydantic import BaseModel
from typing import Optional

class Images(BaseModel):
    owner_id: Optional[int] = None
    property_id: Optional[int] = None
    default_filename: str
    filename: str
    content_type: Optional[str] = None
    size: Optional[str] = None