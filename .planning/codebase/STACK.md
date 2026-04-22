# Stack: Home-Tools-2

This document details the core technologies used in the project.

## Frontend
- **Framework**: React 19.x
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Routing**: `react-router-dom` (v7)
- **Mapping**: MapLibre GL (`maplibre-gl`)
- **Canvas/Drawing**: Konva (`konva`, `react-konva`)
- **Build Tool**: `react-scripts` (CRA-based setup)

## Backend
- **Framework**: FastAPI (Python)
- **Asynchronous Server**: Uvicorn
- **Validation**: Pydantic v2
- **Database Driver**: `psycopg2-binary` (Postgres), `sqlite3` (built-in)
- **Authentication**: `python-jose` (HS256), `passlib` (bcrypt)

## Database
- **Primary (Production)**: PostgreSQL 15 (via Docker)
- **Secondary (Development)**: SQLite3 (`home_tools.db`)

## Orchestration
- **Containerization**: Docker & Docker Compose
- **Services**:
  - `db`: Postgres
  - `backend`: FastAPI
  - `frontend`: React (served via Nginx in production, presumed)
  - `adminer`: Database management GUI
