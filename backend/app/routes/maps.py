from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db_session
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.map import Map, MapCreate, MapUpdate, MapResponse

router = APIRouter(prefix="/maps", tags=["maps"])

@router.get("/", response_model=List[MapResponse])
def get_maps(db: Session = Depends(get_db_session), current_user: dict = Depends(get_current_user)):
    maps = db.query(Map).filter(Map.owner_id == current_user["id"]).all()
    return maps

@router.post("/", response_model=MapResponse)
def create_map(map_data: MapCreate, db: Session = Depends(get_db_session), current_user: dict = Depends(get_current_user)):
    new_map = Map(**map_data.model_dump(), owner_id=current_user["id"])
    db.add(new_map)
    db.commit()
    db.refresh(new_map)
    return new_map

@router.get("/{map_id}", response_model=MapResponse)
def get_map(map_id: int, db: Session = Depends(get_db_session), current_user: dict = Depends(get_current_user)):
    db_map = db.query(Map).filter(Map.id == map_id, Map.owner_id == current_user["id"]).first()
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    return db_map

@router.put("/{map_id}", response_model=MapResponse)
def update_map(map_id: int, map_update: MapUpdate, db: Session = Depends(get_db_session), current_user: dict = Depends(get_current_user)):
    db_map = db.query(Map).filter(Map.id == map_id, Map.owner_id == current_user["id"]).first()
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    update_data = map_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_map, key, value)
        
    db.commit()
    db.refresh(db_map)
    return db_map

@router.delete("/{map_id}")
def delete_map(map_id: int, db: Session = Depends(get_db_session), current_user: dict = Depends(get_current_user)):
    db_map = db.query(Map).filter(Map.id == map_id, Map.owner_id == current_user["id"]).first()
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
        
    db.delete(db_map)
    db.commit()
    return {"message": "Map deleted successfully"}
