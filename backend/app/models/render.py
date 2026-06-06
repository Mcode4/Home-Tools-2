from sqlalchemy import Column, Integer, Boolean, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional, List, Any

class Render(Base):
    __tablename__ = "renders"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("property.id", ondelete="CASCADE"), unique=True, nullable=False)
    has_render = Column(Boolean, default=False)
    has_outline = Column(Boolean, default=False)
    has_sections = Column(Boolean, default=False)
    outlines_data = Column(JSON, default=None)
    sections_data = Column(JSON, default=None)
    objects_data = Column(JSON, default=None)
    render_3d_data = Column(JSON, default=None)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    property = relationship("Property", back_populates="render")

class RenderSchema(BaseModel):
    has_render: bool = False
    has_outline: bool = False
    has_sections: bool = False
    outlines_data: Optional[List[Any]] = None
    sections_data: Optional[Any] = None
    objects_data: Optional[Any] = None
    render_3d_data: Optional[Any] = None
