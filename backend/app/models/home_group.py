from sqlalchemy import Column, Integer, TEXT, TIMESTAMP, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional

class HomeGroup(Base):
    __tablename__ = "home_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(TEXT, nullable=False)
    type = Column(TEXT, nullable=False)
    pinned = Column(Integer, default=0) # SQLite/pg compat with int
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    properties = relationship("Property", back_populates="group")

class HomeGroupSchema(BaseModel):
    name: str
    type: str
    pinned: bool = False