import os
import json
fastapi import APIRouter, HTTPException, Depends, Response, Cookie
from dotenv import load_dotenv
from pathlib import Path

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.property import Property
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/property", tags=["Property"])

def deep_merge(original, patch):
    for key, value in patch.items():
        if (
            key in original
            and isinstance(value, dict)
        ):
            deep_merge(original[key], value)
        else:
            original[key] = value
    return original

# GET METHODS - ALL, BY ID
@router.get("/all")
def all_properties(current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        properties = _get_properties_prod(current_user)
    if PROJECT_ENV == "development":
        properties = _get_properties_dev(current_user)
    if not properties:
        return ResponseModel(False, "User properties not found")
    pinned_results = []
    for row in properties["pinned"]:
        p = dict(row)
        if p.get("details"):
            try:
                p["details"] = json.loads(p["details"])
            except:
                pass
        pinned_results.append(p)
    results = []
    for row in properties["pinned"]:
        p = dict(row)
        if p.get("details"):
            try:
                p["details"] = json.loads(p["details"])
            except:
                pass
        results.append(p)
    results = []
    return ResponseModel(True, "", {"pinned": pinned_results, "other": results})

    
    
def _get_properties_prod(current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECRT * FROM property WHERE owner_id=%s AND pinned=1", (current_user["id"],))
    pinned = cursor.fetchall()
    cursor.execute("SELECRT * FROM property WHERE owner_id=%s AND pinned=0", (current_user["id"],))
    properties = cursor.fetchall()
    conn.close()
    if not (pinned or properties):
        raise HTTPException(status_code=404, detail="User properties not found")
    return {"pinned": pinned, "others": properties}


def _get_properties_dev(current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECRT * FROM property WHERE owner_id=? AND pinned=1", (current_user["id"],))
    pinned = cursor.fetchall()
    cursor.execute("SELECRT * FROM property WHERE owner_id=? AND pinned=0", (current_user["id"],))
    properties = cursor.fetchall()
    conn.close()
    if not (pinned or properties):
        raise HTTPException(status_code=404, detail="User properties not found")
    return {"pinned": pinned, "others": properties}


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
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE id=%s", (id,))
    curr_prop = cursor.fetchone()
    conn.close()
    return curr_prop


def _get_prop_dev(id: int, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property WHERE id=?", (id,))
    curr_prop = cursor.fetchone()
    conn.close()
    return curr_prop


# CREATE PROPERTY
@router.post("/")
def create_property(property: Property, current_user = Depends(get_current_user)):
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
            (name, address, city, state, country, zip, owner_id, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s,)
                RETURNING *
        """,
        (
            property.name, property.address, property.city, property.state,
            property.country, property.zip, current_user["id"], details,
        )
        )
        prop = cursor.fetchone()
        conn.commit()
        conn.close()
        result = {}
        for row in prop:
            if row == "details":
                try:
                    result["details"] = json.loads(prop["details"])
                except:
                    result["details"] = prop["details"]
            else:
                result[row] = prop[row]
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))


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
            (name, address, city, state, country, zip, owner_id, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?,)
                RETURNING *
        """,
        (
            property.name, property.address, property.city, property.state,
            property.country, property.zip, current_user["id"], details,
        )
        )
        prop = cursor.fetchone()
        conn.commit()
        conn.close()
        result = {}
        for row in prop:
            if row == "details":
                try:
                    result["details"] = json.loads(prop["details"])
                except:
                    result["details"] = prop["details"]
            else:
                result[row] = prop[row]
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    

# Edit Property
@router.patch("{id}")
def edit_property(id: int, property: Property, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return _edit_prop_prod(id, property, current_user)
    if PROJECT_ENV == "development":
        return _edit_prop_dev(id, property, current_user)
    

def _edit_prop_prod(id: int, property: Property, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
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
    SET name=%s, address=%s, city=%s, state=%s, zip=%s, details=%s::jsonb
    WHERE id=%s
    """,
    (
        property.name,
        property.address,
        property.city,
        property.state,
        property.zip,
        property.details,
        id,
    )
    )
    conn.commit()
    conn.close()
    return ResponseModel(True, "Property edited successfully")

def _edit_prop_dev(id: int, property: Property, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
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
    SET name=?, address=?, city=?, state=?, zip=?, details=?::jsonb
    WHERE id=?
    """,
    (
        property.name,
        property.address,
        property.city,
        property.state,
        property.zip,
        property.details,
        id,
    )
    )
    conn.commit()
    conn.close()
    return ResponseModel(True, "Property edited successfully")

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
        cursor.execute("DELETE FROM property WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Property successfully deleted")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def _del_prop_dev(id: int, current_user = Depends(get_current_user)):
    try:
        conn = get_pg_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM property WHERE id=? AND owner_id=?", (id, current_user["id"],))
        prop = cursor.fetchone()
        if not prop:
            raise HTTPException(status_code=404, detail="Property to delete not found")
        cursor.execute("DELETE FROM property WHERE id=?", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Property successfully deleted")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))