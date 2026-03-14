import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.notification import Notification
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

# env_path = Path(__file__).resolve().parents[3] / ".env"
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/types", tags=["SavedTypes"])


# Get Notifications By User
@router.get("/")
def get_notifications(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return


# Post Notification
@router.post("/")
def post_notification(notification: Notification, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

# Deleted Notification By Read
@router.delete("/read")
def delete_read_notifications(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

# Deleted Notification By ID
@router.delete("/{id}")
def delete_notification_by_id(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return

    
