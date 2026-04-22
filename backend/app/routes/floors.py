import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.floor import Floor
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/floors", tags=["Floors"])

# Get floors belonging to property at ID
@router.get("/{id}/all")
def get_floors_by_prop_id(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE property_id=%s AND owner_id=%s", (id, current_user["id"],))
    floors = cursor.fetchall()
    conn.close()
    
    if not floors:
        raise HTTPException(status_code=404, detail="Floors not found")
        
    for f in floors:
        try:
            extra = f.get("extra_rooms")
            if extra and isinstance(extra, str):
                f["extra_rooms"] = json.loads(extra)
        except:
            pass
    return ResponseModel(True, "", {"floors": floors})


# Create floor
@router.post("")
def add_floor(floor: Floor, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM property WHERE id=%s", (floor.property_id,))
    p_id = cursor.fetchone()
    if not p_id:
        conn.close()
        raise HTTPException(status_code=404, detail="Property not found")
        
    try:
        extra = None
        if floor.extra_rooms:
            extra = json.dumps(floor.extra_rooms)
            
        cursor.execute(
            """
                INSERT INTO floors
                (owner_id, property_id, name, bedrooms, bathrooms, extra_rooms)
                VALUES(%s, %s, %s, %s, %s, %s)
                RETURNING *
            """,
            (
                current_user["id"],
                floor.property_id,
                floor.name,
                floor.bedrooms,
                floor.bathrooms,
                extra
            )
        )
        conn.commit()
        curr_floor = cursor.fetchone()
        conn.close()
        
        if curr_floor.get("extra_rooms") and isinstance(curr_floor["extra_rooms"], str):
            curr_floor["extra_rooms"] = json.loads(curr_floor["extra_rooms"])
        return ResponseModel(True, "", {"floor": curr_floor})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Edit floor at ID
@router.patch("/{id}")
def edit_floor(id: int, floor: Floor, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="Floor not found")
        
    try:
        extra = None
        if floor.extra_rooms:
            extra = json.dumps(floor.extra_rooms)
            
        cursor.execute(
            """
                UPDATE floors
                SET name=%s, bedrooms=%s, extra_rooms=%s
                WHERE id=%s
            """,
            (
                floor.name,
                floor.bedrooms,
                extra,
                id
            )
        )
        conn.commit()
        cursor.execute("SELECT * FROM floors WHERE id=%s", (id,))
        curr_floor = cursor.fetchone()
        conn.close()
        
        if curr_floor.get("extra_rooms") and isinstance(curr_floor["extra_rooms"], str):
            curr_floor["extra_rooms"] = json.loads(curr_floor["extra_rooms"])
        return ResponseModel(True, "", {"floor": curr_floor})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Delete floor at ID
@router.delete("/{id}")
def delete_floor(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="Floor not found")
        
    try:
        cursor.execute("DELETE FROM floors WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Floor successfully deleted")
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))
