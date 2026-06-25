#!/bin/bash
set -a

# start_local.sh
# Script to start both frontend and backend locally (no Docker)
# This allows for Hot Module Replacement (HMR) and active development.

# 1. Load environment variables
if [ -f .env ]; then
    source .env
fi

# 2. Config Defaults
BACKEND_PORT=${BACKEND:-8888}
DB_URL="postgresql://appuser:strongpassword@localhost:5432/appdb"

# 3. Clean up any stale background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $(jobs -p) 2>/dev/null
    wait $(jobs -p) 2>/dev/null
}
trap cleanup EXIT INT TERM

# 4. Check for Database
if command -v nc &> /dev/null && nc -z localhost 5432 2>/dev/null; then
    echo "✅ Postgres database detected on localhost:5432"
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'db\|postgres'; then
    echo "✅ Postgres database detected in Docker"
else
    echo "⚠️  Postgres database not detected on localhost:5432."
    echo "   Start it with: docker-compose up -d db"
fi

# 5. Start Backend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🚀 Starting Backend on port $BACKEND_PORT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
(
    cd backend
    source venv/bin/activate
    
    # Refresh dependencies if requirements changed
    pip install -r requirements.txt -q 2>/dev/null
    
    export POSTGRES_URL=$DB_URL
    export PROJECT_ENV=development
    
    uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload
) &

# 6. Start Frontend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ⚛️  Starting Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
(
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing npm dependencies..."
        npm install
    fi
    
    npx vite --port ${FRONTEND:-3000}
) &

# Wait for both background processes
wait
