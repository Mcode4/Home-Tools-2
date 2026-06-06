<!-- refreshed: 2026-05-28 -->
# Architecture

**Analysis Date:** 2026-05-28

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐   │
│  │ Router   │  │ Pages    │  │ Redux     │  │ Map (MapLibre GL)  │   │
│  │ react-   │  │ Editor   │  │ Store     │  │ Draw tools,        │   │
│  │ router-dom│  │ Dashboard│  │ Thunks    │  │ Markers, Layers    │   │
│  └──────────┘  │ Render   │  └─────┬─────┘  └───────────────────┘   │
│                └──────────┘        │                                  │
│  ┌──────────────────────────────────┴──────────────────────────────┐ │
│  │              fetch() / API Calls (via setupProxy)               │ │
│  └──────────────────────────────────┬──────────────────────────────┘ │
└─────────────────────────────────────┼────────────────────────────────┘
                                      │ HTTP /api/*
                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI / Python)                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐   │
│  │ Routes   │  │ Auth     │  │ Models    │  │ Middleware (CORS)  │   │
│  │ APIRouter│  │ JWT+HTTP │  │ SQLAlchemy│  │ + Error Handling   │   │
│  │ per-     │  │ Cookies  │  │ ORM +     │  │                    │   │
│  │ resource │  └──────────┘  │ Pydantic  │  └───────────────────┘   │
│  └────┬─────┘                └─────┬─────┘                           │
│       │                            │                                  │
│       └──────────┬─────────────────┘                                  │
│                  ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              SQLAlchemy Core / Session Management                 │ │
│  │              `app/db/session.py` `app/db/base.py`                │ │
│  └────────────────────────────────┬─────────────────────────────────┘ │
└────────────────────────────────────┼──────────────────────────────────┘
                                     │ SQLAlchemy Connection
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL / Docker)                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐   │
│  │ users    │  │ property │  │ points    │  │ teams, images,     │   │
│  │ (auth)   │  │ (JSONB   │  │ (map      │  │ notifications,     │   │
│  │          │  │ hierarchy│  │ markers)  │  │ settings, ...      │   │
│  └──────────┘  └──────────┘  └───────────┘  └───────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| FastAPI App | HTTP entry, CORS setup, router mount | `backend/main.py` |
| Auth Router | Register/login, JWT creation, session cookie, `get_current_user` dependency | `backend/app/routes/auth.py` |
| Property Router | CRUD for properties with JSONB hierarchy data | `backend/app/routes/property.py` |
| Points Router | CRUD for map markers (icons, radii, lines, geometry) | `backend/app/routes/points.py` |
| Floors Router | CRUD for floor records (legacy, migrated into hierarchy) | `backend/app/routes/floors.py` |
| Images Router | Upload/replace/delete property images to filesystem | `backend/app/routes/images.py` |
| Users Router | Profile edit, account edit, user deletion | `backend/app/routes/users.py` |
| Teams Router | Team creation, membership lookup (partial impl) | `backend/app/routes/teams.py` |
| Home Groups Router | CRUD for grouping properties | `backend/app/routes/home_groups.py` |
| Settings Router | Per-user editor settings (theme, map layer, icon/text prefs) | `backend/app/routes/settings.py` |
| Notifications Router | CRUD for intra-app notifications | `backend/app/routes/notifications.py` |
| Saved Types Router | CRUD for user-custom marker types | `backend/app/routes/saved_types.py` |
| SQLAlchemy Session | Engine init, session factory, `get_db_session` dependency | `backend/app/db/session.py` |
| Base Imports | Imports all models so `Base.metadata` is populated for `create_all()` | `backend/app/db/base.py` |
| JWT Utils | `create_access_token` / `decode_access_token` with HS256 | `backend/app/utils/jwt.py` |
| Image Utils | File upload/delete helpers for `app/uploads/` | `backend/app/utils/image_utils.py` |
| ResponseModel | Unified `{success, message, data}` response helper | `backend/app/models/response_model.py` |
| Frontend App Root | ReactDOM render, Redux Provider, RouterProvider | `frontend/src/index.js` |
| Router Config | `createBrowserRouter` with 7 routes + Layout wrapper | `frontend/src/router/index.jsx` |
| Layout | Auth session init, settings fetch, Navbar/Footer/Modal shell | `frontend/src/router/Layout.jsx` |
| Redux Store | `configureStore` with 8 slice reducers | `frontend/src/redux/store.js` |
| EditorPage | Main map editor — staging area, Save All, canvas objects | `frontend/src/components/EditorPage/EditorPage.jsx` |
| MapComponent | MapLibre GL map, markers, draw tools (radius/line/point) | `frontend/src/components/EditorPage/Map/MapComponent.jsx` |
| PropertyDetailsSidebar | Property hierarchy tree (floors/rooms/notes), inspection tools | `frontend/src/components/EditorPage/PropertyDetailsSidebar/PropertyDetailsSidebar.jsx` |
| API Proxy | Dev proxy for `/api` → backend port | `frontend/src/setupProxy.js` |

## Pattern Overview

**Overall:** Traditional server-rendered REST API with a client-side React SPA. The backend follows a layered package architecture (routes → services-as-inline-logic → ORM models). The frontend follows a standard React + Redux + React Router pattern with a centralized store driving UI.

**Key Characteristics:**
- **API-driven monorepo**: Backend (Python/FastAPI) and frontend (React) in separate `/backend` and `/frontend` directories, composed via `docker-compose.yml` for production and `start_local.sh` for development
- **Redux as client state**: All server data flows through Redux thunks; components read from `useSelector` and dispatch thunks for mutations
- **Staging-based editor pattern**: The EditorPage uses a local `canvasObjects` staging area with undo/redo history and TTL-cached localStorage before committing via "Save All" — a diff-and-commit pattern rather than live-save
- **ORM-first backend**: SQLAlchemy declarative models with Pydantic schemas for request/response validation; `Base.metadata.create_all()` for schema bootstrap (no Alembic migrations in active use)
- **Hierarchical property data**: Properties store nested floor/room/note data as JSONB via a custom `PydanticType` SQLAlchemy decorator that auto-serializes/deserializes Pydantic models to/from JSONB

## Layers

**Frontend Layer (React SPA):**
- Purpose: UI rendering, user interaction, map visualization, local editing
- Location: `frontend/src/`
- Contains: Components, Redux slices, context providers, utility modules, custom hooks
- Depends on: Backend API (`/api/*`), Nominatim OpenStreetMap (geocoding via `frontend/src/functions/search/search.js`)
- Used by: End users via browser (served as static build or CRA dev server)

**API Layer (FastAPI Routes):**
- Purpose: HTTP request handling, auth enforcement, validation, orchestration
- Location: `backend/app/routes/`
- Contains: 9 resource-specific routers mounted under `/api`, auth dependency injection
- Depends on: Models layer, DB session, JWT utils, image utils
- Used by: Frontend fetch calls, potential external API consumers

**Models Layer (SQLAlchemy ORM + Pydantic):**
- Purpose: Database schema definition, data validation, serialization
- Location: `backend/app/models/`
- Contains: 13 ORM models + corresponding Pydantic schemas, custom `PydanticType`
- Depends on: DB session for `Base`, no internal dependencies
- Used by: Routes layer for query/insert/update operations

**Database Layer (PostgreSQL):**
- Purpose: Persistent data storage
- Location: Docker container (local) or managed PostgreSQL (production), data in `postgres_data/`
- Contains: 12+ tables (users, property, points, floors, images, teams, user_teams, home_groups, notifications, saved_types, settings)

**Utility Layer (Backend helpers):**
- Purpose: Cross-cutting concerns
- Location: `backend/app/utils/`
- Contains: JWT token helpers, image file upload/delete, `.env` test helpers

## Data Flow

### Primary Request Path (CRUD operation)

1. User interacts with React UI → component dispatches Redux thunk
2. Thunk calls `fetch()` to backend API endpoint (`/api/property/all`, etc.)
3. FastAPI receives request → CORS middleware → router handler
4. `get_current_user` dependency extracts JWT from httpOnly cookie or `Authorization: Bearer` header, queries DB for user
5. Handler function validates request body via Pydantic schema
6. Handler executes SQLAlchemy ORM operations (query/create/update/delete)
7. Response formatted via `ResponseModel(success, message, data)` helper
8. Frontend thunk receives JSON response → dispatches action to Redux reducer
9. Redux store updates → React re-renders subscribed components

### Editor Save All Flow (bulk commit)

1. User clicks "Save All" in `EditorPage.jsx`
2. `handleSaveAll()` iterates `canvasObjects` (staging area), sorting into creates vs updates for properties vs points
3. Also processes `deletedProperties` and `deletedPoints` arrays
4. Runs all deletions, creates, and updates in parallel via `Promise.all`
5. Clears localStorage staging cache (`canvasObjects`, `deletedProperties`, `deletedPoints`)
6. Dispatches `thunkGetAllProperties()` and `thunkGetPoints()` to refresh Redux state

### Editor Loading Flow (hydration)

1. `Layout.jsx` mounts → dispatches `thunkSessions()` to restore auth session
2. After session resolved, `EditorPage` mounts → dispatches `thunkGetAllProperties()`, `thunkGetPoints()`, `thunkGetSettings()`, `thunkGetSavedTypes()`
3. Redux slices populate → `useEffect` in EditorPage merges Redux data into local `canvasObjects` staging area
4. LocalStorage staging cache (with TTL expiration) is loaded and overlaid on Redux data — local unsaved changes always win
5. `memoMarkers` computed from merged data → passed to `MapComponent`

## Key Abstractions

**Property Hierarchy (JSONB)**
- Purpose: Nested property data structure (floors → rooms → notes, with dimensions)
- File: `backend/app/models/property.py` — `HierarchySchema`, `FloorNodeSchema`, `RoomSchema`, `NoteSchema`, `DimensionSchema`
- Pattern: Pydantic models serialized to JSONB column via custom `PydanticType` SQLAlchemy `TypeDecorator`
- Auto-serializes on bind (Python → DB) and deserializes on result (DB → Python)

**JWT Authentication:**
- Purpose: Stateless auth for API requests
- Files: `backend/app/utils/jwt.py`, `backend/app/routes/auth.py`
- Token stored in httpOnly cookie (`access_token`) with env-conditional SameSite/Secure flags
- `get_current_user` / `get_session_user` dependency extracts token from cookie or `Authorization: Bearer` header, decodes, fetches user from DB
- Token expiry configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` env var (default 60 min)

**CanvasObject Staging (Editor):**
- Purpose: Local editing buffer before committing to server; enables undo/redo, offline-style editing
- Pattern: Redux is source of truth for saved data; `canvasObjects` state in EditorPage is a superset/diff overlay
- Keys are prefixed (`prop-{id}`, `point-{id}`, `temp-{random}`) to track origin and target API endpoint
- Deletion tracked in separate `deletedProperties` / `deletedPoints` arrays
- All staged data persisted to localStorage with 6-hour TTL

**ResponseModel:**
- Purpose: Unified API response envelope
- File: `backend/app/models/response_model.py`
- Always returns `{"success": bool, "message": str, "data": {...}?}` from every endpoint

## Entry Points

**Production Entry:**
- Backend: `backend/main.py` — FastAPI app instance created, CORS middleware added, DB initialized, router mounted. Launched via `uvicorn main:app`
- Frontend: Built static files served by nginx via `frontend/build/` (from `frontend/Dockerfile`)
- Orchestration: `docker-compose.yml` — 4 services (db, backend, frontend, adminer)

**Development Entry:**
- Backend: `uvicorn main:app --reload` via `start_local.sh`
- Frontend: `react-scripts start` (CRA dev server) via `start_local.sh`
- Proxy: `frontend/src/setupProxy.js` forwards `/api` requests to backend port

**App-level entry:**
- Backend: `backend/main.py` (37 lines) — `FastAPI()`, `CORSMiddleware`, `init_db()`, `app.include_router(api_router)`
- Frontend: `frontend/src/index.js` (24 lines) — `ReactDOM.createRoot`, wraps `<Provider store={reduxStore}><RouterProvider router={router} /></Provider>`

## Architectural Constraints

- **Threading:** Single-threaded async event loop via uvicorn (ASGI). FastAPI routes in this codebase use synchronous handlers with SQLAlchemy, relying on uvicorn's thread pool for sync endpoints.
- **Global state:** Module-level `engine` and `SessionLocal` in `backend/app/db/session.py` — created once at import time. `Base` is a shared declarative base across all models.
- **Circular imports:** Managed via `app/db/base.py` — imports all models to ensure `Base.metadata` is populated before `create_all()` is called. This is a common SQLAlchemy pattern and not a true circular dependency.
- **No Alembic:** Schema changes are applied via `Base.metadata.create_all()` (full table create) or ad-hoc SQL scripts in `backend/scripts/`. No migration versioning in use.

## Anti-Patterns

### Stub Redux Reducers

**What happens:** Several Redux slices (`floors.js`, `images.js`, `users.js`) define action types and action creators but return `undefined` from their reducer switch cases.
**Why it's wrong:** These reducers will set state to `undefined` when their actions fire, effectively breaking that slice of state.
**Do this instead:** Either implement the reducer logic (like `properties.js` or `points.js` do) or remove the slice from the store config. See `frontend/src/redux/store.js` lines 24-28 (floors, images, users are registered but their reducers are stubs).

### Inline Business Logic in Routes

**What happens:** All business logic (validation, data transformation, error handling) is written directly inside route handler functions rather than in a separate service layer.
**Why it's wrong:** Leads to code duplication across similar endpoints (e.g., the try/except/rollback pattern is repeated in every route handler) and makes unit testing harder.
**Do this instead:** Extract shared logic into service functions or middleware/handler wrappers. For example, the error-handling pattern repeats verbatim in ~20 route handlers.

### Fragmented Auth Dependency

**What happens:** `backend/app/routes/auth.py` defines `get_current_user` by re-assigning `get_current_user = get_session_user` at line 171 after an earlier incomplete implementation was left in place (lines 124-140).
**Why it's wrong:** Dead code in lines 124-140 is never called but remains in the file, creating confusion. The `get_session_user` function (line 147) handles both Cookie and Bearer token extraction correctly, but the early placeholder implementation should be removed.

## Error Handling

**Strategy:** FastAPI HTTPException-based error responses, caught in route handlers with try/except blocks.

**Patterns:**
- `HTTPException` raised with appropriate status codes (400, 401, 403, 404, 500)
- `IntegrityError` (SQL constraint violations) caught and rolled back with 500 response
- Generic `Exception` caught with 400 response and rollback
- `ResponseModel` wrapper ensures consistent response shape even on success

## Cross-Cutting Concerns

**Logging:** No structured logging framework. Uses `print()` for startup messages and `console.log()` on frontend for debugging. No log levels, no log aggregation.

**Validation:** Dual validation — Pydantic schemas validate request bodies at the FastAPI boundary, plus additional inline validation in route handlers (e.g., `validate_point_data()` in `backend/app/routes/points.py`).

**Authentication:** JWT-based. Token stored in httpOnly cookie (primary) or Bearer header (secondary). Session route (`GET /api/auth/session`) validates token and returns user object.

---

*Architecture analysis: 2026-05-28*
