from app.db.session import engine
from app.db.base import Base

def init_db():
    # Use SQLAlchemy to create tables based on models
    Base.metadata.create_all(bind=engine)
    print("Database models initialized via SQLAlchemy ORM.")