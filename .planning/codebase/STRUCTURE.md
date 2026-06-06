# Codebase Structure

**Analysis Date:** 2026-05-28

## Directory Layout

```
Home-Tools-2/
├── .env                        # Environment variables (NOT version-controlled)
├── .env.example                # Example env vars for setup reference
├── .gitignore
├── docker-compose.yml          # Orchestration: db, backend, frontend, adminer
├── start_local.sh              # Dev startup: runs backend uvicorn + frontend CRA
├── form1-example.html          # Standalone HTML form example
├── postgres_data/              # PostgreSQL data volume (auto-created by Docker)
│
├── backend/                    # Python FastAPI backend
│   ├── Dockerfile              # Python 3.11 → uvicorn production image
│   ├── requirements.txt        # Python dependencies
│   ├── main.py                 # FastAPI app entry: CORS, init_db, mount router
│   ├── app/                    # Application package
│   │   ├── db/                 # Database connection and session management
│   │   ├── models/             # SQLAlchemy ORM models + Pydantic schemas
│   │   ├── routes/             # FastAPI APIRouter modules (one per resource)
│   │   └── utils/              # Cross-cutting helpers (JWT, image upload)
│   ├── tests/                  # Pytest test suite
│   ├── scripts/                # One-off migration/utility scripts
│   └── venv/                   # Python virtualenv (dev, gitignored)
│
└── frontend/                   # React.js SPA frontend
    ├── Dockerfile              # Node 20 build → nginx static serve
    ├── default.conf            # nginx config template
    ├── package.json            # Node dependencies & scripts
    ├── public/                 # Static assets (icons, HTML template)
    ├── build/                  # Production build output (generated)
    ├── src/                    # React application source
    │   ├── index.js            # App entry: ReactDOM root, Provider, RouterProvider
    │   ├── index.css           # Global styles
    │   ├── components/         # React components organized by page/feature
    │   ├── context/            # React context providers (Modal)
    │   ├── redux/              # Redux store, slices, API utils
    │   ├── router/             # React Router config and layout component
    │   ├── functions/          # Pure utility functions (search/geocoding)
    │   ├── hooks/              # Custom React hooks
    │   └── setupProxy.js       # CRA proxy for /api → backend in dev
    └── node_modules/           # npm dependencies (gitignored)
```

## Directory Purposes

### `backend/` — FastAPI Python backend

**`backend/app/db/`:**
- Purpose: Database engine, session management, model base imports
- Contains: `session.py` (engine/SessionLocal/get_db_session), `base.py` (imports all models for metadata), `db.py` (init_db → create_all)
- Key files: `session.py` — defines `POSTGRES_URL`-based engine, `SessionLocal`, and the `get_db_session` FastAPI dependency generator

**`backend/app/models/`:**
- Purpose: SQLAlchemy ORM models and Pydantic request/response schemas
- Contains: One file per entity — `user.py`, `property.py`, `point.py`, `floor.py`, `image.py`, `team.py`, `user_team.py`, `home_group.py`, `notification.py`, `saved_types.py`, `settings.py`, `response_model.py`
- Custom type: `property.py` defines `PydanticType` — a SQLAlchemy `TypeDecorator` that auto-serializes Pydantic models to JSONB
- Key files: `property.py` — contains `HierarchySchema`, `PydanticType`, and the `Property` ORM model with JSONB hierarchy column

**`backend/app/routes/`:**
- Purpose: HTTP route handlers, one router per resource
- Contains: `__init__.py` (aggregates all sub-routers under `/api` prefix), `auth.py`, `property.py`, `points.py`, `images.py`, `floors.py`, `users.py`, `teams.py`, `home_groups.py`, `notifications.py`, `saved_types.py`, `settings.py`
- Pattern: Each router is `APIRouter(prefix=...)` mounted in `__init__.py`. All protected routes use `Depends(get_current_user)` from `auth.py`.

