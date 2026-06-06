# Testing Patterns

**Analysis Date:** 2026-05-28

## Test Framework

### Backend (Python)

**Runner:**
- **pytest** (`pytest==9.0.3`) with `pytest-asyncio==1.3.0`
- No `pytest.ini` or `conftest.py` detected
- Install: `pip install -r requirements.txt`
- Run command:
  ```bash
  pytest                       # Run all tests in backend/tests/
  pytest tests/ -v             # Verbose output
  pytest tests/test_hierarchy.py::test_hierarchy_crud  # Single test
  ```

**Note:** `pytest-asyncio==1.3.0` is installed in requirements but the only existing test (`test_hierarchy.py`) does not use `async` — it is a synchronous test.

### Frontend (JavaScript)

**Runner:**
- **Jest** (bundled via `react-scripts 5.0.1`)
- Test libraries:
  - `@testing-library/react` (`^16.3.2`) — React component rendering
  - `@testing-library/jest-dom` (`^6.9.1`) — Custom DOM matchers
  - `@testing-library/dom` (`^10.4.1`) — DOM query utilities
  - `@testing-library/user-event` (`^13.5.0`) — Simulating user events
- Run commands (from `package.json`):
  ```bash
  npm test                     # react-scripts test (watch mode)
  npm test -- --coverage       # With coverage report
  ```

## Test File Organization

### Backend

**Location:**
- All tests live in `backend/tests/`
- Single test file: `backend/tests/test_hierarchy.py`

**Naming:**
- Convention: `test_*.py` (pytest default discovery)
- Only one file: `test_hierarchy.py`

**Structure:**
```
backend/
  tests/
    __init__.py               # Not present (not required by pytest)
    test_hierarchy.py         # Only test file
```

### Frontend

**Location:**
- No test files exist in the frontend (`*.test.*` or `*.spec.*` patterns found none)
- `frontend/src/setupTests.js` exists (imports `@testing-library/jest-dom`) — this is the test setup file loaded by `react-scripts`

**Naming:**
- Expected convention (from react-scripts defaults): `*.test.js`, `*.spec.js`, or files in `__tests__/` directories
- **No actual tests exist** — the test infrastructure is configured but unused

## Test Structure

### Backend Test Pattern

**The single test file (`backend/tests/test_hierarchy.py`):**

**Setup — In-memory SQLite:**
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

**Database fixture:**
```python
@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
```

**Test function pattern:**
```python
def test_hierarchy_crud(db):
    # 1. Create object
    h = HierarchySchema(...)
    
    # 2. Save to DB
    prop = Property(owner_id=1, name="Test Home", ...)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    
    # 3. Verify with assertions
    assert prop.hierarchy.dimensions.h == 10
    assert len(prop.hierarchy.floors) == 1
    
    # 4. Update
    flag_modified(prop, "hierarchy")
    db.commit()
    db.refresh(prop)
    
    # 5. Verify update
    assert prop.hierarchy.floors[0].name == "Renamed Floor"
```

**Key patterns visible:**
- Uses `sqlite:///./test.db` (file-based) rather than `:memory:` — note `test.db` is listed in `backend/.gitignore`
- `Base.metadata.create_all(bind=engine)` and `.drop_all()` in fixture setup/teardown
- `flag_modified` from `sqlalchemy.orm.attributes` for JSON column updates
- Direct SQLAlchemy session usage (no FastAPI test client or dependency overrides)
- No `pytest.mark` decorators used
- No async tests despite `pytest-asyncio` being installed

## Mocking

### Backend
- **No mocking framework detected** — test uses real SQLite database
- No dependency overrides for FastAPI dependencies (no use of `TestClient`)
- No `unittest.mock` usage

### Frontend
- **No test files exist**, so no mocking patterns established
- Expected approach (from react-scripts): Jest manual mocks (`__mocks__/`), `jest.fn()`, `jest.mock()`
- Redux store would need mocking or test store setup for component tests

## Fixtures and Factories

### Backend
- Only fixture is the `db` fixture in `test_hierarchy.py`
- Creates test objects inline within each test
- No factory libraries (e.g., `factory_boy`) detected
- No separate test data/seed files

### Frontend
- No test fixtures, factories, or seed data files detected

## Coverage

**Requirements:** None enforced — no coverage configuration detected in either stack

**View Coverage:**
```bash
# Backend — would need pytest-cov installed (not in requirements.txt)
pytest --cov=app

# Frontend
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- **Backend:** The single existing test is an integration-level test (tests DB CRUD operations against a real SQLite database)
- **Frontend:** No tests exist

**Integration Tests:**
- **Backend:** Only test (`test_hierarchy_crud`) tests the Property+Hierarchy model integration with the database
- **Frontend:** No tests exist

**E2E Tests:**
- Not used in either stack

## Common Patterns

### Backend Patterns

**Running a single test:**
```bash
pytest tests/test_hierarchy.py::test_hierarchy_crud -v
```

**Running with print output visible:**
```bash
pytest -s tests/
```

### Frontend Setup (`setupTests.js`)
```javascript
// frontend/src/setupTests.js
import '@testing-library/jest-dom';
```
This is auto-detected by `react-scripts` and runs before every test file.

## Test Coverage Gaps

### Backend

| Untested Area | Files | Risk | Priority |
|--------------|-------|------|----------|
| All API route handlers | `backend/app/routes/*.py` (9 route files) | API endpoints could break without notice | High |
| Auth/authentication | `backend/app/routes/auth.py`, `backend/app/utils/jwt.py` | Security-critical code untested | High |
| Image utilities | `backend/app/utils/image_utils.py` | File system operations untested | Medium |
| All Pydantic schemas | `backend/app/models/*.py` | Validation logic untested | Medium |
| Database session/Dependency injection | `backend/app/db/session.py` | `get_db_session` generator untested | Low |
| Migration scripts | `backend/scripts/*.py` | Schema changes untested | Medium |

The entire API surface is untested. The only test covers one model's CRUD path.

### Frontend

| Untested Area | Files | Risk | Priority |
|--------------|-------|------|----------|
| All React components | All `.jsx` and `.js` in `frontend/src/components/` | No tests for any component | High |
| Redux reducers | `frontend/src/redux/*.js` (6 reducers) | State mutations untested | High |
| Redux thunks (API layer) | `frontend/src/redux/*.js` (thunks in 5 files) | API integration untested | High |
| Custom hooks | `frontend/src/hooks/useLocalStorageWithTTL.js` | Browser storage logic untested | Medium |
| Context providers | `frontend/src/context/Modal/Modal.jsx` | Modal state management untested | Medium |
| Utility functions | `frontend/src/functions/search/search.js` | Nominatim API integration untested | Medium |

The entire frontend has **zero tests** despite the testing infrastructure (`@testing-library/*`, `setupTests.js`) being fully installed.

## Recommendations

1. **Add conftest.py** with a reusable `TestSessionLocal` and `db` fixture for backend tests
2. **Use FastAPI TestClient** with dependency overrides for route handler tests
3. **Add unit tests for Pydantic schemas** — input validation boundaries
4. **Add reducer tests** — Redux reducers are pure functions, easy to test
5. **Add component smoke tests** — verify each component renders without error
6. **Implement test factories** for model data to reduce duplication
7. **Consider pytest-cov** for coverage measurement
8. **Fix stub reducers** (`users.js`, `floors.js`, `images.js`) before testing them — they currently return `undefined`

---

*Testing analysis: 2026-05-28*
