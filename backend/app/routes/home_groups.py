import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from psycopg2 import IntegrityError

from app.db.db import get_db
from app.models.home_group import HomeGroup
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/groups", tags=["HomeGroups"])


# Get All Groups By User ID (Note: Schema doesn't have user_id, assuming global or needs update)
@router.get("")
def get_home_group(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM home_groups")
    groups = cursor.fetchall()
    conn.close()
    return ResponseModel(True, "", {"groups": groups})


# Create Home Group
@router.post("")
def create_home_group(group: HomeGroup, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
                INSERT INTO home_groups (name, type, pinned)
                VALUES (%s, %s, %s)
                RETURNING *
            """,
            (group.name, group.type, group.pinned)
        )
        conn.commit()
        curr_group = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "Group created", {"group": curr_group})
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Edit Home Group
@router.patch("/{id}")
def edit_home_group(id: int, group: HomeGroup, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
                UPDATE home_groups
                SET name=%s, type=%s, pinned=%s
                WHERE id=%s
            """,
            (group.name, group.type, group.pinned, id)
        )
        conn.commit()
        cursor.execute("SELECT * FROM home_groups WHERE id=%s", (id,))
        curr_group = cursor.fetchone()
        conn.close()
        return ResponseModel(True, "Group updated", {"group": curr_group})
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))


# Deleted Home Group
@router.delete("/{id}")
def delete_home_group(id: int, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM home_groups WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return ResponseModel(True, "Group deleted")
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=400, detail=str(e))