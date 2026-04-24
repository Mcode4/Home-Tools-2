from fastapi import APIRouter, Depends, HTTPException
from app.db.db import get_db
from app.routes.auth import get_current_user
from app.models.settings import Settings, SettingsUpdate
from app.models.response_model import ResponseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/")
def get_settings(current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM settings WHERE user_id = %s", (current_user["id"],))
    settings = cursor.fetchone()
    
    if not settings:
        # Create default settings if they don't exist
        cursor.execute(
            "INSERT INTO settings (user_id) VALUES (%s) RETURNING *",
            (current_user["id"],)
        )
        settings = cursor.fetchone()
        conn.commit()
    
    conn.close()
    return ResponseModel(True, "Settings retrieved", {"settings": settings})

@router.put("/")
def update_settings(update: SettingsUpdate, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if settings exists
    cursor.execute("SELECT * FROM settings WHERE user_id = %s", (current_user["id"],))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO settings (user_id) VALUES (%s)", (current_user["id"],))
    
    # Build update query
    update_data = update.dict(exclude_unset=True)
    if not update_data:
        conn.close()
        return ResponseModel(True, "No changes provided")
    
    fields = []
    values = []
    for field, value in update_data.items():
        fields.append(f"{field} = %s")
        values.append(value)
    
    values.append(current_user["id"])
    query = f"UPDATE settings SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING *"
    
    cursor.execute(query, tuple(values))
    updated_settings = cursor.fetchone()
    conn.commit()
    conn.close()
    
    return ResponseModel(True, "Settings updated", {"settings": updated_settings})
