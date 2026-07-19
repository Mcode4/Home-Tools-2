from sqlalchemy import Column, Integer, TEXT, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional

class Settings(Base):
    __tablename__ = "settings"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme = Column(TEXT, default='system')
    map_layer = Column(TEXT, default='osm-layer')
    icon_size = Column(Integer, default=24)
    text_size = Column(Integer, default=12)
    text_color = Column(TEXT)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="settings")

class SettingsSchema(BaseModel):
    theme: str = "system"
    map_layer: str = "osm-layer"
    icon_size: int = 24
    text_size: int = 12
    text_color: Optional[str] = None
    
class SettingsUpdateSchema(BaseModel):
    theme: Optional[str] = None
    map_layer: Optional[str] = None
    icon_size: Optional[int] = None
    text_size: Optional[int] = None
    text_color: Optional[str] = None
