from sqlalchemy import Column, Integer, TEXT, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel
from typing import Optional

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("property.id", ondelete="CASCADE"))
    default_filename = Column(TEXT, nullable=False)
    filename = Column(TEXT)
    filepath = Column(TEXT)
    content_type = Column(TEXT)
    type = Column(TEXT, nullable=False)
    uploaded_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="images")
    property = relationship("Property", back_populates="images")

class ImageSchema(BaseModel):
    owner_id: Optional[int] = None
    property_id: Optional[int] = None
    default_filename: str
    filename: Optional[str] = None
    filepath: Optional[str] = None
    content_type: Optional[str] = None
    type: str