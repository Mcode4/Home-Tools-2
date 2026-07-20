import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from app.db.session import Base, engine
import pkgutil
import importlib
import app.models

# Dynamically import all models so SQLAlchemy metadata knows about them
for loader, module_name, is_pkg in pkgutil.walk_packages(app.models.__path__):
    importlib.import_module(f"app.models.{module_name}")

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)

print("Database reset complete.")
