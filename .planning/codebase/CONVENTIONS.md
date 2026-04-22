# Conventions: Home-Tools-2

Coding standards and patterns observed in the codebase.

## Backend (Python)
- **FastAPI Routes**: Endpoints are modularized into `app/routes/`.
- **Validation**: Strict use of **Pydantic** models for all request bodies and response projections.
- **Environment Branching**: Frequent use of `if PROJECT_ENV == "production"` to switch between database implementations.
- **Dependency Injection**: Use of `Depends(get_current_user)` for securing routes.

## Frontend (React)
- **Component Structure**: Components are stored in their own subdirectories within `components/`, containing their JSX and CSS.
- **Style**: Preference for Vanilla CSS (CSS files per component).
- **State Management**: **Redux Toolkit** is used for global state (e.g., sessions, points data).
- **API Responses**: Standardized via `ResponseModel` on the backend and handled via specific Redux slices on the frontend.

## Common
- **JSON Standard**: All API communications use snake_case for fields.
- **Git**: Basic repository structure with Docker files at service roots.
