import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.point import Point
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

# env_path = Path(__file__).resolve().parents[3] / ".env"
# load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/points", tags=["Points"], redirect_slashes=False)

# Get All Points
@router.get("/all")
def get_all_points(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "development":
        return _all_points_dev(current_user)
    if PROJECT_ENV == "production":
        return _all_points_prod(current_user)
    
def _all_points_dev(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, type, name, icon, lng, lat, radius, endLng, endLat FROM points WHERE owner_id=?", (current_user["id"],))
    points = cursor.fetchall()
    conn.close()
    return ResponseModel(True, "", {"points": points})

def _all_points_prod(current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, type, name, icon, lng, lat, radius, endLng, endLat FROM points WHERE owner_id=%s", (current_user["id"],))
    points = cursor.fetchall()
    conn.close()
    return ResponseModel(True, "", {"points": points})


# Add Point
@router.post("")
def add_point(point: Point, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "development":
        return _add_p_dev(point, current_user)
    if PROJECT_ENV == "production":
        return _add_p_prod(point, current_user)
    
def _add_p_dev(point: Point, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        icon = None
        radius = None
        endLng = None
        endLat = None
        if point.type == "icon":
            if point.icon:
                icon = point.icon
            else:
                raise HTTPException(status_code=400, detail="Missing icon for point type: 'icon'")
        if point.type == "radius":
            if point.radius:
                radius = point.radius
            else:
                raise HTTPException(status_code=400, detail="Missing radius for point type: 'radius'")
        if point.type == "line":
            if point.endLng and point.endLat:
                if not (-180 <= point.endLng <= 180):
                    raise HTTPException(status_code=400, detail="Invalid end longitude")
                if not (-90 <= point.endLat <= 90):
                    raise HTTPException(status_code=400, detail="Invalid end latitude")
                endLng = point.endLng
                endLat = point.endLat
            else:
                raise HTTPException(status_code=400, detail="Missing endLng and/or endLat for point type: 'line'")
        if not (-180 <= point.lng <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude")
        if not (-90 <= point.lat <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude")
        cursor.execute(
        """
            INSERT INTO points
            (owner_id, type, name, icon, lng, lat, radius, endLng, endLat)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            current_user["id"],
            point.type,
            point.name,
            icon,
            point.lng,
            point.lat,
            radius,
            endLng,
            endLat
        )
        )
        conn.commit()
        p_id = cursor.lastrowid
        cursor.execute("SELECT id, type, name, icon, lng, lat, radius, endLng, endLat FROM points WHERE id=?", (p_id,))
        point = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "", {"point": point})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _add_p_prod(point: Point, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    try:
        icon = None
        radius = None
        endLng = None
        endLat = None
        if point.type == "icon":
            if point.icon:
                icon = point.icon
            else:
                raise HTTPException(status_code=400, detail="Missing icon for point type: 'icon'")
        if point.type == "radius":
            if point.radius:
                radius = point.radius
            else:
                raise HTTPException(status_code=400, detail="Missing radius for point type: 'radius'")
        if point.type == "line":
            if point.endLng and point.endLat:
                if not (-180 <= point.endLng <= 180):
                    raise HTTPException(status_code=400, detail="Invalid end longitude")
                if not (-90 <= point.endLat <= 90):
                    raise HTTPException(status_code=400, detail="Invalid end latitude")
                endLng = point.endLng
                endLat = point.endLat
            else:
                raise HTTPException(status_code=400, detail="Missing endLng and/or endLat for point type: 'line'")
        if not (-180 <= point.lng <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude")
        if not (-90 <= point.lat <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude")
        cursor.execute(
        """
            INSERT INTO points
            (owner_id, type, name, icon, lng, lat, radius, endLng, endLat)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, type, name, icon, lng, lat, radius, endLng, endLat
        """,
        (
            current_user["id"],
            point.type,
            point.name,
            icon,
            point.lng,
            point.lat,
            radius,
            endLng,
            endLat
        )
        )
        conn.commit()
        point = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "", {"point": point})
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Edit Point
@router.patch("/{id}")
def edit_point(id: int, point: Point, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "development":
        return _edit_p_dev(id, point, current_user)
    if PROJECT_ENV == "production":
        return _edit_p_prod(id, point, current_user)
    
def _edit_p_dev(id: int, point: Point, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        icon = None
        radius = None
        endLng = None
        endLat = None
        if point.type == "icon":
            if point.icon:
                icon = point.icon
            else:
                raise HTTPException(status_code=400, detail="Missing icon for point type: 'icon'")
        if point.type == "radius":
            if point.radius:
                radius = point.radius
            else:
                raise HTTPException(status_code=400, detail="Missing radius for point type: 'radius'")
        if point.type == "line":
            if point.endLng and point.endLat:
                if not (-180 <= point.endLng <= 180):
                    raise HTTPException(status_code=400, detail="Invalid end longitude")
                if not (-90 <= point.endLat <= 90):
                    raise HTTPException(status_code=400, detail="Invalid end latitude")
                endLng = point.endLng
                endLat = point.endLat
            else:
                raise HTTPException(status_code=400, detail="Missing endLng and/or endLat for point type: 'line'")
        if not (-180 <= point.lng <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude")
        if not (-90 <= point.lat <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude")
        cursor.execute(
        """
            UPDATE points
            SET type=?, name=?, icon=?, lng=?, lat=?, radius=?, endLng=?, endLat=?
            WHERE id=? and owner_id=?
        """,
        (
            point.type,
            point.name,
            icon,
            point.lng,
            point.lat,
            radius,
            endLng,
            endLat,
            id,
            current_user["id"]
        )
        )
        conn.commit()
        cursor.execute("SELECT id, type, name, icon, lng, lat, radius, endLng, endLat FROM points WHERE id=?", (id,))
        point = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "", {"point": point})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _edit_p_prod(id: int, point: Point, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    try:
        icon = None
        radius = None
        endLng = None
        endLat = None
        if point.type == "icon":
            if point.icon:
                icon = point.icon
            else:
                raise HTTPException(status_code=400, detail="Missing icon for point type: 'icon'")
        if point.type == "radius":
            if point.radius:
                radius = point.radius
            else:
                raise HTTPException(status_code=400, detail="Missing radius for point type: 'radius'")
        if point.type == "line":
            if point.endLng and point.endLat:
                if not (-180 <= point.endLng <= 180):
                    raise HTTPException(status_code=400, detail="Invalid end longitude")
                if not (-90 <= point.endLat <= 90):
                    raise HTTPException(status_code=400, detail="Invalid end latitude")
                endLng = point.endLng
                endLat = point.endLat
            else:
                raise HTTPException(status_code=400, detail="Missing endLng and/or endLat for point type: 'line'")
        if not (-180 <= point.lng <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude")
        if not (-90 <= point.lat <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude")
        cursor.execute(
        """
            UPDATE points
            SET type=%s, name=%s, icon=%s, lng=%s, lat=%s, radius=%s, endLng=%s, endLat=%s
            WHERE id=%s and owner_id=%s
        """,
        (
            point.type,
            point.name,
            icon,
            point.lng,
            point.lat,
            radius,
            endLng,
            endLat,
            id,
            current_user["id"]
        )
        )
        conn.commit()
        cursor.execute("SELECT id, type, name, icon, lng, lat, radius, endLng, endLat FROM points WHERE id=%s", (id,))
        point = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "", {"point": point})
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Delete Point
@router.delete("/{id}")
def delete_point(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "development":
        return _delete_p_dev(id, current_user)
    if PROJECT_ENV == "production":
        return _delete_p_prod(id, current_user)
    
def _delete_p_dev(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM points WHERE id=? AND owner_id=?", (id, current_user["id"],))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Point deleted successfully")
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _delete_p_prod(id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM points WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Point deleted successfully")
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))