**`backend/app/utils/`:**
- Purpose: Stateless helper functions
- Contains: `jwt.py` (token create/decode with HS256), `image_utils.py` (file upload/delete for `app/uploads/`), `test.py` (debug script for `.env` resolution)

**`backend/tests/`:**
- Purpose: Pytest test suite
- Currently contains: `test_hierarchy.py` — tests CRUD of `Property.hierarchy` JSONB field with SQLite in-memory
- Runs with: `pytest` (pytest 9.0.3, pytest-asyncio 1.3.0)

**`backend/scripts/`:**
- Purpose: One-off database migration and maintenance scripts
- Contains: `apply_hierarchy_schema.py` (ALTER TABLE to add JSONB column), `migrate_floors_to_hierarchy.py` (migrates legacy Floor records into Property.hierarchy JSONB)

### `frontend/` — React SPA frontend

**`frontend/src/components/`:**
- Purpose: All React components organized by page/feature
- Contains subdirectories:
  - `EditorPage/` — Main editing interface: `EditorPage.jsx`, `Map/` (MapLibre GL), `PropertyDetailsSidebar/` (hierarchy tree + note editor + Milkdown), `SettingsPanel/`
  - `DashboardPage/` — Property listing and management
  - `RenderPage/` — Read-only render view for properties
  - `RenderHomePage/` — Landing page for render mode
  - `LoginFormPage/`, `SignupFormPage/` — Auth pages
  - `LoginForm/`, `SignupForm/` — Auth form components
  - `PropertyForm/` — Create/edit property modal form
  - `Navbar/`, `Footer/` — App chrome
  - `CustomPointModal/`, `ManagePointsModal/` — Map point management modals
  - `PopupModals/` — NavigateModal for map navigation
- Naming: PascalCase directories, PascalCase.jsx for component files, CamelCase.css for styles

**`frontend/src/redux/`:**
- Purpose: Redux state management
- Contains: `store.js` (configureStore with 8 slices), per-slice files (`session.js`, `properties.js`, `points.js`, `floors.js`, `images.js`, `users.js`, `settings.js`, `savedTypes.js`), `apiUtils.js` (fetch wrapper)
- Pattern: Traditional Redux (not RTK slices) — manual action types, thunks, and reducer switch statements. Three slices (`floors.js`, `images.js`, `users.js`) have stub reducers that return `undefined`.

**`frontend/src/router/`:**
- Purpose: Routing configuration and app shell
- Contains: `index.jsx` (createBrowserRouter with 7 routes + 404 catch-all), `Layout.jsx` (auth init, settings load, modal provider, navbar/footer/outlet)
- Dependencies: react-router-dom v7

**`frontend/src/context/`:**
- Purpose: React context providers
- Contains: `Modal/` — `Modal.jsx` (ModalProvider, Modal, useModal), `ModalButton.jsx`, `Modal.css`, `index.js` (barrel exports)

**`frontend/src/hooks/`:**
- Purpose: Custom React hooks
- Contains: `useLocalStorageWithTTL.js` — generic localStorage hook with TTL expiry

**`frontend/src/functions/search/`:**
- Purpose: Geocoding utilities
- Contains: `search.js` — Nominatim OpenStreetMap forward/reverse geocoding API client with `formatPlace()` address formatter

## Key File Locations

**Entry Points:**
- `backend/main.py`: FastAPI app creation, middleware, DB init, router mount
- `frontend/src/index.js`: React root, Redux provider, Router provider

**Configuration:**
- `.env.example`: Port configuration template
- `docker-compose.yml`: Multi-service orchestration (PostgreSQL 15, FastAPI, React, Adminer)
- `backend/Dockerfile`: Python 3.11 → uvicorn
- `frontend/Dockerfile`: Node 20 build → nginx
- `frontend/src/setupProxy.js`: Dev-time API proxy config
- `frontend/default.conf`: nginx config template

