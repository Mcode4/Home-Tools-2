# Codebase Concerns

**Analysis Date:** 2026-05-28

## Tech Debt

### Stub Redux Reducers (Unimplemented State Management)

**Issue:** Three Redux slice files contain reducers that return `undefined` on every action, meaning nothing is ever stored or retrieved.

**Files:**
- `frontend/src/redux/floors.js` (lines 31-37) — All case blocks `return` with no value
- `frontend/src/redux/images.js` (lines 32-38) — All case blocks `return` with no value
- `frontend/src/redux/users.js` (lines 28-32) — All case blocks `return` with no value

**Impact:** If any component dispatches `CREATE_FLOOR`, `LOAD_FLOORS`, `EDIT_FLOOR`, or `REMOVE_FLOOR`, the entire floors Redux state becomes `undefined`, cascading into errors in any subscriber. The store is registered in `frontend/src/redux/store.js` (lines 25-28), so these dead reducers are included in every Redux dispatch cycle.

**Fix approach:** Either implement the reducer case bodies (matching patterns in `points.js` or `properties.js`) or remove the slices from the store configuration.

### Team Edit/Delete Endpoints Are Stubs

**Issue:** The team modification endpoints return placeholder messages and never perform database operations.

**Files:**
- `backend/app/routes/teams.py` (lines 88-90) — `edit_team` returns `"Team update logic not implemented"`
- `backend/app/routes/teams.py` (lines 93-96) — `delete_team` returns `"Team deletion logic not implemented"`

**Impact:** Any frontend call to PATCH `/api/teams/{id}/{action}` or DELETE `/api/teams/{id}` silently succeeds without persisting changes. Users will see success messages while data is discarded.

**Fix approach:** Implement actual DB mutations and ownership/integrity checks mirroring patterns used in `property.py` or `floors.py`.

### Routes Not Registered (HomeGroups, Notifications, Teams)

**Issue:** Several route modules exist but are not imported or included in the API router.

**Files:**
- `backend/app/routes/home_groups.py` — Defined at `prefix="/groups"` — NOT imported in `__init__.py`
- `backend/app/routes/notifications.py` — Defined at `prefix="/notifications"` — NOT imported in `__init__.py`
- `backend/app/routes/teams.py` — Defined at `prefix="/teams"` — NOT imported in `__init__.py`

**Impact:** These API endpoints are dead code. Any frontend code calling these routes will receive 404 responses. The database models exist (`home_group.py`, `notification.py`, `team.py`, `user_team.py`) but cannot be accessed via the API.

**Fix approach:** Import and `include_router()` each missing route in `backend/app/routes/__init__.py`.

### No Database Migration System

**Issue:** The codebase relies on `Base.metadata.create_all(bind=engine)` for schema management instead of a proper migration tool like Alembic.

**Files:**
- `backend/app/db/db.py` (line 6)
- `backend/app/db/session.py` (line 14) — No Alembic config or migration directory exists

**Impact:** Schema changes require manual intervention. `create_all()` only creates tables that don't exist — it does NOT handle column additions, removals, renames, or data migrations. The script `backend/scripts/apply_hierarchy_schema.py` demonstrates this problem by using raw ALTER TABLE SQL, which is fragile across environments.

**Fix approach:** Add Alembic with initial migration revision that matches current model definitions, and use `alembic upgrade head` in startup scripts instead of `init_db()`.

### Health Check Route Returns Set Instead of Dict

**Issue:** The health check endpoint uses a Python set literal instead of a dict, causing a FastAPI serialization failure.

**File:** `backend/app/routes/__init__.py` (line 24)

```python
return {"status", "API running"}  # This is a set, not a dict
```

**Impact:** Hitting `GET /api/` will throw a runtime error. FastAPI expects dict-like response structures. This breaks health monitoring.

**Fix approach:** Change to `return {"status": "API running"}`.

### No Backend Tests for Route Logic

**Issue:** Only one test file exists (`backend/tests/test_hierarchy.py`), and it only tests the ORM-level Pydantic type decorator. No route-level, integration, or auth tests exist.

