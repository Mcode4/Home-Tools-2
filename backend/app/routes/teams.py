import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.team import Team, TeamSchema
from app.models.user import User
from app.models.user_team import UserTeam
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/teams", tags=["Teams"])

# Help Functions
def verify_team_and_member(db: Session, team_id: int, current_id: int):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        return {"success": False, "message": "Team not found", "status": 404}
        
    user_team_entry = db.query(UserTeam).filter(UserTeam.team_id == team_id, UserTeam.user_id == current_id).first()
    
    if not user_team_entry:
        return {"success": False, "message": "User not authorized to view team", "status": 403}
        
    members = []
    for ut in team.user_teams:
        u = ut.user
        if u:
            members.append({
                "email": u.email,
                "username": u.username,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone_number": u.phone_number,
                "profile_icon": u.profile_icon
            })
            
    return {"success": True, "data": {"members": members}}

# Get Members From Team 
@router.get("/{id}")
def get_team_members(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    verify = verify_team_and_member(db, id, current_user["id"])
    
    if not verify["success"]:
        raise HTTPException(status_code=verify["status"], detail=verify["message"])
        
    return ResponseModel(True, "", {"members": verify["data"]["members"]})


# Create Team
@router.post("/")
def create_team(team_schema: TeamSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        # Default name if not provided
        name = team_schema.name if team_schema.name else f"{current_user.get('first_name', 'User')}'s Team"
        rules = team_schema.rules
        
        new_team = Team(name=name, rules=rules)
        db.add(new_team)
        db.flush() # Get the generated ID
        
        # Add current user as admin
        admin_member = UserTeam(
            user_id=current_user["id"],
            team_id=new_team.id,
            roles="Admin/Owner"
        )
        db.add(admin_member)
        db.commit()
        db.refresh(new_team)
        
        team_data = {"id": new_team.id, "name": new_team.name, "rules": new_team.rules}
        return ResponseModel(True, "", {"team": team_data})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{id}/{action}")
def edit_team(id: int, action: str, team_schema: TeamSchema, current_user = Depends(get_current_user)):
    # Placeholder for team editing logic
    return ResponseModel(True, "Team update logic not implemented")


@router.delete("/{id}")
def delete_team(id: int, current_user = Depends(get_current_user)):
    # Placeholder for team deletion logic
    return ResponseModel(True, "Team deletion logic not implemented")