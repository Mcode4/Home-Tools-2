import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv

from app.db.db import get_db
from app.routes.auth import get_current_user, verify_password, hash_password
from app.models.user import User, UserInfo
from app.models.response_model import ResponseModel

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/users", tags=["Users"])


# Get All Users, By Id
@router.get("/all")
def get_all_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, phone_number FROM users")
    users = cursor.fetchall()
    conn.close()
    return ResponseModel(True, "", {"users": users})


@router.get("/{id}")
def get_user_by_id(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, phone_number FROM users WHERE id=%s", (id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(True, "", {"user": user})


# Update Basic Info and Account Info
@router.patch("/")
def edit_basic_info(user_info: UserInfo, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=%s", (current_user["id"],))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(user_info.password, user["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    cursor.execute(
        """
            UPDATE users
            SET name=%s, phone_number=%s
            WHERE id=%s
        """,
        (user_info.name, user_info.phone, current_user["id"],)
    )
    conn.commit()
    cursor.execute("SELECT email, name, phone_number FROM users WHERE id=%s", (current_user["id"],))
    user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": user})


@router.patch("/account")
def edit_account_info(user: User, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=%s", (current_user["id"],))
    curr_user = cursor.fetchone()
    
    if not curr_user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(user.password, curr_user["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    password = hash_password(user.password)
    cursor.execute(
        """
            UPDATE users
            SET email=%s, password=%s
            WHERE id=%s
        """,
        (user.email, password, current_user["id"],)
    )
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id=%s", (current_user["id"],))
    curr_user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": curr_user})


# Delete User
@router.delete("/")
def delete_user(password: str, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=%s", (current_user["id"],))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password, user["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    cursor.execute("DELETE FROM users WHERE id=%s", (current_user["id"],))
    conn.commit()
    conn.close()
    return ResponseModel(True, "User successfully deleted")