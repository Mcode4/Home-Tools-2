#!/bin/sh

echo "Running DB Migration..."
python backend/scripts/migrate_db_to_psql.py

echo "Starting FastAPI..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

echo "Testing FastAPI..."
curl http://127.0.0.1:8000/docs

sleep 3

echo "Testing FastAPI Again..."
curl http://127.0.0.1:8000/docs

echo "Starting Nginx..."
nginx -g "daemon off;"