import os
import json
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.property import Property
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user
from app.utils.image_utils import delete_image

# env_path = Path(__file__).resolve().parents[3] / ".env"
# load_dotenv(env_path)
load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/property", tags=["Property"])

# GET METHODS - ALL, BY ID
@router.get("/all")
def all_properties(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _get_properties_prod(current_user)
    if PROJECT_ENV == "development":
        return _get_properties_dev(current_user)
    
    
def _get_properties_prod(current_user = Depends(get_current_user)):
    conn = get_pg_db()
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
            try:
                p["details"] = json.loads(p["details"])
            except:
                pass
        results.append(p)
    return ResponseModel(True, "", {"properties": results})


def _get_properties_dev(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE owner_id=?", (current_user["id"],))
    properties = cursor.fetchall()
    conn.close()
    if not properties:
        raise HTTPException(status_code=404, detail="User properties not found")
    results = []
    for row in properties:
        p = dict(row)
        if p.get("details"):
            try:
                p["details"] = json.loads(p["details"])
            except:
                pass
        results.append(p)
    return ResponseModel(True, "", {"properties": results})


@router.get("/{id}")
def get_property_by_id(id: int, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        curr_prop = _get_prop_prod(id, current_user)
    if PROJECT_ENV == "development":
        curr_prop = _get_prop_dev(id, current_user)
    if not curr_prop:
        raise HTTPException(status_code=404, detail=f"Property with ID {id} not found")
    if curr_prop["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="User does not have permission to access this property")
    prop = dict(curr_prop)
    if prop.get("details"):
        try:
            prop["details"] = json.loads(prop["details"])
        except:
            pass
    return ResponseModel(True, "", {"property": prop})


def _get_prop_prod(id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE id=%s", (id,))
    curr_prop = cursor.fetchone()
    conn.close()
    return curr_prop


def _get_prop_dev(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE id=?", (id,))
    curr_prop = cursor.fetchone()
    conn.close()
    return curr_prop


# CREATE PROPERTY
@router.post("")
def create_property(property: Property, current_user = Depends(get_current_user)):
    print("PROJECT ENV:", PROJECT_ENV)
    print("CURRENT USER:", current_user)
    if PROJECT_ENV == "production":
        return _add_prop_prod(property, current_user)
    if PROJECT_ENV == "development":
        return _add_prop_dev(property, current_user)
    

def _add_prop_prod(property: Property, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    try:
        details = None
        if getattr(property, "details", None) is not None:
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
        if prop.get("details"):
            try:
                prop["details"] = json.loads(prop["details"])
            except:
                prop["details"] = prop["details"]
        return ResponseModel(True, "", {"property": prop})
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail={f'property: {property}, {str(e)}'})


def _add_prop_dev(property: Property, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        details = None
        if getattr(property, "details", None) is not None:
            details = json.dumps(property.details)
        cursor.execute(
        """
            INSERT INTO property
            (name, address, city, county, state, country, zip, owner_id, lat, lng, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            property.name, property.address, property.city, property.county, property.state,
            property.country, property.zip, current_user["id"], property.lat, property.lng, details,
        )
        )
        conn.commit()
        p_id = cursor.lastrowid
        cursor.execute("SELECT * FROM property WHERE id=?", (p_id,))
        prop = cursor.fetchone()
        conn.close()
        if prop["details"]:
            try:
                prop["details"] = json.loads(prop["details"])
            except:
                prop["details"] = prop["details"]
        return ResponseModel(True, "", {"property": prop})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

# Edit Property
@router.patch("/{id}")
def edit_property(id: int, property: Property, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _edit_prop_prod(id, property, current_user)
    if PROJECT_ENV == "development":
        return _edit_prop_dev(id, property, current_user)
    

def _edit_prop_prod(id: int, property: Property, current_user = Depends(get_current_user)):
    conn = get_pg_db()
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
        cursor.execute(
        """
        UPDATE property
        SET name=%s, address=%s, city=%s, county=%s, state=%s, zip=%s, lat=%s, lng=%s, details=%s
        WHERE id=%a
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
            property.details,
            id,
        )
        )
        conn.commit()
        cursor.execute("SELECT * FROM property WHERE id=%s", (id,))
        curr_prop = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "Property edited successfully", {"property": curr_prop})
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _edit_prop_dev(id: int, property: Property, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM property WHERE id=?", (id,))
        curr_prop = cursor.fetchone()
        if not curr_prop:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Property with ID {id} not found")
        if curr_prop["owner_id"] != current_user["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="You do not have permission to access this property")
        cursor.execute(
        """
        UPDATE property
        SET name=?, address=?, city=?, county=?, state=?, zip=?, lat=?, lng=?, details=?
        WHERE id=?
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
            property.details,
            id,
        )
        )
        conn.commit()
        cursor.execute("SELECT * FROM property WHERE id=?", (id,))
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
    if PROJECT_ENV == "production":
        return _del_prop_prod(id, current_user)
    if PROJECT_ENV == "development":
        return _del_prop_dev(id, current_user)
    

def _del_prop_prod(id: int, current_user = Depends(get_current_user)):
    try:
        conn = get_pg_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM property WHERE id=%s AND owner_id=%s", (id, current_user["id"],))
        prop = cursor.fetchone()
        if not prop:
            raise HTTPException(status_code=404, detail="Property to delete not found")
        cursor.execute("SELECT * FROM images WHERE property_id=%s", (id,))
        images = cursor.fetchall()
        if images:
            for img in images:
                try:
                    delete_property(img["filepath"])
                except:
                    pass
        cursor.execute("DELETE FROM property WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Property successfully deleted")
    except PostgresError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def _del_prop_dev(id: int, current_user = Depends(get_current_user)):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM property WHERE id=? AND owner_id=?", (id, current_user["id"],))
        prop = cursor.fetchone()
        print("DELETE PROP", prop)
        if not prop:
            raise HTTPException(status_code=404, detail="Property to delete not found")
        cursor.execute("SELECT * FROM images WHERE property_id=?", (id,))
        images = cursor.fetchall()
        if images:
            for img in images:
                try:
                    delete_property(img["filepath"])
                except:
                    pass
        cursor.execute("DELETE FROM property WHERE id=?", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Property successfully deleted")
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))