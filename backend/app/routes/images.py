import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from pathlib import Path

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.routes.auth import get_current_user

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

UPLOAD_ROOT = "app/uploads/properties"
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/images", tags=["Images"])

# Get Image By ID
@router.get("/{id}")
def get_image_by_id(id: int, current_user:int = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

def _img_by_id_prod(id: int, current_user:int = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT filepath, property_id FROM images WHERE id=%s", )


def _img_by_id_dev(id: int, current_user:int = Depends(get_current_user)):
    pass