import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.notification import Notification
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# Get Notifications By User
@router.get("")
def get_notifications(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications WHERE recipient_id=%s", (current_user["id"],))
    notifications = cursor.fetchall()
    conn.close()
    return ResponseModel(True, "", {"notifications": notifications})


# Post Notification
@router.post("")
def post_notification(notification: Notification, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
                INSERT INTO notifications (sender_id, recipient_id, title, message)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """,
            (current_user["id"], notification.recipient_id, notification.title, notification.message)
        )
        conn.commit()
        curr_notif = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "Notification sent", {"notification": curr_notif})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Deleted Notification By Read
@router.delete("/read")
def delete_read_notifications(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM notifications WHERE recipient_id=%s AND read=1", (current_user["id"],))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Read notifications deleted")
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Deleted Notification By ID
@router.delete("/{id}")
def delete_notification_by_id(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM notifications WHERE id=%s AND recipient_id=%s", (id, current_user["id"]))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Notification deleted")
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))
