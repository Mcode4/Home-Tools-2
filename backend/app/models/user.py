from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    name: Optional[str] = None
    phone: Optional[int] = None