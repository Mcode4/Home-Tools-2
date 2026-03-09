#!/bin/sh

echo "Running DB Migration..."
python backend/scripts/migrate_db_to_psql.py

echo "Starting FastAPI..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

exho "Starting Nginx..."
nginx -g "daemon off;"