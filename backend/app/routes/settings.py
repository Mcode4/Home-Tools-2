from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.routes.auth import get_current_user
from app.models.settings import Settings, SettingsUpdateSchema
from app.models.response_model import ResponseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/")
def get_settings(current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    settings = db.query(Settings).filter(Settings.user_id == current_user["id"]).first()
    
    if not settings:
        # Create default settings if they don't exist
        settings = Settings(user_id=current_user["id"])
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return ResponseModel(True, "Settings retrieved", {"settings": settings})

@router.put("/")
def update_settings(update: SettingsUpdateSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    settings = db.query(Settings).filter(Settings.user_id == current_user["id"]).first()
    
    if not settings:
        settings = Settings(user_id=current_user["id"])
        db.add(settings)
        db.flush()
    
    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        return ResponseModel(True, "No changes provided")
    
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    
    return ResponseModel(True, "Settings updated", {"settings": settings})
