from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class User(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=25)
    bio: Optional[str] = None
    profile_icon: Optional[str] = None

class UserInfo(BaseModel):
    name: str
    phone: Optional[int] = None
    password: str = Field(min_length=8, max_length=25)