import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.saved_types import SavedType, SavedTypeSchema
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/types", tags=["SavedTypes"])


# Get All Saved Types
@router.get("")
def get_saved_types(current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    types = db.query(SavedType).filter(SavedType.owner_id == current_user["id"]).all()
    return ResponseModel(True, "", {"types": types})


# Create Saved Type
@router.post("")
def create_saved_type(saved_type_schema: SavedTypeSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        new_type = SavedType(
            name=saved_type_schema.name,
            type=saved_type_schema.type,
            extra_info=saved_type_schema.extra_info,
            owner_id=current_user["id"]
        )
        db.add(new_type)
        db.commit()
        db.refresh(new_type)
        return ResponseModel(True, "Saved type created", {"type": new_type})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Delete Saved Type
@router.delete("/{id}")
def delete_saved_type(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    try:
        saved_type = db.query(SavedType).filter(SavedType.id == id, SavedType.owner_id == current_user["id"]).first()
        if not saved_type:
            raise HTTPException(status_code=404, detail="Saved type not found")
            
        db.delete(saved_type)
        db.commit()
        return ResponseModel(True, "Saved type deleted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
