import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.floor import Floor, FloorSchema
from app.models.property import Property
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/floors", tags=["Floors"])

@router.get("/{id}/all")
def get_floors_by_prop_id(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    floors = db.query(Floor).filter(Floor.property_id == id, Floor.owner_id == current_user["id"]).all()
    if not floors:
        raise HTTPException(status_code=404, detail="Floors not found")
    return ResponseModel(True, "", {"floors": floors})

@router.post("")
def add_floor(floor_schema: FloorSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    prop = db.query(Property).filter(Property.id == floor_schema.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    try:
        new_floor = Floor(
            owner_id=current_user["id"],
            property_id=floor_schema.property_id,
            name=floor_schema.name,
            level_number=floor_schema.level_number,
            bedroom_count=floor_schema.bedroom_count,
            bathroom_count=floor_schema.bathroom_count,
            length=floor_schema.length,
            width=floor_schema.width,
            height=floor_schema.height,
            position=floor_schema.position
        )
        db.add(new_floor)
        db.commit()
        db.refresh(new_floor)
        return ResponseModel(True, "", {"floor": new_floor})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{id}")
def edit_floor(id: int, floor_schema: FloorSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    floor = db.query(Floor).filter(Floor.id == id, Floor.owner_id == current_user["id"]).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    try:
        update_data = floor_schema.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(floor, key, value)
        db.commit()
        db.refresh(floor)
        return ResponseModel(True, "", {"floor": floor})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
def delete_floor(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    floor = db.query(Floor).filter(Floor.id == id, Floor.owner_id == current_user["id"]).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    try:
        db.delete(floor)
        db.commit()
        return ResponseModel(True, "Floor successfully deleted")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
