from sqlalchemy import Column, Integer, TEXT, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(TEXT)
    rules = Column(TEXT)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    user_teams = relationship("UserTeam", back_populates="team", cascade="all, delete-orphan")

class TeamSchema(BaseModel):
    name: Optional[str] = None
    rules: Optional[str] = None