**Core Logic:**
- `backend/app/routes/property.py`: Property CRUD with JSONB hierarchy
- `backend/app/routes/points.py`: Map marker CRUD with type-specific validation
- `frontend/src/components/EditorPage/EditorPage.jsx`: Main editor with staging, undo/redo, Save All
- `frontend/src/components/EditorPage/Map/MapComponent.jsx`: MapLibre GL map, marker rendering, draw tools

**Testing:**
- `backend/tests/test_hierarchy.py`: Pytest test for Property hierarchy CRUD

## Naming Conventions

**Files:**
- Python: `snake_case.py` — e.g., `property.py`, `image_utils.py`, `test_hierarchy.py`
- JavaScript/React: `PascalCase.jsx` for components, `camelCase.js` for utilities/redux — e.g., `EditorPage.jsx`, `PropertyDetailsSidebar.jsx`, `apiUtils.js`, `store.js`
- CSS: `PascalCase.css` matching component name — e.g., `PropertyDetailsSidebar.css`, `EditorPage.css`

**Directories:**
- Backend: `snake_case/` at all levels — `app/db/`, `app/models/`, `app/routes/`, `app/utils/`
- Frontend: `PascalCase/` for component directories (matching the component name), `camelCase/` for concept directories — `EditorPage/`, `Map/`, `redux/`, `functions/`, `hooks/`

**Functions:**
- Python: `snake_case` — e.g., `get_current_user`, `validate_password`, `hash_password`
- JavaScript: `camelCase` — e.g., `thunkCreateProperty`, `handleSaveAll`, `formatProperty`
- React components: `PascalCase` — `EditorPage`, `MapComponent`, `PropertyDetailsSidebar`

**Variables:**
- Python: `snake_case` throughout
- JavaScript: `camelCase` throughout
- Redux action types: UPPER_SNAKE_CASE with namespace prefix — e.g., `CREATE_PROPERTY`, `session/setUser`

## Where to Add New Code

**New Feature (Backend):**
- New route: Create file in `backend/app/routes/` (e.g., `my_feature.py`), define `router = APIRouter(prefix=...)`, add `router.include_router(my_router)` in `backend/app/routes/__init__.py`
- New model: Create file in `backend/app/models/` (e.g., `my_entity.py`), define ORM model + Pydantic schema, add import to `backend/app/db/base.py`
- New utility: Create file in `backend/app/utils/`

**New Feature (Frontend):**
- New page: Create component directory under `frontend/src/components/` (PascalCase), add route in `frontend/src/router/index.jsx`, export barrel `index.js`
- New Redux slice: Create file in `frontend/src/redux/`, register reducer in `frontend/src/redux/store.js`
- New API call: Add thunk to existing Redux slice (preferred) or create new slice

**New Component/Module:**
- Implementation: `frontend/src/components/{FeatureName}/{FeatureName}.jsx` with corresponding `{FeatureName}.css`
- Barrel export: `frontend/src/components/{FeatureName}/index.js` — `export { default } from './{FeatureName}';`
- Tests: No test directory exists for frontend yet. If adding tests, consider `frontend/src/__tests__/` or co-located `{Component}.test.jsx`

**Utilities:**
- Shared helpers: `frontend/src/functions/` (pure JS utilities), `frontend/src/hooks/` (React hooks)

## Special Directories

**`frontend/build/`:**
- Purpose: Production build output from `react-scripts build`
- Generated: Yes
- Committed: Yes (deployed directly to nginx)

**`frontend/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No (gitignored)

**`backend/venv/`:**
- Purpose: Python virtual environment
- Generated: Yes
- Committed: No (gitignored)

**`postgres_data/`:**
- Purpose: PostgreSQL data persisted to host filesystem
- Generated: Yes (by Docker)
- Committed: No (gitignored)

**`backend/app/uploads/`:**
- Purpose: Uploaded image files (created at runtime)
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-05-28*
