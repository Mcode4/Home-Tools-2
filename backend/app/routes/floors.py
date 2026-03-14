import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.routes.auth import get_current_user
from app.models.floor import Floor
from app.models.response_model import ResponseModel

# env_path = Path(__file__).resolve().parents[3] / ".env"
# load_dotenv(env_path)

PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/floors", tags=["Floors"])

# Get floors by property_id
@router.get("/{property_id}")
def get_floors_by_property_id(property_id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _get_floors_pid_prod(property_id, current_user)
    if PROJECT_ENV == "development":
        return _get_floors_pid_dev(property_id, current_user)
    

def _get_floors_pid_prod(property_id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE property_id=%s AND owner_id=%s", (property_id, current_user["id"]))
    floors = cursor.fetchall()
    if not floors:
        conn.close()
        raise HTTPException(status_code=404, detail="Floors not found")
    conn.close()
    for f in floors:
        try:
            extra = f.get("extra_rooms")
            if extra:
                extra = json.loads(extra)
        except:
            pass
    return ResponseModel(True, "", {"floors": floors})


def _get_floors_pid_dev(property_id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE property_id=? AND owner_id=?", (property_id, current_user["id"]))
    floors = cursor.fetchall()
    if not floors:
        conn.close()
        raise HTTPException(status_code=404, detail="Floors not found")
    conn.close()
    for f in floors:
        try:
            extra = f.get("extra_rooms")
            if extra:
                f["extra_rooms"] = json.loads(extra)
        except:
            pass
    return ResponseModel(True, "", {"floors": floors})


# Create floor
@router.post("/")
def add_floor(floor: Floor, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _add_floor_prod(floor, current_user)
    if PROJECT_ENV == "development":
        return _add_floor_dev(floor, current_user)
    

def _add_floor_prod(floor: Floor, current_user = Depends(get_current_user)):
    conn = get_pg_db()
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
            VALUES(%s, %s, %s, %s, %s, %s,)
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
        if curr_floor.get("extra_rooms"):
            curr_floor["extra_rooms"] = json.loads(curr_floor["extra_rooms"])
        return ResponseModel(True, "", {"floor": curr_floor})
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

def _add_floor_dev(floor: Floor, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM property WHERE id=?", (floor.property_id,))
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
            VALUES(?, ?, ?, ?, ?, ?,)
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
        f_id = cursor.lastrowid
        cursor.execute("SELECT * FROM floors WHERE id=?", (f_id,))
        curr_floor = cursor.fetchone()
        conn.close()
        if curr_floor.get("extra_rooms"):
            curr_floor["extra_rooms"] = json.loads(curr_floor["extra_rooms"])
        return ResponseModel(True, "", {"floor": curr_floor})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Edit floor at ID
@router.patch("/{id}")
def edit_floor(id: int, floor: Floor, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _edit_fid_prod(id, floor, current_user)
    if PROJECT_ENV == "development":
        return _edit_fid_dev(id, floor, current_user)


def _edit_fid_prod(id: int, floor: Floor, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    target = cursor.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Floors not found")
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
        if curr_floor.get("extra_rooms"):
            curr_floor["extra_rooms"] = json.loads(curr_floor["extra_rooms"])
        return ResponseModel(True, "", {"floor": curr_floor})
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        


def _edit_fid_dev(id: int, floor: Floor, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE id=? AND owner_id=?", (id, current_user["id"],))
    target = cursor.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Floors not found")
    try:
        extra = None
        if floor.extra_rooms:
            extra = json.dumps(floor.extra_rooms)
        cursor.execute(
        """
            UPDATE floors
            SET name=?, bedrooms=?, extra_rooms=?
            WHERE id=?
        """,
        (
            floor.name,
            floor.bedrooms,
            extra,
            id
        )
        )
        conn.commit()
        cursor.execute("SELECT * FROM floors WHERE id=?", (id,))
        curr_floor = cursor.fetchone()
        conn.close()
        if curr_floor.get("extra_rooms"):
            curr_floor["extra_rooms"] = json.loads(curr_floor["extra_rooms"])
        return ResponseModel(True, "", {"floor": curr_floor})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Delete floor at ID
@router.delete("/{id}")
def delete_floor(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _del_fid_prod(id, current_user)
    if PROJECT_ENV == "development":
        return _del_fid_dev(id, current_user)
    

def _del_fid_prod(id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
    target = cursor.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Floors not found")
    try:
        cursor.execute("DELETE FROM floors WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Floor successfully deleted")
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _del_fid_dev(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM floors WHERE id=? AND owner_id=?", (id, current_user["id"],))
    target = cursor.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Floors not found")
    try:
        cursor.execute("DELETE FROM floors WHERE id=?", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Floor successfully deleted")
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
