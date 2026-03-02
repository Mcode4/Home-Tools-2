from pydantic import BaseModel

class Notification(BaseModel):
    sender_id: int
    recipient_id: int
    title: str
    message: str
    read: bool = False