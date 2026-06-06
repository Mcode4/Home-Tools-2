# External Integrations

**Analysis Date:** 2026-05-28

## APIs & External Services

**Map & Geospatial:**
- **OpenStreetMap Nominatim API** — Address search and reverse geocoding
  - Endpoint: `https://nominatim.openstreetmap.org/search?q=...&format=json` (`frontend/src/functions/search/search.js:11`)
  - Endpoint: `https://nominatim.openstreetmap.org/reverse?lat=...&lon=...&format=json` (`frontend/src/functions/search/search.js:58`)
  - Usage: `handleSearchAddress(addr)` for forward geocoding; `reverseLookupAddress(lng, lat)` for reverse geocoding when creating properties
  - No API key required (public OSM instance)
  - Called directly from frontend (no backend proxy)

- **MapLibre GL JS 5.19.0** — Map tile rendering (client-side)
  - Tile source: OpenStreetMap default tiles (no explicit tile server URL override seen — uses MapLibre GL defaults)
  - Renders markers, radius circles (polygons), lines as GeoJSON sources on the map
  - Map component: `frontend/src/components/EditorPage/Map/MapComponent.jsx`

**No other external API integrations detected.** The backend does not call any third-party APIs. All business logic is self-contained.

## Data Storage

**Databases:**
- **PostgreSQL 15** — Primary database
  - Connection: `POSTGRES_URL` environment variable (`backend/app/db/session.py:8`)
  - Client: `psycopg2-binary` (PostgreSQL adapter)
  - ORM: SQLAlchemy 2.0 (`backend/app/db/session.py:14`)
  - Port: 5432
  - Credentials: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` configured via environment
  - Dev DB URL: `postgresql://appuser:strongpassword@localhost:5432/appdb` (via `start_local.sh`)

**File Storage:**
- **Local filesystem only**
  - Images uploaded to `backend/app/uploads/{owner_id}/{type}/` (`backend/app/utils/image_utils.py:7`)
  - No cloud storage (S3, GCS, etc.) integration detected
  - Images served via FastAPI `FileResponse` at `GET /api/images/{id}` (`backend/app/routes/images.py:27`)

**Caching:**
- **None detected** — No Redis, Memcached, or in-memory caching layer
- Browser `localStorage` used for offline/unsaved work staging (`canvasObjects`, `deletedProperties`, `deletedPoints` with 6-hour TTL)

**Local Persistence (Frontend):**
- `localStorage` — Used to persist unsaved editor changes with 6-hour expiry (`frontend/src/components/EditorPage/EditorPage.jsx:309-313`)
- Keys: `canvasObjects`, `deletedProperties`, `deletedPoints`

## Authentication & Identity

**Auth Provider:**
- **Custom JWT-based authentication** — No third-party auth provider (no OAuth, no SSO)
  - Implementation: `backend/app/routes/auth.py`
  - Token creation: `python-jose` JWT encode/decode (`backend/app/utils/jwt.py`)
  - Password hashing: `passlib` with `bcrypt` scheme
  - Token stored in `httpOnly` cookie named `access_token`
  - Also supports `Bearer` token via `Authorization` header
  - Cookie settings depend on environment:
    - Production: `samesite="none"`, `secure=True`
    - Development: `samesite="lax"`, `secure=False`

**Registration/Login flow:**
- `POST /api/auth/register` — Email, password, name, phone
- `POST /api/auth/login` — Returns JWT cookie + user object
- `GET /api/auth/session` — Validate token and return user
- `DELETE /api/auth/session` — Logout (clear cookie)
- Password policy: 8-25 chars, must contain uppercase, lowercase, digit, and special char

**API Security:**
- Protected routes use `get_current_user` dependency (`backend/app/routes/auth.py:171` — alias to `get_session_user`)
- Verifies JWT from cookie or `Authorization: Bearer <token>` header
- User-scoped queries: most endpoints filter by `current_user["id"]`

## Monitoring & Observability

**Error Tracking:**
- **None detected** — No Sentry, Datadog, or similar integration

**Logs:**
- **Console logging** — Both frontend and backend use `print()` / `console.log()` for debugging
- No structured logging framework
- Uvicorn server logs to stdout (containers)

## CI/CD & Deployment

**Hosting:**
- **Docker Compose** — Full stack deployment via `docker-compose.yml`
  - 4 services: `db` (postgres:15), `backend`, `frontend`, `adminer`
  - All services connect via a shared `app-network` bridge network
  - Frontend sits behind nginx, proxying `/api/` to backend

**CI Pipeline:**
- **None detected** — No GitHub Actions, CircleCI, or equivalent configuration

**Database Admin:**
- **Adminer** — Included as a Docker service for development database management (`docker-compose.yml:48-54`)
  - Port: 8081 (configurable via `ADMINER` env var, default 8881)
  - Not exposed in production

## Environment Configuration

**Required env vars:**
| Variable | Required | Notes |
|----------|----------|-------|
| `POSTGRES_URL` | Yes | Full PostgreSQL connection string |
| `SECRET_KEY` | Yes (prod) | JWT signing key; has `CHANGE_ME_IN_PRODUCTION!..` default |
| `PROJECT_ENV` | No | `development` or `production` |
| `FRONTEND` | No | Frontend port (default 3000) |
| `BACKEND` | No | Backend external port (default 8888) |
| `BACKEND_INTERNAL_PORT` | No | Backend container port (default 8000) |

**Secrets location:**
- `.env` file at project root (git-ignored, listed in `.gitignore`)
- Default/fallback values hardcoded in `backend/app/utils/jwt.py` for `SECRET_KEY` and `ALGORITHM`
- Docker Compose hardcodes `POSTGRES_PASSWORD`, `SECRET_KEY` values (development only)
- `.env.example` committed to repo shows available vars without values

## Webhooks & Callbacks

**Incoming:**
- **None detected**

**Outgoing:**
- **None detected** — No webhook integrations, no event callbacks to external services

## Database Schema

**Tables (auto-created via SQLAlchemy `Base.metadata.create_all`):**
| Table | Model File | Key Fields |
|-------|-----------|------------|
| `users` | `backend/app/models/user.py` | id, email, password, name, phone_number, bio, profile_icon |
| `teams` | `backend/app/models/team.py` | id, name, rules |
| `user_teams` | `backend/app/models/user_team.py` | user_id, team_id, roles |
| `property` | `backend/app/models/property.py` | id, owner_id, name, lat/lng, hierarchy (JSONB), etc. |
| `points` | `backend/app/models/point.py` | id, owner_id, type, name, lng/lat, radius, endlng/endlat |
| `floors` | `backend/app/models/floor.py` | id, owner_id, property_id, name, bedrooms, bathrooms |
| `home_groups` | `backend/app/models/home_group.py` | id, name, type, pinned |
| `images` | `backend/app/models/image.py` | id, owner_id, property_id, filename, filepath, content_type |
| `notifications` | `backend/app/models/notification.py` | id, sender_id, recipient_id, title, message, read |
| `saved_types` | `backend/app/models/saved_types.py` | id, name, type, extra_info (JSON), owner_id |
| `settings` | `backend/app/models/settings.py` | user_id, theme, map_layer, icon_size, text_size, text_color |

**Migrations:**
- No Alembic or formal migration tool detected
- Schema is applied via `Base.metadata.create_all(bind=engine)` on startup (`backend/app/db/db.py`)
- Manual SQL migration scripts in `backend/scripts/` (e.g., `apply_hierarchy_schema.py` adds `hierarchy` JSONB column)

---

*Integration audit: 2026-05-28*
