import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.point import Point
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/points", tags=["Points"])


# Common logic for point validation and variable setup
def prepare_point_data(point: Point, is_patch=False):
    icon = point.icon
    radius = point.radius
    endLng = point.endLng
    endLat = point.endLat
    
    # Validation based on type
    allowed_types = ["icon", "home", "apartment", "unit", "radius", "line"]
    if point.type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid point type: '{point.type}'. Allowed types are: {', '.join(allowed_types)}")

    if point.type in ["home", "apartment", "unit"]:
        # These types use predefined icons, but can also store custom icons if passed
        pass
    elif point.type == "radius":
        if not is_patch and point.radius is None:
            raise HTTPException(status_code=400, detail="Missing radius for point type: 'radius'")
    elif point.type == "line":
        if not is_patch:
            if point.endLng is None or point.endLat is None:
                raise HTTPException(status_code=400, detail="Missing endLng and/or endLat for point type: 'line'")
        
        if point.endLng is not None and not (-180 <= point.endLng <= 180):
            raise HTTPException(status_code=400, detail="Invalid end longitude")
        if point.endLat is not None and not (-90 <= point.endLat <= 90):
            raise HTTPException(status_code=400, detail="Invalid end latitude")
            
    if not (-90 <= point.lat <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")
        
    return icon, radius, endLng, endLat, point.parent_id, point.extra_info


# Get All Points By User
@router.get("/all")
def get_all_points(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM points WHERE owner_id=%s", (current_user["id"],))
    points = cursor.fetchall()
    conn.close()
    return ResponseModel(True, "", {"points": points})


# Create Point
@router.post("")
def create_point(point: Point, current_user = Depends(get_current_user)):
    icon, radius, endLng, endLat, parent_id, extra_info = prepare_point_data(point)
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
                INSERT INTO points
                (owner_id, type, name, icon, lng, lat, radius, endLng, endLat, parent_id, extra_info)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
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
                endLat,
                parent_id,
                json.dumps(extra_info) if extra_info else None
            )
        )
        conn.commit()
        res_point = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "Point created", {"point": res_point})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Edit Point
@router.patch("/{id}")
def edit_point(id: int, point: Point, current_user = Depends(get_current_user)):
    icon, radius, endLng, endLat, parent_id, extra_info = prepare_point_data(point, is_patch=True)
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check if point exists and belongs to user
        cursor.execute("SELECT * FROM points WHERE id=%s AND owner_id=%s", (id, current_user["id"]))
        existing = cursor.fetchone()
        if not existing:
            conn.close()
            raise HTTPException(status_code=404, detail="Point not found")

        # For PATCH, we should probably only update what's changed, but using the model values is fine
        # as long as we handle NULLs correctly. If the model has None, should we keep existing?
        # Actually, let's just update everything with what the frontend sends.
        
        cursor.execute(
            """
                UPDATE points
                SET type=%s, name=%s, icon=%s, lng=%s, lat=%s, radius=%s, endLng=%s, endLat=%s, parent_id=%s, extra_info=%s
                WHERE id=%s AND owner_id=%s
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
                parent_id,
                json.dumps(extra_info) if extra_info else None,
                id,
                current_user["id"]
            )
        )
        conn.commit()
        cursor.execute("SELECT * FROM points WHERE id=%s", (id,))
        res_point = cursor.fetchone()
        print(f"BACKEND: Success editing point {id}. Owner: {current_user['id']}")
        conn.close()
        return ResponseModel(True, "Point updated", {"point": res_point})
    except IntegrityError as e:
        print(f"BACKEND ERROR: IntegrityError editing point {id}: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"BACKEND ERROR: Exception editing point {id}: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Delete Point
@router.delete("/{id}")
def delete_point(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM points WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
        conn.commit()
        print(f"BACKEND: Successfully deleted point {id} for user {current_user['id']}")
        conn.close()
        return ResponseModel(True, "Point deleted successfully")
    except Exception as e:
        print(f"BACKEND ERROR: Exception deleting point {id}: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))