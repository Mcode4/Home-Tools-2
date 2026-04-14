# Coding Conventions
**Analysis Date:** 2026-04-14

## Naming Patterns
**Files:**
- Backend: snake_case for modules (e.g., `postgres_utils.py`, `image_utils.py`) and routes (e.g., `home_groups.py`).
- Frontend: PascalCase for components (e.g., `LoginForm.jsx`, `DashboardPage.jsx`) and camelCase for utility files (e.g., `apiUtils.js`).

**Functions:**
- Backend: snake_case (e.g., `get_all_users`, `_get_users_prod`). Private helper functions are prefixed with an underscore.
- Frontend: camelCase (e.g., `handleSubmit`, `closeModal`).

**Variables:**
- Backend: snake_case (e.g., `current_user`, `user_info`).
- Frontend: camelCase (e.g., `email`, `setPassword`).

**Types:**
- Backend: PascalCase for Pydantic models (e.g., `User`, `UserInfo`, `ResponseModel`).

## Code Style
**Formatting:**
- Backend: Follows PEP 8 standards (snake_case, 4-space indentation).
- Frontend: Standard React/JavaScript style with 2-space indentation.

**Linting:**
- Frontend: Uses `eslint-config-react-app` as configured in `frontend/package.json`.
- Backend: No explicit linting configuration detected.

## Import Organization
**Order:**
1. Standard library imports (e.g., `os`, `pathlib`).
2. Third-party library imports (e.g., `fastapi`, `dotenv`).
3. Local application imports (e.g., `app.db.db`, `app.models.user`).

**Path Aliases:**
- Backend: Uses absolute imports starting from `app.` (e.g., `from app.models.user import User`).

## Error Handling
**Patterns:**
- Backend: Uses FastAPI's `HTTPException` for API errors (e.g., `raise HTTPException(status_code=404, detail="User not found")` in `backend/app/routes/users.py`).
- Frontend: Local state used for error tracking (e.g., `const [err, setErr] = useState({});` in `frontend/src/components/LoginForm/LoginForm.jsx`).

## Logging
**Framework:** Not explicitly detected. `print` or standard console logs are likely used.

## Comments
**When to Comment:**
- Used for sectioning routes in the backend (e.g., `# Get All Users, By Id` in `backend/app/routes/users.py`).

## Function Design
**Size:** Functions are generally concise, though some route handlers include multiple internal helper functions for environment-specific logic (`_prod` vs `_dev`).
**Parameters:**
- Backend: Uses Pydantic models for request bodies (e.g., `user_info: UserInfo`).
- Frontend: Standard React prop passing.

## Module Design
**Exports:**
- Backend: Uses FastAPI `APIRouter` for modular routing.
- Frontend: Uses ES6 `export default` for components and named exports for Redux store.
**Barrel Files:**
- Used in `backend/app/models/__init__.py` and `backend/app/routes/__init__.py` to expose sub-modules.
---
*Convention analysis: 2026-04-14*
