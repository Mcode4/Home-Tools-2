# Structure: Home-Tools-2

Directory structure and organization.

## Backend Layout (`backend/`)
- `app/`: Main application logic.
  - `db/`: Database initialization (`db.py`).
  - `models/`: Pydantic schemas for data validation.
  - `routes/`: API endpoint definitions (auth, floors, images, etc.).
  - `utils/`: Common utilities (JWT, Postgres helpers, image processing).
- `scripts/`: Internal utility scripts.
- `main.py`: Entry point for the FastAPI application.

## Frontend Layout (`frontend/`)
- `public/`: Static assets.
- `src/`: React source code.
  - `components/`: Modular React components grouped by feature (Dashboard, Editor, Navbar, etc.).
  - `context/`: React Context providers for UI state (e.g., Modals).
  - `redux/`: Redux slices and store configuration.
  - `router/`: Route definitions and layout components.
  - `functions/`: Vanilla JavaScript helper functions.
  - `setupTests.js`: Test configuration.

## Project Root
- `docker-compose.yml`: Service orchestration.
- `ports.env`: Environment configuration for port mapping.
- `.planning/`: Documentation and project planning artifacts.
