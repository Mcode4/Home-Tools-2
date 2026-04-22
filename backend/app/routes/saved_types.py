import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.saved_types import SavedType
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/types", tags=["SavedTypes"])


# Get All Saved Types
@router.get("")
def get_saved_types(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_types WHERE owner_id=%s", (current_user["id"],))
    types = cursor.fetchall()
    conn.close()
    
    for t in types:
        if t.get("extra_info") and isinstance(t["extra_info"], str):
            try:
                t["extra_info"] = json.loads(t["extra_info"])
            except:
                pass
    return ResponseModel(True, "", {"types": types})


# Create Saved Type
@router.post("")
def create_saved_type(saved_type: SavedType, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        extra_info = None
        if saved_type.extra_info:
            extra_info = json.dumps(saved_type.extra_info)
            
        cursor.execute(
            """
                INSERT INTO saved_types (name, type, extra_info, owner_id)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """,
            (saved_type.name, saved_type.type, extra_info, current_user["id"])
        )
        conn.commit()
        curr_type = cursor.fetchone()
        conn.close()
        
        if curr_type.get("extra_info") and isinstance(curr_type["extra_info"], str):
            curr_type["extra_info"] = json.loads(curr_type["extra_info"])
        return ResponseModel(True, "Saved type created", {"type": curr_type})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Delete Saved Type
@router.delete("/{id}")
def delete_saved_type(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM saved_types WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Saved type deleted")
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))