**Files:** 
- `backend/tests/test_hierarchy.py` — Single test, covers only `PydanticType` serialization
- No route tests exist for any of the 8+ API route files

**Impact:** Route changes cannot be verified without manual testing. Auth bugs, permission bypasses, and data corruption issues will not be caught in CI.

**Fix approach:** Add pytest-based route tests with `TestClient` covering all CRUD endpoints, auth flows, and ownership validation.

### Excessive console.log Statements

**Issue:** The frontend codebase is littered with `console.log` debugging statements, including sensitive data like user objects and API responses.

**Files (representative sample):**
- `frontend/src/redux/session.js` — 5 `console.log` calls logging user data
- `frontend/src/redux/properties.js` — `console.log("CHECK", check)` via `checkAndReturnRes`
- `frontend/src/redux/apiUtils.js` (line 7) — Logs successful API responses
- `frontend/src/redux/apiUtils.js` (line 9) — Logs error API responses
- `frontend/src/components/EditorPage/EditorPage.jsx` — Multiple console logs for undo/redo/save operations
- `frontend/src/functions/search/search.js` — Logs Nominatim search results

**Impact:** Sensitive information (user emails, property coordinates, auth tokens) could be exposed in browser developer consoles. Development-only debugging patterns leak into production builds.

**Fix approach:** Remove or guard `console.log` statements behind `if (process.env.NODE_ENV !== 'production')` checks. Consider using a logging library.

### Bare Except Clauses Swallow Errors

**Issue:** Multiple bare `except:` blocks (without specifying exception type) catch all exceptions including `KeyboardInterrupt` and `SystemExit`, and silently return falsy values.

**Files:**
- `backend/app/utils/jwt.py` (line 28) — `except: return None` swallows JWT decode errors
- `backend/app/utils/image_utils.py` (line 27) — `except: return False` swallows image upload errors
- `backend/app/routes/property.py` (line 113) — `except: pass` swallows image deletion errors during property deletion

**Impact:** JWT authentication silently returns "not authenticated" instead of giving a clear error. Image upload failures return opaque "Failed to upload image" messages. Image deletion errors during property deletion are silently ignored, potentially leaking file storage.

**Fix approach:** Replace bare `except:` with specific exception types (`jwt.JWTError`, `OSError`, `IOError`). Add logging in error handlers.

### Function Used as ResponseModel Instead of Class

**Issue:** `ResponseModel` is defined as a plain function rather than a Pydantic model or dataclass, providing no schema validation or autocomplete.

**File:** `backend/app/models/response_model.py` (lines 1-8)

**Impact:** No API response schema validation. Changes to response structure won't be caught by type checkers. The inconsistent capitalization (PascalCase function) suggests it was intended to be a class.

**Fix approach:** Refactor to a Pydantic `BaseModel` subclass with typed fields for `success`, `message`, and optional `data`.

### Backend Debug/Utility Scripts in Repository

**Issue:** The `backend/scripts/` directory contains debug scripts and the `backend/app/utils/test.py` file that exist solely to print .env file paths. These serve no production purpose.

**Files:**
- `backend/app/utils/test.py` (lines 1-17) — Only prints `.env` file locations, never called in production
- `backend/scripts/apply_hierarchy_schema.py` — Raw SQL migration script, should be replaced by Alembic
- `backend/scripts/migrate_floors_to_hierarchy.py` — One-time migration script, should not remain in active codebase

**Impact:** Cluttered repository with dead code. The migration scripts suggest manual schema changes without a proper migration system.

**Fix approach:** Remove `test.py`. Archive migration scripts outside the source tree. Implement Alembic migrations.

## Security Considerations

### Hardcoded Secrets in docker-compose.yml

**Risk:** Database credentials, JWT secret key, and algorithm are hardcoded in the Docker Compose file, which is typically committed to version control.

**File:** `docker-compose.yml` (lines 7-8, 24-27)

```yaml
POSTGRES_PASSWORD: strongpassword
SECRET_KEY: supersecretkey123
ALGORITHM: HS256
```

