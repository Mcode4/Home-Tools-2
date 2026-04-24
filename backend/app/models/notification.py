from sqlalchemy import Column, Integer, TEXT, TIMESTAMP
from sqlalchemy.sql import func
from app.db.session import Base
from pydantic import BaseModel

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, nullable=False)
    recipient_id = Column(Integer, nullable=False)
    title = Column(TEXT, nullable=False)
    message = Column(TEXT, nullable=False)
    read = Column(Integer, default=0) # 0 for false, 1 for true
    created_at = Column(TIMESTAMP, server_default=func.now())

class NotificationSchema(BaseModel):
    sender_id: int
    recipient_id: int
    title: str
    message: str
    read: bool = False