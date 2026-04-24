import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.routes.auth import get_current_user, verify_password, hash_password
from app.models.user import User, UserCreate, UserInfoSchema
from app.models.response_model import ResponseModel

load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

router = APIRouter(prefix="/users", tags=["Users"])


# Get All Users, By Id
@router.get("/all")
def get_all_users(db: Session = Depends(get_db_session)):
    users = db.query(User).all()
    user_list = [
        {"email": u.email, "name": u.name, "phone_number": u.phone_number}
        for u in users
    ]
    return ResponseModel(True, "", {"users": user_list})


@router.get("/{id}")
def get_user_by_id(id: int, db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {"email": user.email, "name": user.name, "phone_number": user.phone_number}
    return ResponseModel(True, "", {"user": user_data})


# Update Basic Info and Account Info
@router.patch("/")
def edit_basic_info(user_info: UserInfoSchema, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(user_info.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user.name = user_info.name
    user.phone_number = user_info.phone
    
    db.commit()
    db.refresh(user)
    
    user_data = {"email": user.email, "name": user.name, "phone_number": user.phone_number}
    return ResponseModel(True, "", {"user": user_data})


@router.patch("/account")
def edit_account_info(user_schema: UserCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db_session)):
    curr_user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not curr_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(user_schema.password, curr_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    password = hash_password(user_schema.password)
    curr_user.email = user_schema.email
    curr_user.password = password
    
    db.commit()
    db.refresh(curr_user)
    
    user_obj = {
        "id": curr_user.id,
        "email": curr_user.email,
        "name": curr_user.name,
        "phone_number": curr_user.phone_number,
        "bio": curr_user.bio,
        "profile_icon": curr_user.profile_icon
    }
    return ResponseModel(True, "", {"user": user_obj})


# Delete User
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