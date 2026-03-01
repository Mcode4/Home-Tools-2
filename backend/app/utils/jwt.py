import os
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parents[3] / ".env"
# print("Looking for .env at:", env_path)
# print("Exists:", env_path.exists())

load_dotenv(env_path)

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION!..")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
)

def create_access_token(data: dict) -> str:
    encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    encode.update({"exp": expire})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token:str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None