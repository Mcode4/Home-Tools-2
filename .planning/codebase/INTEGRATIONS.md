# Integrations: Home-Tools-2

Documentation of internal and external service integrations.

## Internal Integrations
- **Postgres DB**: Connected via `psycopg2` using connection strings from environment variables (`POSTGRES_URL`). Used for persistent storage in production-like environments.
- **SQLite DB**: Local file-based storage (`home_tools.db`) used for development.
- **Adminer**: A database management tool integrated via Docker Compose to manage the Postgres instance.

## External Services
- **MapLibre GL**: Used for map rendering. Interacts with map tile providers (presumably MapLibre defaults or OpenStreetMap).
- **TURF.js**: Used for geospatial analysis on the frontend.

## API Integration (Frontend -> Backend)
- **Proxying**: The React frontend uses a proxy configuration in `package.json` (`"proxy": "http://localhost:8000"`) to communicate with the FastAPI backend during development.
- **RESTful Endpoints**: Standard HTTP communication (GET, POST, PATCH, DELETE) with JSON payloads.
