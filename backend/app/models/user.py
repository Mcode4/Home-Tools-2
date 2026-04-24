from sqlalchemy import Column, Integer, String, BIGINT, TEXT, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    name = Column(TEXT)
    phone_number = Column(BIGINT)
    bio = Column(TEXT)
    profile_icon = Column(TEXT)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    user_teams = relationship("UserTeam", back_populates="user", cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="owner", cascade="all, delete-orphan")
    floors = relationship("Floor", back_populates="owner", cascade="all, delete-orphan")
    saved_types = relationship("SavedType", back_populates="owner", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="user", uselist=False, cascade="all, delete-orphan")

# Pydantic Schemas (renamed to avoid collision with ORM model)
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=25)
    name: Optional[str] = "User"
    phone: Optional[int] = None
    bio: Optional[str] = None
    profile_icon: Optional[str] = None

class UserInfoSchema(BaseModel):
    name: str
    phone: Optional[int] = None
    password: str = Field(min_length=8, max_length=25)