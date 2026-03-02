import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.home_group import HomeGroup
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/groups", tags=["HomeGroups"])


# Get All Groups By User ID
@router.get("/")
def get_home_group(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

# Create Home Group
@router.post("/")
def create_home_group(group: HomeGroup, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return


# Edit Home Group
@router.patch("/{id}")
def edit_home_group(id: int, group: HomeGroup, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return


# Deleted Home Group
@router.delete("/{id}")
def delete_home_group(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return