**Current mitigation:** `.gitignore` does not exclude `docker-compose.yml`; the values are placeholders.

**Recommendations:**
- Use `${POSTGRES_PASSWORD}` environment variable references with a `.env` file
- Use Docker secrets or a secrets management system
- Rotate all secrets before deploying to any environment

### Weak Default Secret Key

**Risk:** The JWT utility provides a weak fallback secret hardcoded in source code that is trivially guessable.

**File:** `backend/app/utils/jwt.py` (line 13)

```python
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION!..")
```

**Current mitigation:** The fallback is only used when `SECRET_KEY` environment variable is not set.

**Recommendations:** Remove the fallback default and raise an explicit error if `SECRET_KEY` is not set. Enforce a minimum key length/strength check at startup.

### Overly Permissive CORS Configuration

**Risk:** CORS allows all methods and all headers from hardcoded origins, increasing attack surface.

**File:** `backend/main.py` (lines 26-29)

```python
allow_methods=["*"],
allow_headers=["*"]
```

**Current mitigation:** Origins are restricted to localhost variants.

**Recommendations:** Restrict methods and headers to only what the application actually needs (e.g., `["GET", "POST", "PATCH", "DELETE"]` for methods).

### No Database Connection Pool Limits

**Risk:** The SQLAlchemy engine uses default connection pool settings with no explicit pool size or overflow limits.

**File:** `backend/app/db/session.py` (line 14)

```python
engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
```

**Current mitigation:** None. Default pool size is 5, but no overflow or timeout is configured.

**Recommendations:** Add explicit `pool_size=5, max_overflow=10, pool_timeout=30` to `create_engine()`. Add connection pooling under load testing.

### IntegrityError Detail Leaked to Client

**Risk:** Database integrity error messages (which may contain schema information, constraint names, or column details) are returned directly to the client.

**Files (multiple routes):**
- `backend/app/routes/auth.py` (line 77-78) — `raise HTTPException(status_code=500, detail="User already exists")` — This one is safe, but line 80 leaks `str(e)` on non-integrity exceptions
- `backend/app/routes/property.py` (line 69) — `raise HTTPException(status_code=500, detail=str(e))` leaks raw exception
- All other route files follow the same pattern

**Impact:** Information disclosure. Exception messages can reveal database schema details, constraint names, and data values.

**Recommendations:** Log the full exception server-side and return a generic error message to the client.

### Nominatim API Calls Without User-Agent

**Risk:** The Nominatim OpenStreetMap API requires a custom User-Agent header per their usage policy. Violating this can result in IP bans.

**File:** `frontend/src/functions/search/search.js` (lines 10-13, 57-59)

**Recommendations:** Add a custom User-Agent header with application name and contact info:
```javascript
headers: { "User-Agent": "HomeTools/2.0 (your@email.com)" }
```

### nginx CORS Configuration Overly Permissive

**Risk:** The production nginx config allows any origin (`*`) for CORS preflight requests.

**File:** `frontend/default.conf` (lines 18, 20)

```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Headers "*";
```

**Current mitigation:** This only applies to OPTIONS preflight requests.

**Recommendations:** Restrict `Access-Control-Allow-Origin` to the specific frontend origin in production.

## Known Bugs

### Password Validation Error Message Inconsistency

**Symptoms:** The min-length check says "Password be between 5 and 25 character" (typo and wrong range) while Pydantic validates min 8, max 25.

**File:** `backend/app/routes/auth.py` (lines 27-28)

```python
if len(plain_password) < 8 or len(plain_password) > 25:
    raise HTTPException(status_code=400, detail="Password be between 5 and 25 character")
```

**Impact:** Users see confusing error messages. The error says "5 and 25" but the code enforces 8-25.

**Fix:** Correct the error message to match the actual validation: `"Password must be between 8 and 25 characters"`.

### `os.makedirs` Uses Wrong Parameter Name

**Symptoms:** Image upload fails silently with `return False` instead of creating the upload directory.

