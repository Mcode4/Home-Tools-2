import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from pathlib import Path

# env_path = Path(__file__).resolve().parents[3] / ".env"
env_path = Path(__file__).resolve().parents[2] / ".env"

load_dotenv(env_path)

PROJECT_ENV = os.getenv("PROJECT_ENV", "development")
SCHEMA = os.getenv("SCHEMA", "public")

def get_pg_db():
    return psycopg2.connect(
        os.environ["POSTGRES_URL"],
        cursor_factory=RealDictCursor
    )