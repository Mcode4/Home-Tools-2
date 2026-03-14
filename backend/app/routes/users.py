import os
from fastapi import APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from pathlib import Path

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.routes.auth import logout_user
from app.routes.auth import get_current_user, verify_password, hash_password
from app.models.user import User, UserInfo
from app.models.response_model import ResponseModel

# env_path = Path(__file__).resolve().parents[3] / ".env"
# load_dotenv(env_path)

PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/users", tags=["Users"])


# Get All Users, By Id
@router.get("/all")
def get_all_users():
    if PROJECT_ENV == "production":
        return _get_users_prod()
    if PROJECT_ENV == "development":
        return _get_users_dev()
    
def _get_users_prod():
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, phone FROM users")
    users = cursor.fetchall()
    return ResponseModel(True, "", {"users": users})


def _get_users_dev():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT email, name, phone FROM users")
    users = cursor.fetchall()
    return ResponseModel(True, "", {"users": users})
    

@router.get("/{id}")
def get_user_by_id(id: int):
    if PROJECT_ENV == "production":
        return _get_uid_prod(id)
    if PROJECT_ENV == "development":
        return _get_uid_dev(id)


def _get_uid_prod(id: int):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=%s", (id,))
    user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": user})


def _get_uid_dev(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=?", (id,))
    user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": user})


# Update Basic Info and Account Info
@router.patch("/")
def edit_basic_info(user_info: UserInfo, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return edit_binfo_prod(user_info, current_user)
    if PROJECT_ENV == "development":
        return edit_binfo_dev(user_info, current_user)
    

def edit_binfo_prod(user_info: UserInfo, current_user = Depends(get_current_user)):
    conn = get_pg_db()
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
        SET name=%s, phone=%s
        WHERE id=%s
    """,
    (user_info.name, user_info.phone, current_user["id"],)
    )
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id=%s", (current_user["id"],))
    user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": user})


def edit_binfo_dev(user_info: UserInfo, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=?", (current_user["id"],))
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
        SET name=?, phone=?
        WHERE id=?
    """,
    (user_info.name, user_info.phone, current_user["id"],)
    )
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id=?", (current_user["id"],))
    user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": user})


@router.patch("/account")
def edit_account_info(user: User, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return edit_ainfo_prod(user, current_user)
    if PROJECT_ENV == "development":
        return edit_ainfo_dev(user, current_user)
    
def edit_ainfo_prod(user: User, current_user = Depends(get_current_user)):
    conn = get_pg_db()
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


def edit_ainfo_dev(user: User, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=?", (current_user["id"],))
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
        SET email=?, password=?
        WHERE id=?
    """,
    (user.email, password, current_user["id"],)
    )
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id=?", (current_user["id"],))
    curr_user = cursor.fetchone()
    conn.close()
    return ResponseModel(True, "", {"user": curr_user})



# Delete User
@router.delete("/")
def delete_user(password: str, current_user = Depends(get_current_user)):
    if PROJECT_ENV == "production":
        return del_user_prod(password, current_user)
    if PROJECT_ENV == "development":
        return del_user_dev(password, current_user)
    

def del_user_prod(password: str, current_user = Depends(get_current_user)):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=%s", (current_user["id"],))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password, user["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logout_user()
    cursor.execute("DELETE FROM users WHERE id=%s", (current_user["id"],))
    conn.commit()
    conn.close()
    return ResponseModel(True, "User successfully deleted")


def del_user_dev(password: str, current_user = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=?", (current_user["id"],))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password, user["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logout_user()
    cursor.execute("DELETE FROM users WHERE id=?", (current_user["id"],))
    conn.commit()
    conn.close()
    return ResponseModel(True, "User successfully deleted")