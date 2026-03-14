import os
from fastapi import APIRouter, HTTPException, Response, Cookie
from sqlite3 import IntegrityError
from psycopg2 import IntegrityError as PostgresError
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

from app.db.db import get_db
from app.utils.postgres_utils import get_pg_db
from app.models.user import User, UserInfo
from app.models.response_model import ResponseModel
from app.utils.jwt import create_access_token, decode_access_token

# env_path = Path(__file__).resolve().parents[3] / ".env"

# load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")

router = APIRouter(prefix="/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Password Helpers
def validate_password(plain_password):
    SYMBOL = "!@#$%?.-"
    ALLOWED = set(f"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789{SYMBOL}")
    if not all(c in ALLOWED for c in plain_password):
        raise HTTPException(status_code=400, detail=f'Password contains characters not allowed. Only A-Z, 0-9, and !@#$%?.-')
    if len(plain_password) < 8 or len(plain_password) > 25:
        raise HTTPException(status_code=400, detail="Password be between 5 and 25 character")
    def is_valid(p: str) -> bool:
        return (
            any(c.isupper() for c in p) and
            any(c.islower() for c in p) and
            any(c.isdigit() for c in p) and
            any(c in SYMBOL for c in p)
        )
    if not is_valid(plain_password):
        raise HTTPException(status_code=400, detail=f'Password must contain at least 1 uppercased character, 1 number and 1 special character: {SYMBOL}')
    return True


def hash_password(password: str) -> str:
    if not validate_password(password):
        return
    if not isinstance(password, str):
        raise HTTPException(status_code=400, detail="Invalid password format")
    password = password.strip()
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not isinstance(plain_password, str):
        raise HTTPException(status_code=400, detail="Invalid password format")
    return pwd_context.verify(plain_password, hashed_password)


# Register
@router.post("/register")
def register(user: User):
    password = user.password
    if not validate_password(password):
        return
    if PROJECT_ENV == "production":
        return _register_prod(user)
    if PROJECT_ENV == "development":
        return _register_dev(user)


def _register_prod(user: User):
    conn = get_pg_db()
    cursor = conn.cursor()
    try:
        hashed_password = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (email, password, name) VALUES (%s, %s, %s)",
            (user.email.strip(), hashed_password, "User",)
        )
        conn.commit()
        conn.close()
    except PostgresError as e:
        conn.rollback()
        if str(e).startswith('duplicate key value violates unique constraint'):
            raise HTTPException(status_code=500, detail=f"User already exist")
        
        raise HTTPException(status_code=500, detail=f"Server error please try again")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ResponseModel(True, "User created")


def _register_dev(user: User):
    conn = get_db()
    cursor = conn.cursor()
    try:
        hashed_password = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            (user.email.strip(), hashed_password, "User",)
        )
        conn.commit()
        conn.close()
    except IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=500, detail="User already exists")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ResponseModel(True, "User created")


# Login
@router.post("/login")
def login(user: User, response: Response):
    if PROJECT_ENV == "production":
        return _login_prod(user, response)
    if PROJECT_ENV == "development":
        return _login_dev(user, response)
    

def _login_prod(user: User, response: Response):
    conn = get_pg_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email=%s",
        (user.email.strip(),)
    )
    db_user = cursor.fetchone()
    conn.close()
    if not db_user:
        raise HTTPException(status_code=404, detail="User doesn't exist")
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"user_id": db_user["id"]})
    # response.set_cookie(
    #     key="access_token",
    #     value=access_token,
    #     httponly=True,
    #     max_age=60*60,
    #     samesite="none",
    #     secure=True,
    #     path="/"
    # )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60*60,
        samesite="lax",
        secure=False,
        path="/"
    )
    user_obj = {}
    for key in dict(db_user):
        if key != "password":
            user_obj[f"{key}"] = db_user[f"{key}"]
    return ResponseModel(True, "User logged in successfully", {"db_user": user_obj})


def _login_dev(user: User, response: Response):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (user.email.strip(),)
    )
    db_user = cursor.fetchone()
    conn.close()
    if not db_user:
        raise HTTPException(status_code=404, detail="User doesn't exist")
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"user_id": db_user["id"]})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60*60,
        samesite="lax",
        secure=False,
        path="/"
    )
    user_obj = {}
    for key in dict(db_user):
        if key != "password":
            user_obj[f"{key}"] = db_user[f"{key}"]
    return ResponseModel(True, "User logged in successfully",  {"db_user": user_obj})


# Verify User
@router.get("/session")
def get_current_user(
    response: Response, 
    access_token: str | None = Cookie(None, alias="access_token")
):
    print("HITTTT")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated session")
    payload = decode_access_token(access_token)
    if not payload:
        response.delete_cookie("access_token", path="/")
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("user_id")

    if PROJECT_ENV == "production":
        conn = get_pg_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        conn.close()
    if PROJECT_ENV == "development":
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))
        user = cursor.fetchone()
        conn.close()
    if not user:
        response.delete_cookie("access_token", path="/")
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user["id"], "email": user["email"]}

@router.delete("/session")
def logout_user(response: Response):
    if PROJECT_ENV == "production":
        response.set_cookie(
            key="access_token",
            value="",
            httponly=True,
            max_age=0,
            samesite="none",
            secure=True,
            path="/"
        )
    if PROJECT_ENV == "development":
        response.set_cookie(
            key="access_token",
            value="",
            httponly=True,
            max_age=0,
            samesite="lax",
            secure=False,
            path="/"
        )
    response.delete_cookie("access_token", path="/")
    return ResponseModel(True, "Logged out successfully")