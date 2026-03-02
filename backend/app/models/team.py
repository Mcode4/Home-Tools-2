from pydantic import BaseModel
from typing import Optional

class Team(BaseModel):
    name: Optional[str] = None
    rules: Optional[str] = None