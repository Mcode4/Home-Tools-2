import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.property import Property
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user
from app.utils.image_utils import delete_image

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/property", tags=["Property"])

# GET METHODS - ALL, BY ID
@router.get("/all")
def all_properties(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE owner_id=%s", (current_user["id"],))
    properties = cursor.fetchall()
    conn.close()
    
    if not properties:
        raise HTTPException(status_code=404, detail="User properties not found")
        
    results = []
    for row in properties:
        p = dict(row)
        if p.get("details"):
            # Postgres jsonb is already a dict if using RealDictCursor, 
            # but let's be safe if it comes as string
            if isinstance(p["details"], str):
                try:
                    p["details"] = json.loads(p["details"])
                except:
                    pass
        results.append(p)
    return ResponseModel(True, "", {"properties": results})


@router.get("/{id}")
def get_property_by_id(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE id=%s", (id,))
    curr_prop = cursor.fetchone()
    conn.close()
    
    if not curr_prop:
        raise HTTPException(status_code=404, detail=f"Property with ID {id} not found")
    if curr_prop["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="User does not have permission to access this property")
        
    prop = dict(curr_prop)
    if prop.get("details") and isinstance(prop["details"], str):
        try:
            prop["details"] = json.loads(prop["details"])
        except:
            pass
    return ResponseModel(True, "", {"property": prop})


# CREATE PROPERTY
@router.post("")
def create_property(property: Property, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Pydantic dict handles json conversion if needed for jsonb
        details = None
        if property.details is not None:
            details = json.dumps(property.details)
            
        cursor.execute(
            """
                INSERT INTO property
                (name, address, city, county, state, country, zip, owner_id, lat, lng, details)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
            """,
            (
                property.name, property.address, property.city, property.county, property.state,
                property.country, property.zip, current_user["id"], property.lat, property.lng, details,
            )
        )
        prop = cursor.fetchone()
        conn.commit()
        conn.close()
        
        if prop.get("details") and isinstance(prop["details"], str):
            try:
                prop["details"] = json.loads(prop["details"])
            except:
                pass
        return ResponseModel(True, "", {"property": prop})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Edit Property
@router.patch("/{id}")
def edit_property(id: int, property: Property, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM property WHERE id=%s", (id,))
        curr_prop = cursor.fetchone()
        if not curr_prop:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Property with ID {id} not found")
        if curr_prop["owner_id"] != current_user["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="You do not have permission to access this property")
            
        details = None
        if property.details is not None:
            details = json.dumps(property.details)

        cursor.execute(
            """
            UPDATE property
            SET name=%s, address=%s, city=%s, county=%s, state=%s, zip=%s, lat=%s, lng=%s, details=%s
            WHERE id=%s
            """,
            (
                property.name,
                property.address,
                property.city,
                property.county,
                property.state,
                property.zip,
                property.lat,
                property.lng,
                details,
                id,
            )
        )
        conn.commit()
        cursor.execute("SELECT * FROM property WHERE id=%s", (id,))
        curr_prop = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "Property edited successfully", {"property": curr_prop})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Delete Property
@router.delete("/{id}")
def delete_property(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM property WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
        prop = cursor.fetchone()
        if not prop:
            conn.close()
            raise HTTPException(status_code=404, detail="Property to delete not found")
            
        cursor.execute("SELECT * FROM images WHERE property_id=%s", (id,))
        images = cursor.fetchall()
        if images:
            for img in images:
                try:
                    # Logic here might need verification (filepath vs id)
                    delete_image(img["filepath"]) 
                except:
                    pass
                    
        cursor.execute("DELETE FROM property WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Property successfully deleted")
    except IntegrityError as e:
        if conn and not conn.closed: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        if conn and not conn.closed:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))