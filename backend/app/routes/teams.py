import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.team import Team
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/teams", tags=["Teams"])


# Get Members by Team ID
@router.get("/{id}")
def get_team_members(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

def get_tm_prod(id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()


# Create Team
@router.post("/{id}")
def create_team(id: int, team: Team, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return


# Edit Team Members, Rules, and Roles
@router.patch("/{id}/{action}")
def edit_team(id: int, action: str, team: Team, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return


# Deleted Team
@router.delete("/{id}")
def delete_team(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return