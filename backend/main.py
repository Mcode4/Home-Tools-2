import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.db import init_db
from app.routes import router as api_router
from scripts.migrate_db_to_psql import run_migration

PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")

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

if PROJECT_ENV == "production":
    run_migration()

app.include_router(api_router)