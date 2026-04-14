# Codebase Structure **Analysis Date:** 2026-04-14

## Directory Layout
```
[project-root]/
├── backend/              # Python FastAPI Backend
│   ├── app/              # Core application logic
│   │   ├── db/           # Database initialization and connection
│   │   ├── models/       # Pydantic models for data validation
│   │   ├── routes/       # API endpoint handlers
│   │   └── utils/        # Helper functions (JWT, DB, Image processing)
│   ├── scripts/          # Database migration and maintenance scripts
│   └── main.py           # Application entry point
├── frontend/             # React Frontend
│   ├── src/              # Source code
│   │   ├── redux/        # Redux store, slices, and API utilities
│   │   └── index.js      # Frontend entry point
│   └── public/           # Static assets
└── .planning/             # Project planning and codebase documentation
    └── codebase/         # Generated architecture and tech docs
```

## Directory Purposes
**backend/app/routes:**
- Purpose: Define REST API endpoints.
- Contains: Python files mapping URLs to functions.
- Key files: `auth.py`, `property.py`, `users.py`.

**backend/app/models:**
- Purpose: Define the shape of data entering and leaving the API.
- Contains: Pydantic models.
- Key files: `response_model.py`, `user.py`.

**backend/app/db:**
- Purpose: Database schema definition and connection management.
- Contains: SQL scripts for table creation.
- Key files: `db.py`.

**frontend/src/redux:**
- Purpose: Global state management.
- Contains: Reducers and API wrapper utilities.
- Key files: `store.js`, `apiUtils.js`.

## Key File Locations
**Entry Points:**
- `backend/main.py`: Backend server startup.
- `frontend/src/index.js`: Frontend React mount point.

**Configuration:**
- `backend/requirements.txt`: Python dependencies.
- `docker-compose.yml`: Infrastructure orchestration.

**Core Logic:**
- `backend/app/routes/auth.py`: Authentication and session logic.
- `backend/app/db/db.py`: Database schema definition.

**Testing:**
- `backend/app/utils/test.py`: Backend utility tests.

## Naming Conventions
**Files:**
- Backend routes: `[resource].py` (e.g., `floors.py`)
- Frontend Redux slices: `[resource].js` (e.g., `properties.js`)

**Directories:**
- Lowercase, descriptive names (e.g., `app`, `routes`, `models`).

## Where to Add New Code
**New Feature:**
- Backend API: Add new route in `backend/app/routes/`, define models in `backend/app/models/`.
- Frontend State: Add new slice in `frontend/src/redux/` and update `store.js`.

**New Component/Module:**
- Backend Utilities: `backend/app/utils/`.
- Frontend Components: `frontend/src/components/` (if created).

**Utilities:**
- Shared Backend helpers: `backend/app/utils/`.
- Shared Frontend helpers: `frontend/src/redux/apiUtils.js`.

## Special Directories
**.planning/codebase:**
- Purpose: Stores technical analysis of the codebase for agent reference.
- Generated: Yes.
- Committed: Yes.
---
*Structure analysis: 2026-04-14*
