# Codebase Concerns
**Analysis Date:** 2026-04-14

## Tech Debt

### Environment-Based Branching in API
- **Issue:** The codebase uses `PROJECT_ENV` checks (`development` vs `production`) throughout the route handlers to switch between SQLite and PostgreSQL. This leads to massive code duplication and fragile maintenance.
- **Files:** `backend/app/routes/property.py`, `backend/app/routes/points.py`, and likely other route files.
- **Impact:** High. Any change to business logic must be applied in two places. Bug risk is high due to inconsistent implementation between the two environments.
- **Fix approach:** Implement a Repository pattern or a Database abstraction layer. Use an ORM like SQLAlchemy or Tortoise to handle dialect differences transparently.

### Raw SQL Queries
- **Issue:** The project relies on raw SQL strings for all database operations.
- **Files:** `backend/app/routes/property.py`, `backend/app/routes/points.py`, `backend/app/db/db.py`.
- **Impact:** Medium. Increased risk of SQL injection (though parameterized queries are used in some places) and lack of type safety for database records.
- **Fix approach:** Migrate to an ORM or use a query builder.

### Massive Frontend Components
- **Issue:** `MapComponent.jsx` is over 1300 lines long and handles everything from map initialization, marker management, radius/line drawing, and event handling.
- **Files:** `frontend/src/components/EditorPage/Map/MapComponent.jsx`
- **Impact:** High. The file is extremely difficult to read, test, and maintain. It violates the Single Responsibility Principle.
- **Fix approach:** Break down the component into smaller, specialized hooks (e.g., `useMapMarkers`, `useMapDrawing`) and sub-components.

## Known Bugs

### Property Edit SQL Error
- **Symptom:** Potential runtime error in production property update.
- **Files:** `backend/app/routes/property.py` (Line 216)
- **Trigger:** Calling the patch endpoint for a property in production.
- **Details:** The SQL query uses `WHERE id=%a` instead of `WHERE id=%s`.

## Performance Bottlenecks

### Marker Re-rendering
- **Problem:** The `markers` useEffect in `MapComponent.jsx` clears all existing markers and re-adds them every time the `markers` prop changes.
- **Files:** `frontend/src/components/EditorPage/Map/MapComponent.jsx` (Lines 112-131)
- **Cause:** `canvasObjectsRef.current = {}` and subsequent re-looping over all markers.
- **Improvement path:** Implement a diffing mechanism to only add/update/remove changed markers instead of a full wipe-and-reload.

## Fragile Areas

### Error Handling in API
- **Files:** `backend/app/routes/property.py`, `backend/app/routes/points.py`
- **Why fragile:** Extensive use of generic `except Exception as e` blocks that return 400/500 errors without specific context, often masking underlying issues.
- **Safe modification:** Implement custom exception handlers and a global error middleware in FastAPI.
- **Test coverage:** Low/Not detected.

## Dependencies at Risk

### SQLite for Development
- **Risk:** Using SQLite for development and PostgreSQL for production can lead to "works on my machine" bugs due to differences in data types, constraints, and concurrency models.
- **Impact:** High. Schema mismatches and behavioral differences between the two DBs.
- **Migration plan:** Use Docker to run PostgreSQL in both development and production environments.

## Test Coverage Gaps

### Lack of Automated Tests
- **What's not tested:** Virtually all business logic in the backend and complex interactions in the frontend (especially the map).
- **Files:** Entire `backend/app/` and `frontend/src/` directories.
- **Risk:** High. Regressions are likely during refactoring of the env-branching logic.
- **Priority:** High