**File:** `backend/app/utils/image_utils.py` (line 19)

```python
os.makedirs(image_dir, exists_ok=True)
```

**Impact:** The correct parameter is `exist_ok`, not `exists_ok`. This will raise a `TypeError` before it reaches the bare except block. The function then returns `False` and the image is never saved.

**Fix:** Change `exists_ok=True` to `exist_ok=True`.

### Front-end `thunkLogout` Sends DELETE Without Credentials

**Symptoms:** Logout may not clear the session cookie because the DELETE request to `/api/auth/session` doesn't include `credentials: "include"`.

**File:** `frontend/src/redux/session.js` (lines 63-65)

```javascript
const res = await fetch(`/api/auth/session`, {
    method: "DELETE"
});
```

**Impact:** If the session cookie is required to log out server-side, the cookie isn't sent with the request, so the server may not clear the session properly.

**Fix:** Add `credentials: "include"` to the fetch options.

### `thunkGetSavedTypes` and `thunkDeleteSavedType` Missing Credentials

**Symptoms:** Saved types fetching and deleting may fail in authenticated contexts (non-localhost environments).

**File:** `frontend/src/redux/savedTypes.js`
- Line 23: `fetch("/api/types")` — No `credentials: "include"`
- Line 45-47: `fetch(`/api/types/${id}`, { method: "DELETE" })` — No credentials

**Impact:** Auth cookies are not sent with these requests. In production environments (non-proxy), the server cannot authenticate the user.

**Fix:** Add `credentials: "include"` to all fetch calls in this file.

### `floors.js` Reducer Returns `undefined` Instead of Updated State

**Symptoms:** Any floor-related Redux action (create, load, edit, remove) sets the entire floor state to `undefined`.

**File:** `frontend/src/redux/floors.js` (lines 29-41)

**Trigger:** Dispatching any floor action (e.g., loading floors from the backend).

**Workaround:** None. The floor feature is effectively disabled at the state management level.

**Fix:** Implement reducer cases similar to `properties.js`.

### Missing `rooms` and `inspectionData` Column in Floor Model But Code Expects Them

**Symptoms:** The `Floor` model has no `rooms` or `inspectionData` column, but the frontend code references `f.rooms` for hierarchy migration and the `NodeDetailsEditor` works with `nodeData.inspectionData`.

**Files:**
- `backend/app/models/floor.py` — No `rooms` column
- `backend/scripts/migrate_floors_to_hierarchy.py` (line 37) — Iterates `floor.bedrooms` to create rooms
- `frontend/src/components/EditorPage/PropertyDetailsSidebar/NodeDetailsEditor.jsx` (line 12) — References `nodeData.inspectionData`

**Impact:** The floor-to-hierarchy migration script may silently fail to produce expected room data. Inspection data is stored only in-memory and lost on page refresh.

## Performance Bottlenecks

### Large Component Files

**Problem:** Two frontend components are extremely large, making React reconciliation expensive and maintenance difficult.

**Files:**
- `frontend/src/components/EditorPage/EditorPage.jsx` — 1211 lines
- `frontend/src/components/EditorPage/PropertyDetailsSidebar/PropertyDetailsSidebar.jsx` — 846 lines

**Cause:** All state, handlers, rendering, and sub-component definitions live in single files. EditorPage.jsx alone defines 8+ helper functions, 30+ state variables, 8+ effects, and complex mapping/transformation logic.

**Improvement path:** Split EditorPage into smaller focused hooks (`useCanvasState`, `useMapInteraction`, `useHistory`, `useSearch`). Split PropertyDetailsSidebar into separate components for each tab.

### No Pagination on List Endpoints

**Problem:** All "get all" API endpoints return the entire dataset without pagination, offset, or limit parameters.

**Files:**
- `backend/app/routes/property.py` — `GET /api/property/all` returns all properties
- `backend/app/routes/points.py` — `GET /api/points/all` returns all points
- `backend/app/routes/notifications.py` — `GET /api/notifications` returns all notifications
- `backend/app/routes/settings.py` — `GET /api/settings` returns all settings (though scoped to user)

