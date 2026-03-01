from pydantic import BaseModel
from typing import Optional

class HomeGroup(BaseModel):
    name: str
    type: str
    pinned: bool = False