import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.team import Team
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/teams", tags=["Teams"])

# Help Functions
def verify_team_and_member(cursor, team_id: int, current_id: int):
    cursor.execute("SELECT * FROM teams WHERE id=%s", (team_id,))
    team = cursor.fetchone()
    if not team:
        return {"success": False, "message": "Team not found", "status": 404}
        
    cursor.execute("SELECT user_id FROM user_teams WHERE team_id=%s", (team_id,))
    member_rows = cursor.fetchall()
    
    is_member = False
    members = []
    for row in member_rows:
        if row["user_id"] == current_id:
            is_member = True
        
        cursor.execute("SELECT email, name, phone_number, profile_icon FROM users WHERE id=%s", (row["user_id"],))
        mem = cursor.fetchone()
        if mem:
            members.append(mem)
            
    if not is_member:
        return {"success": False, "message": "User not authorized to view team", "status": 403}
        
    return {"success": True, "data": {"members": members}}

# Get Members From Team 
@router.get("/{id}")
def get_team_members(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    verify = verify_team_and_member(cursor, id, current_user["id"])
    conn.close()
    
    if not verify["success"]:
        raise HTTPException(status_code=verify["status"], detail=verify["message"])
        
    return ResponseModel(True, "", {"members": verify["data"]["members"]})


# Create Team
@router.post("/")
def create_team(team: Team, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Default name if not provided
        name = team.name if hasattr(team, 'name') and team.name else f"{current_user['name']}'s Team"
        rules = team.rules if hasattr(team, 'rules') else None
        
        cursor.execute(
            """
                INSERT INTO teams 
                (name, rules)
                VALUES (%s, %s)
                RETURNING *
            """, (name, rules)
        )
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
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{id}/{action}")
def edit_team(id: int, action: str, team: Team, current_user = Depends(get_current_user)):
    # Placeholder for team editing logic
    return ResponseModel(True, "Team update logic not implemented")


@router.delete("/{id}")
def delete_team(id: int, current_user = Depends(get_current_user)):
    # Placeholder for team deletion logic
    return ResponseModel(True, "Team deletion logic not implemented")