**Cause:** None of these queries use `.limit()`, `.offset()`, or `.paginate()`.

**Improvement path:** Add `limit` and `offset` query parameters to all collection endpoints with sensible defaults (e.g., limit=50).

### Frequent Database Queries in Debounced Save Loop

**Problem:** The Save All operation in `EditorPage.jsx` fires multiple sequential API calls without batching.

**File:** `frontend/src/components/EditorPage/EditorPage.jsx` (lines 849-873)

**Cause:** Deletions, creates, and updates are dispatched as individual Redux thunks inside a `Promise.all()`, each triggering a separate HTTP request. For N properties and M points, this generates N+M+2 HTTP requests.

**Improvement path:** Implement batch endpoints (e.g., `POST /api/property/batch`, `DELETE /api/property/batch`) that accept arrays of operations.

### No Index on Foreign Key Columns

**Problem:** Several frequently queried foreign key columns lack explicit database indexes.

**Files (all models):**
- `User.id` is indexed, but `Property.owner_id`, `Floor.owner_id`, `Floor.property_id`, `Point.owner_id`, `Image.owner_id`, `Image.property_id`, `Notification.recipient_id`, `Notification.sender_id` all lack explicit index definitions beyond what the FK constraint provides (if Postgres creates an index for FK constraints at all — it does not by default).

**Impact:** Queries filtering by `owner_id` (which is nearly every "get all" endpoint) will perform sequential scans as data grows.

**Fix approach:** Add `index=True` to all `ForeignKey` columns in model definitions.

## Fragile Areas

### JWT Authentication / Session Module

**Files:**
- `backend/app/routes/auth.py` (lines 124-171)
- `backend/app/utils/jwt.py`

**Why fragile:**
- `get_current_user` is initially defined as one function, then reassigned to `get_session_user` on line 171 — confusing API consumers
- The initial `get_current_user` function (lines 124-140) is dead code that never completes (no return value)
- JWT decoding has a bare `except: return None` that treats expired, malformed, and invalid tokens identically
- Token expiry is only 60 minutes with no refresh token mechanism — users will be logged out frequently during long editing sessions
- No token revocation/blacklist mechanism exists

**Safe modification:** Add a refresh token flow. Always use `get_session_user` (the single dependency). Add specific JWT exception handling.

**Test coverage:** Zero. No auth endpoint tests exist.

### Image Upload Utility

**Files:**
- `backend/app/utils/image_utils.py`

**Why fragile:**
- Bare `except: return False` — any error (OSError, IOError, file permission) returns `False`, losing diagnostic information
- `os.makedirs(image_dir, exists_ok=True)` uses wrong parameter name (`exists_ok` instead of `exist_ok`)
- Upload directory structure uses raw user IDs without sanitization
- No file size validation — a user could upload extremely large files
- No file content validation beyond MIME type sniffing
- File extension is extracted from `file.filename` without sanitization

**Safe modification:** Fix the `exist_ok` parameter. Add specific exception handling. Validate file size and sanitize the filename extension. Add logging.

**Test coverage:** Zero.

### Docker Compose Configuration

**Files:**
- `docker-compose.yml`

**Why fragile:**
- Hardcoded secrets (`strongpassword`, `supersecretkey123`)
- No health checks on services (backend could start before DB is ready)
- Postgres data volume is mapped to a local directory (`./postgres_data`) not listed in `.gitignore` — risk of accidentally committing database state
- Adminer (database admin tool) is included in the default compose profile — potential attack vector in production
- The `depends_on` for backend only checks container start, not database readiness

