from fastapi import FastAPI
from fast.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.db.db import init_db
from app.routes import router as api_router

load_dotenv()

app = FastAPI(title="API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://localhost:10000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

init_db()

app.include_router(api_router)