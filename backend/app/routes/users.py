import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.routes import logout_user
from app.routes.auth import get_current_user, verify_password
from app.models.user import User, UserInfo
from app.models.response_model import ResponseModel

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/users", tags=["Users"])


# Get All Users, By Id
@router.get("/all")
def get_all_users():
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

@router.get("/{id}")
def get_user_by_id(id: int):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return



# Update Basic Info and Account Info
@router.patch("/")
def edit_basic_info(user_info: UserInfo, current_id = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

@router.patch("/account")
def edit_account_info(user: User, current_id = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return


# Delete User
@router.delete("/")
def delete_user(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return