**Safe modification:** Remove Adminer from production profile. Add health checks. Move secrets to `.env`. Add `postgres_data` to `.gitignore` (it's already there, confirmed).

### Large EditorPage Component

**Files:**
- `frontend/src/components/EditorPage/EditorPage.jsx` (1211 lines)

**Why fragile:**
- 30+ `useState` hooks and 8+ `useEffect` hooks create complex dependency chains
- Multiple mutable refs (`savingRef`, `isSavingAllRef`, `pendingHistoryRef`) introduce imperative state management alongside declarative React state
- Undo/redo system modifies DOM classes directly with `classList.toggle()` instead of using React state for visibility
- The `debounce` function defined outside the component (line 45) uses module-level state that persists across component unmounts
- Complex ID parsing logic (lines 500-638) with manual prefix shifting and category bridging is extremely error-prone

**Safe modification:** Extract the canvas state management into a custom hook. Replace DOM class manipulation with React state. Add unit tests for the ID parsing logic.

## Dependencies at Risk

### `react-scripts` 5.0.1 (Unmaintained Path)

**Risk:** `react-scripts` 5.0.1 is no longer actively maintained. Security vulnerabilities in webpack dev server and its transitive dependencies may not receive patches.

**File:** `frontend/package.json` (line 27)

**Migration plan:** Migrate to Vite (`npm create vite@latest`) or Next.js for active maintenance and faster builds. This is a significant migration effort due to CRA-specific configuration.

### `passlib[bcrypt]==1.7.4` / `bcrypt==3.2.2` (Pinned Versions)

**Risk:** These packages are pinned to specific versions. `passlib` 1.7.4 is from 2020 and may have unpatched vulnerabilities. The separate `bcrypt` dependency suggests explicit version control.

**File:** `backend/requirements.txt` (lines 7-8)

**Migration plan:** Update `passlib` to latest and test password hashing/verification. Consider moving to `bcrypt` directly if `passlib` is no longer needed.

### `httpx==0.28.1` (Pinned with Typo in Requirements)

**Risk:** The `httpx` dependency is pinned with a typo on the requirements line: `pydantic[email]httpx==0.28.1` — this may not install correctly via pip.

**File:** `backend/requirements.txt` (line 10)

**Migration plan:** Separate onto its own line: `httpx==0.28.1`.

### `@testing-library/user-event` v13 (Deprecated Version)

**Risk:** Version 13 is significantly outdated. Latest is v14, and critical API changes exist between versions.

**File:** `frontend/package.json` (line 17)

**Migration plan:** Update to v14 and adapt test code for API changes (e.g., `setup()` pattern).

## Missing Critical Features

### No Database Migration System

**Problem:** Schema changes require manual SQL scripts and the current `create_all()` approach is unsafe for production. No rollback capability exists.

**Blocks:** Safe schema evolution, zero-downtime deployments, team collaboration on schema changes.

### No Token Refresh Mechanism

**Problem:** JWT tokens expire in 60 minutes with no way to refresh them. Users conducting long editing sessions will be unexpectedly logged out, potentially losing unsaved work.

**Blocks:** Long editing sessions, reliable user experience during property data entry.

### No Request Rate Limiting

**Problem:** No rate limiting exists on any API endpoint. An attacker (or buggy frontend code) can hammer endpoints without restriction.

**Blocks:** Production deployment, protection against brute-force login attempts.

### No Background Task System

**Problem:** Image uploads and other I/O operations block the request-response cycle. No Celery, RQ, or asyncio task queue exists.

**Blocks:** Image-heavy workflows, large file processing.

## Test Coverage Gaps

**Untested area:** All API route handlers — zero route-level tests exist.

**Files:** `backend/app/routes/*.py` (8 route files, ~700+ lines of API logic)

**Risk:** Auth bypass, data corruption, permission escalation. Every endpoint's ownership validation (e.g., `prop.owner_id != current_user["id"]`) is untested.

**Priority:** High

---

**Untested area:** Frontend components — zero component tests exist.

**Files:** All `frontend/src/**/*.jsx` files (30+ components)

**Risk:** UI regressions, broken form submissions, map rendering issues.

**Priority:** Medium

---

**Untested area:** Image upload/download/delete workflow.

**Files:** `backend/app/routes/images.py`, `backend/app/utils/image_utils.py`

**Risk:** File system manipulation bugs, path traversal vulnerabilities, broken file cleanup.

**Priority:** High

---

*Concerns audit: 2026-05-28*
