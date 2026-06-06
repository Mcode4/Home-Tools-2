import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.notification import Notification, NotificationSchema
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# Get Notifications By User
@router.get("")
def get_notifications(current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    notifications = db.query(Notification).filter(Notification.recipient_id == current_user["id"]).all()
    return ResponseModel(True, "", {"notifications": notifications})


# Post Notification
@router.post("")
def post_notification(notification_schema: NotificationSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        new_notif = Notification(
            sender_id=current_user["id"],
            recipient_id=notification_schema.recipient_id,
            title=notification_schema.title,
            message=notification_schema.message,
            read=0
        )
        db.add(new_notif)
        db.commit()
        db.refresh(new_notif)
        return ResponseModel(True, "Notification sent", {"notification": new_notif})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Deleted Notification By Read
@router.delete("/read")
def delete_read_notifications(current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        db.query(Notification).filter(Notification.recipient_id == current_user["id"], Notification.read == 1).delete()
        db.commit()
        return ResponseModel(True, "Read notifications deleted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Mark Notification as Read
@router.patch("/{id}")
def mark_notification_read(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    notif = db.query(Notification).filter(Notification.id == id, Notification.recipient_id == current_user["id"]).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = 1
    db.commit()
    db.refresh(notif)
    return ResponseModel(True, "Notification marked as read", {"notification": notif})


# Deleted Notification By ID
@router.delete("/{id}")
def delete_notification_by_id(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        notif = db.query(Notification).filter(Notification.id == id, Notification.recipient_id == current_user["id"]).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        db.delete(notif)
        db.commit()
        return ResponseModel(True, "Notification deleted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
