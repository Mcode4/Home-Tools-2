#!/bin/sh
set -e

echo "Running DB Migration..."
python app/backend/scripts/migrate_db_to_psql.py

echo "Starting FastAPI..."
cd /app/backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

echo "Waiting for FastAPI to be ready..."
for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:8000/docs > /dev/null 2>&1; then
        echo "FastAPI is up!"
        break
    fi
    echo "Attempt $i: FastAPI not ready yet, waiting..."
    sleep 2
done

# Final check
curl -sf http://127.0.0.1:8000/docs > /dev/null 2>&1 || echo "WARNING: FastAPI may not be fully up"

echo "Starting Nginx..."
nginx -g "daemon off;"
