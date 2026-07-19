import os
import re
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.routes.auth import get_current_user, verify_password, hash_password
from app.models.user import User, UserCreate, UserProfileSchema, UserAccountSchema
from app.models.response_model import ResponseModel

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/users", tags=["Users"])

def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "country_code": user.country_code,
        "area_code": user.area_code,
        "bio": user.bio,
        "profile_icon": user.profile_icon
    }

@router.get("/all")
def get_all_users(current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    users = db.query(User).all()
    return ResponseModel(True, "", {"users": [serialize_user(u) for u in users]})

@router.get("/{id}")
def get_user_by_id(id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(True, "", {"user": serialize_user(user)})

@router.patch("/")
def edit_profile(profile: UserProfileSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if profile.username is not None:
        existing = db.query(User).filter(User.username == profile.username, User.id != current_user["id"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = profile.username

    if profile.first_name is not None:
        user.first_name = profile.first_name
    if profile.last_name is not None:
        user.last_name = profile.last_name
    if profile.phone is not None:
        if not re.match(r"^\+?[\d\s\-\(\)]{7,20}$", profile.phone):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        user.phone_number = profile.phone
    if profile.country_code is not None:
        if not re.match(r"^\+\d{1,4}$", profile.country_code):
            raise HTTPException(status_code=400, detail="Country code must be like +1, +44, +81")
        user.country_code = profile.country_code
    if profile.area_code is not None:
        if not re.match(r"^\d{3}$", profile.area_code):
            raise HTTPException(status_code=400, detail="Area code must be exactly 3 digits")
        user.area_code = profile.area_code
    if profile.bio is not None:
        user.bio = profile.bio
    if profile.profile_icon is not None:
        user.profile_icon = profile.profile_icon

    db.commit()
    db.refresh(user)
    return ResponseModel(True, "", {"user": serialize_user(user)})

@router.patch("/account")
def edit_account(account: UserAccountSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(User).filter(User.email == account.email, User.id != current_user["id"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    password = hash_password(account.password)
    user.email = account.email
    user.password = password

    db.commit()
    db.refresh(user)
    return ResponseModel(True, "", {"user": serialize_user(user)})

@router.delete("/")
def delete_user(password: str, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db.delete(user)
    db.commit()
    return ResponseModel(True, "User successfully deleted")
