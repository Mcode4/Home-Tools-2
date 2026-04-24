import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.home_group import HomeGroup, HomeGroupSchema
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/groups", tags=["HomeGroups"])


# Get All Groups
@router.get("")
def get_home_group(current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    groups = db.query(HomeGroup).all()
    return ResponseModel(True, "", {"groups": groups})


# Create Home Group
@router.post("")
def create_home_group(group_schema: HomeGroupSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        new_group = HomeGroup(
            name=group_schema.name,
            type=group_schema.type,
            pinned=1 if group_schema.pinned else 0
        )
        db.add(new_group)
        db.commit()
        db.refresh(new_group)
        return ResponseModel(True, "Group created", {"group": new_group})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Edit Home Group
@router.patch("/{id}")
def edit_home_group(id: int, group_schema: HomeGroupSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        group = db.query(HomeGroup).filter(HomeGroup.id == id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
            
        group.name = group_schema.name
        group.type = group_schema.type
        group.pinned = 1 if group_schema.pinned else 0
        
        db.commit()
        db.refresh(group)
        return ResponseModel(True, "Group updated", {"group": group})
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Deleted Home Group
@router.delete("/{id}")
def delete_home_group(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        group = db.query(HomeGroup).filter(HomeGroup.id == id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
            
        db.delete(group)
        db.commit()
        return ResponseModel(True, "Group deleted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))