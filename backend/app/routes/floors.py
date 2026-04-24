import os
import json
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

# Get floors belonging to property at ID
@router.get("/{id}/all")
def get_floors_by_prop_id(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    floors = db.query(Floor).filter(Floor.property_id == id, Floor.owner_id == current_user["id"]).all()
    
    if not floors:
        raise HTTPException(status_code=404, detail="Floors not found")
        
    for f in floors:
        if f.extra_rooms and isinstance(f.extra_rooms, str):
            try:
                f.extra_rooms = json.loads(f.extra_rooms)
            except:
                pass
    return ResponseModel(True, "", {"floors": floors})


# Create floor
@router.post("")
def add_floor(floor_schema: FloorSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    prop = db.query(Property).filter(Property.id == floor_schema.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    try:
        extra = None
        if floor_schema.extra_rooms:
            extra = json.dumps(floor_schema.extra_rooms)
            
        new_floor = Floor(
            owner_id=current_user["id"],
            property_id=floor_schema.property_id,
            name=floor_schema.name,
            bedrooms=floor_schema.bedrooms,
            bathrooms=floor_schema.bathrooms,
            extra_rooms=extra
        )
        db.add(new_floor)
        db.commit()
        db.refresh(new_floor)
        
        if new_floor.extra_rooms and isinstance(new_floor.extra_rooms, str):
            try:
                new_floor.extra_rooms = json.loads(new_floor.extra_rooms)
            except:
                pass
        return ResponseModel(True, "", {"floor": new_floor})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Edit floor at ID
@router.patch("/{id}")
def edit_floor(id: int, floor_schema: FloorSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    floor = db.query(Floor).filter(Floor.id == id, Floor.owner_id == current_user["id"]).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
        
    try:
        if floor_schema.extra_rooms:
            floor.extra_rooms = json.dumps(floor_schema.extra_rooms)
            
        floor.name = floor_schema.name
        floor.bedrooms = floor_schema.bedrooms
        floor.bathrooms = floor_schema.bathrooms

        db.commit()
        db.refresh(floor)
        
        if floor.extra_rooms and isinstance(floor.extra_rooms, str):
            try:
                floor.extra_rooms = json.loads(floor.extra_rooms)
            except:
                pass
        return ResponseModel(True, "", {"floor": floor})
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Delete floor at ID
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
