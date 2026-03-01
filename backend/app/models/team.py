from pydantic import BaseModel
from typing import Optional

class Team(BaseModel):
    name: Optional[str] = None
    roles: str
    rules: Optional[str] = None