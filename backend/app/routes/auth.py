import os
from fastapi import APIRouter, HTTPException, Response, Cookie, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.user import User, UserCreate
from app.models.response_model import ResponseModel
from app.utils.jwt import create_access_token, decode_access_token

load_dotenv()

PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

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
def register(user_schema: UserCreate, db: Session = Depends(get_db_session)):
    password = user_schema.password
    if not validate_password(password):
        return
    
    hashed_password = hash_password(user_schema.password)
    new_user = User(
        email=user_schema.email.strip(), 
        password=hashed_password, 
        name=user_schema.name,
        phone_number=user_schema.phone
    )
    
    try:
        db.add(new_user)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if 'unique constraint' in str(e).lower():
            raise HTTPException(status_code=500, detail="User already exists")
        raise HTTPException(status_code=500, detail="Server error please try again")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ResponseModel(True, "User created")


# Login
@router.post("/login")
def login(user_schema: UserCreate, response: Response, db: Session = Depends(get_db_session)):
    db_user = db.query(User).filter(User.email == user_schema.email.strip()).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User doesn't exist")
    if not verify_password(user_schema.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"user_id": db_user.id})
    
    # Cookie security settings
    cookie_kwargs = {
        "key": "access_token",
        "value": access_token,
        "httponly": True,
        "max_age": 60*60,
        "path": "/",
    }
    
    if PROJECT_ENV == "production":
        cookie_kwargs.update({"samesite": "none", "secure": True})
    else:
        cookie_kwargs.update({"samesite": "lax", "secure": False})
        
    response.set_cookie(**cookie_kwargs)
    
    user_obj = {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "phone_number": db_user.phone_number,
        "bio": db_user.bio,
        "profile_icon": db_user.profile_icon
    }
    return ResponseModel(True, "User logged in successfully", {"db_user": user_obj, "token": access_token})


# Verify User
def get_current_user(
    response: Response | None = None, 
    access_token: str | None = Cookie(None, alias="access_token"),
    authorization: str | None = Depends(lambda x=None: x), # Placeholder for Header support
    db: Session = Depends(get_db_session)
):
    from fastapi import Header
    def get_token(auth_header: str | None, cookie_token: str | None):
        if cookie_token:
            return cookie_token
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        return None

    # We need a way to get the Header in a dependency that might be called with or without it
    # FastAPI handles this better with security schemes, but let's keep it simple for now.
    pass

# Actually, let's use a cleaner approach for get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer(auto_error=False)

@router.get("/session")
def get_session_user(
    access_token: str | None = Cookie(None, alias="access_token"),
    auth: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db_session)
):
    token = access_token
    if not token and auth:
        token = auth.credentials
        
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated session")
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user.id, "email": user.email, "name": user.name}

# Export get_current_user for other routes
get_current_user = get_session_user


@router.delete("/session")
def logout_user(response: Response):
    cookie_kwargs = {
        "key": "access_token",
        "value": "",
        "httponly": True,
        "max_age": 0,
        "path": "/",
    }
    
    if PROJECT_ENV == "production":
        cookie_kwargs.update({"samesite": "none", "secure": True})
    else:
        cookie_kwargs.update({"samesite": "lax", "secure": False})
        
    response.set_cookie(**cookie_kwargs)
    response.delete_cookie("access_token", path="/")
    return ResponseModel(True, "Logged out successfully")