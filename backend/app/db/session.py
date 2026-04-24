import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

POSTGRES_URL = os.environ.get("POSTGRES_URL")

if not POSTGRES_URL:
    raise RuntimeError("POSTGRES_URL environment variable is not set")

# SQLAlchemy 2.0 engine
engine = create_engine(POSTGRES_URL, pool_pre_ping=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db_session():
    """ FastAPI Dependency to get a DB session """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
