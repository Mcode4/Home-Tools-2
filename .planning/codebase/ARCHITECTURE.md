# Architecture **Analysis Date:** 2026-04-14

## Pattern Overview
**Overall:** Client-Server Architecture (Decoupled Frontend and Backend)
**Key Characteristics:**
- **Backend:** FastAPI based REST API with environment-based database switching (SQLite for development, PostgreSQL for production).
- **Frontend:** React application with Redux Toolkit for centralized state management.
- **Persistence:** Relational database mapping for users, properties, floors, images, and points.
- **Authentication:** JWT-based session management using HTTP-only cookies.

## Layers
**API Layer (Backend):**
- Purpose: Handle HTTP requests, route to logic, and return JSON responses.
- Location: `backend/app/routes/`
- Contains: Route handlers for auth, users, properties, floors, images, etc.
- Depends on: Models and DB utilities.
- Used by: Frontend application.

**Data Access Layer (Backend):**
- Purpose: Manage database connections and raw SQL execution.
- Location: `backend/app/db/` and `backend/app/utils/`
- Contains: `db.py` (SQLite init), `postgres_utils.py` (PostgreSQL connection).
- Depends on: Database drivers (`sqlite3`, `psycopg2`).
- Used by: API Layer.

**Model Layer (Backend):**
- Purpose: Define data structures and response formats.
- Location: `backend/app/models/`
- Contains: Pydantic models for request/response validation (e.g., `user.py`, `property.py`, `response_model.py`).
- Depends on: Python type hints.
- Used by: API Layer.

**State Management Layer (Frontend):**
- Purpose: Synchronize application state across components.
- Location: `frontend/src/redux/`
- Contains: Reducers for session, users, properties, floors, images, and points.
- Depends on: `@reduxjs/toolkit`.
- Used by: React components.

## Data Flow
**Authentication Flow:**
1. Frontend sends credentials to `/auth/login`.
2. Backend verifies password via `passlib` and creates a JWT.
3. Backend sets an HTTP-only cookie `access_token`.
4. Frontend requests `/auth/session` to verify the current user via the cookie.

**Property Data Flow:**
1. Frontend requests property data from `/property` routes.
2. Backend fetches data from the active database (SQLite/Postgres).
3. Data is returned as JSON, which the frontend stores in the Redux `properties` slice.

## Key Abstractions
**ResponseModel:**
- Purpose: Standardize all API responses.
- Examples: `backend/app/models/response_model.py`
- Pattern: Wrapper containing success boolean, message, and optional data payload.

**DB Provider:**
- Purpose: Abstract the difference between development (SQLite) and production (PostgreSQL).
- Examples: `backend/app/db/db.py`, `backend/app/utils/postgres_utils.py`
- Pattern: Conditional logic in routes based on `PROJECT_ENV`.

## Entry Points
**Backend Server:**
- Location: `backend/main.py`
- Triggers: Application startup.
- Responsibilities: Initialize FastAPI, configure CORS, initialize DB, and include API routers.

**Frontend Application:**
- Location: `frontend/src/index.js`
- Triggers: Browser page load.
- Responsibilities: Bootstrap React and provide the Redux store to the component tree.

## Error Handling
**Strategy:** HTTP Exception raising in Backend, Response checking in Frontend.
**Patterns:**
- Backend: Use of `fastapi.HTTPException` to return specific status codes (401, 404, 500).
- Frontend: `checkAndReturnRes` utility in `frontend/src/redux/apiUtils.js` to parse and log response status.

## Cross-Cutting Concerns
**Logging:** Basic print statements used in backend for environment and request tracking.
**Validation:** Pydantic models for request body validation; custom password validation in `backend/app/routes/auth.py`.
**Authentication:** JWT tokens stored in cookies for security against XSS.
---
*Architecture analysis: 2026-04-14*
