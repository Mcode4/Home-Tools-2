from pydantic import BaseModel
from typing import Optional

class Image(BaseModel):
    owner_id: Optional[int] = None
    property_id: Optional[int] = None
    default_filename: str
    filename: Optional[str] = None
    filepath: Optional[str] = None
    content_type: Optional[str] = None
    size: Optional[str] = None
    type: str