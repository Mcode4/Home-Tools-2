import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.team import Team
from app.models.user_team import UserTeam
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/teams", tags=["Teams"])

# Help Functions
def verify_team_and_member(cursor, team_id: int, current_user = Depends(get_current_user)):
    cursor.execute("SELECT * FROM teams WHERE id=%s", (team_id,))
    team = cursor.fetchone()
    if not team:
        HTTPException(status_code=404, detail="Team not found")
        return ResponseModel(False, "Team not found")
    members = []
    is_member = False
    cursor.execute("SELECT * user_id FROM user_teams WHERE team_id=%s", (id,))
    member_ids = cursor.fetchall()
    if not member_ids:
        return ResponseModel(False, "No members in team found")
    for m_id in member_ids:
        if m_id == current_user["id"]:
            is_member = True
        cursor.execute("SELECT email, name, phone, profile_icon FROM users WHERE id=%s", (m_id,))
        mem = cursor.fetchone()
        members.append(mem)
    return ResponseModel(is_member, "", data={"member_ids": member_ids,"members": members})

# Get Members From Team 
@router.get("/{id}")
def get_team_members(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return get_tm_prod(id, current_user)
    if PROJECT_ENV == "development":
        return

    
def get_tm_prod(id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    verify = verify_team_and_member(cursor, id, current_user)
    if not verify["success"]:
        conn.close()
        if verify.get("message"):
            return verify
        else:
            HTTPException(status_code=401, detail="User not authorized to view team")
    return ResponseModel(True, "", {"members": verify["data"]["members"]})


# Create Team
@router.post("/")
def create_team(team: Team, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return
    if PROJECT_ENV == "development":
        return
    

def create_t_prod(team: Team, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    try:
        name = current_user["name"]
        rules = None
        if team.get("name"):
            name = team["name"]
        if team.get("rules"):
            rules = team["rules"]
        cursor.execute(
        """
            INSERT INTO teams 
            (name, rules)
            VALUES (%s, %s)
            RETURNING *
        """, (name, rules)
        )
        conn.commit()
        curr_team = cursor.fetchone()
        cursor.execute(
        """
            INSERT INTO user_teams
            (user_id, team_id, roles)
            VALUES (%s, %s, %s)
        """, (current_user["id"], curr_team["id"], "Admin/Owner")
        )
        conn.commit()
        conn.close()
        return ResponseModel(True, "", {"team": curr_team})
    except PostgresError as e:
        conn.rollback()
        HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        HTTPException(status_code=400, detail=str(e))


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