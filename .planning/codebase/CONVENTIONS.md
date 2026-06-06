# Coding Conventions

**Analysis Date:** 2026-05-28

## Project Overview

This is a full-stack application with two languages/environments:

- **Backend:** Python 3.11 (FastAPI + SQLAlchemy 2.0 + Pydantic v2)
- **Frontend:** JavaScript (React 19 + Redux Toolkit + React Router v7)

Each follows its own set of conventions, detailed separately below.

---

## Backend — Python (FastAPI)

### Naming Patterns

**Files:**
- Snake case for all Python files: `db.py`, `image_utils.py`, `response_model.py`, `user_team.py`
- Route modules match the model name plural: `auth.py`, `users.py`, `points.py`, `floors.py`, `images.py`, `properties.py`
- Script files: `apply_hierarchy_schema.py`, `migrate_floors_to_hierarchy.py`

**Functions:**
- Snake case for all functions: `init_db()`, `get_db_session()`, `validate_password()`, `hash_password()`, `verify_password()`
- Private/helper functions defined at module level: `get_current_user`, `validate_point_data`, `verify_team_and_member`

**Variables:**
- Snake case throughout: `db_user`, `new_user`, `hashed_password`, `access_token`, `POSTGRES_URL`

**Classes:**
- PascalCase for all classes:
  - SQLAlchemy models: `User`, `Property`, `Team`, `Point`, `Floor`, `Image`, `HomeGroup`, `SavedType`, `Notification`, `Settings`, `UserTeam`
  - Pydantic schemas: `UserCreate`, `UserInfoSchema`, `PropertySchema`, `PointSchema`, `FloorSchema`, `TeamSchema`
  - Custom SQLAlchemy types: `PydanticType`

**Pydantic Schema suffix convention:**
- Each model file defines a Pydantic schema class with a `Schema` suffix: `HomeGroupSchema`, `SavedTypeSchema`, `ImageSchema`, `SettingsUpdateSchema`
- Exception: `UserCreate` (no Schema suffix), `UserInfoSchema` (has suffix)
- Exception: Nested schemas in `property.py` use `Schema` suffix: `NoteSchema`, `DimensionSchema`, `RoomSchema`, `FloorNodeSchema`, `HierarchySchema`

**Model + Schema pairs (one file per domain):**
- `backend/app/models/user.py` → `User` (ORM) + `UserCreate`, `UserInfoSchema` (Pydantic)
- `backend/app/models/point.py` → `Point` (ORM) + `PointSchema` (Pydantic)
- `backend/app/models/property.py` → `Property` (ORM) + `PropertySchema` (Pydantic)
- Each file contains both the SQLAlchemy model and its corresponding Pydantic input/output schema(s)

### Code Style

**Formatting:**
- No explicit formatter detected (no `pyproject.toml` with black/isort config, no `.prettierrc` for Python)
- Inconsistent spacing around operators and after commas in some files
- Maximum line length appears to be ~100 characters (informal)

**Linting:**
- No linting configuration detected (`pyproject.toml`, `setup.cfg`, `.flake8`, `tox.ini` not found)

### Import Organization

**Order observed in route files:**
1. Standard library: `import os`, `import json`
2. Third-party framework: `from fastapi import ...`, `from sqlalchemy.orm import ...`
3. Local application: `from app.db.session import ...`, `from app.models.xxx import ...`, `from app.routes.auth import ...`

**Common import block (every route file):**
```python
import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from app.db.session import get_db_session
from app.models.xxx import Xxx, XxxSchema
from app.models.response_model import ResponseModel
from app.routes.auth import get_current_user
```

**Pattern: every route file has this header block:**
```python
load_dotenv()
PROJECT_ENV = os.environ.get("PROJECT_ENV", "development")
router = APIRouter(prefix="/xxx", tags=["Xxx"])
```

### Route Conventions

**Router definition pattern:**
```python
router = APIRouter(prefix="/points", tags=["Points"])
```

**CRUD endpoint patterns:**
| Operation | HTTP Method | Path | Typical Response |
|-----------|-------------|------|-----------------|
| List all | `GET /all` | `@router.get("/all")` | `ResponseModel(True, "", {"items": items})` |
| Get by ID | `GET /{id}` | `@router.get("/{id}")` | `ResponseModel(True, "", {"item": item})` |
| Create | `POST ""` | `@router.post("")` | `ResponseModel(True, "msg", {"item": new_item})` |
| Update | `PATCH /{id}` | `@router.patch("/{id}")` | `ResponseModel(True, "msg", {"item": updated_item})` |
| Delete | `DELETE /{id}` | `@router.delete("/{id}")` | `ResponseModel(True, "msg")` |

**Dependency injection order for route handlers:**
```python
def create_point(
    point_schema: PointSchema,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
```

**Owner authorization pattern:**
```python
item = db.query(Model).filter(Model.id == id, Model.owner_id == current_user["id"]).first()
if not item:
    raise HTTPException(status_code=404, detail="Not found")
```

**Permission check pattern:**
```python
if prop.owner_id != current_user["id"]:
    raise HTTPException(status_code=403, detail="User does not have permission")
```

### Error Handling

**Primary pattern — try/except with rollback:**
```python
try:
    db.add(item)
    db.commit()
    db.refresh(item)
    return ResponseModel(True, "Created", {"item": item})
except IntegrityError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))
```

**Without try/except — direct check:**
```python
prop = db.query(Property).filter(Property.id == id).first()
if not prop:
    raise HTTPException(status_code=404, detail="Property not found")
```

**HTTPException usage:**
- Uses named status codes consistently: `HTTPException(status_code=400, detail=...)`, `HTTPException(status_code=404, detail=...)`, `HTTPException(status_code=401, detail=...)`, `HTTPException(status_code=403, detail=...)`
- Error details are string messages, not structured

**Response wrapper pattern:**
- All endpoints return `ResponseModel(success: bool, message: str, data: dict | None = None)` which is a factory function defined in `backend/app/models/response_model.py`
- Responses always include `success` and `message` fields, optional `data` field
- See: `backend/app/models/response_model.py`

### Database Conventions

**Session management:**
- `backend/app/db/session.py` defines `SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)`
- `get_db_session()` is a FastAPI generator dependency: creates session, yields it, closes in `finally`
- `Base = declarative_base()` defined in `session.py`

**Model patterns:**
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    # Relationships
    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
```

- `__tablename__` is always plural (except `Property` which uses `property`)
- Relationship `back_populates` used consistently (not `backref`)
- `cascade="all, delete-orphan"` on child relationships
- Timestamps use `func.now()` with `server_default` and `onupdate`

**Pydantic v2 serialization:**
- `model_dump(mode="json")` for serialization
- `model_validate(value)` for deserialization
- See `PydanticType` in `backend/app/models/property.py`

### Module Structure

**Package layout:**
```
backend/
  main.py                        # App entry — FastAPI() + CORS + include_router
  app/
    __init__.py                  # Empty
    db/
      __init__.py                # Empty
      base.py                    # Import all models so Base.has them
      db.py                      # init_db() — creates all tables
      session.py                 # engine, SessionLocal, Base, get_db_session()
    models/
      __init__.py                # Empty
      user.py, team.py, ...      # ORM + Pydantic per file
      response_model.py          # ResponseModel factory
    routes/
      __init__.py                # Aggregates all routers under APIRouter(prefix="/api")
      auth.py, points.py, ...    # Route handlers
    utils/
      __init__.py                # Empty
      image_utils.py             # upload_image(), delete_image()
      jwt.py                     # create_access_token(), decode_access_token()
      test.py                    # Debug utility (env path testing)
```

### Anti-Patterns Observed

**Inconsistent function name casing:**
- `get_current_user` starts as a function with unused parameters, then gets overwritten: `get_current_user = get_session_user` at line 171 of `backend/app/routes/auth.py`

**Password validation returns both boolean and raises:**
```python
def validate_password(plain_password):
    if condition:
        raise HTTPException(...)
    return True
```
Then callers need to check the return value, but it always raises on failure:
```python
if not validate_password(password):
    return  # Dead code — never reached because exception is raised
```

**Typing inconsistencies:**
- Some functions use modern `str | None` syntax (Python 3.10+): `access_token: str | None = Cookie(None)`
- Others use `Optional[str]` from typing
- Route handler parameters frequently lack type annotations on `current_user` and `db`

**Bare except clauses:**
- `except:` used in `backend/app/utils/jwt.py:28` (decode_access_token) and in route files for JSON parsing

**Late import inside function:**
- `from fastapi import Header` imported inside `get_current_user` function body (line 130 of `auth.py`)

---

## Frontend — JavaScript (React)

### Naming Patterns

**Files:**
- PascalCase for React components: `DashboardPage.jsx`, `PropertyForm.jsx`, `MapComponent.jsx`
- camelCase for utilities/hooks: `apiUtils.js`, `useLocalStorageWithTTL.js`, `search.js`
- Lowercase for non-component files: `store.js`, `setupTests.js`, `setupProxy.js`

**Component file pairs:**
```
ComponentName/
  index.js         # Re-export: import Component from "./Component"; export default Component;
  ComponentName.jsx # Actual component implementation
  ComponentName.css # Stylesheet (co-located)
```

**Note:** Some components have `.jsx` extensions (`DashboardPage.jsx`) while others are `.js` (`RenderHomePage/index.js` re-exports unknown extension). The majority of actual component implementations are `.jsx`.

**Functions:**
- camelCase for all functions: `handleSubmit`, `handleDelete`, `thunkGetAllProperties`, `loadProperties`
- PascalCase for React components: `function PropertyForm({id})`
- PascalCase for Redux action type constants (but using SCREAMING_SNAKE for the action constant variables): `const CREATE_PROPERTY = 'properties/createProperty'`

**Variables:**
- camelCase: `const searchAddress`, `const storedValue`, `const suggestionsActive`
- Boolean prefix convention: `active`, `loaded`, `reload`, `initialized`, `suggestionsActive`, `gridActive`

**Redux State Shape:**
- Reducers use `initialState` with either `{data: []}` or `{xxx: null}` pattern
- State is often flat: `store.properties.data` is an array; `store.session.user` is an object or null

### Code Style

**Formatting:**
- No `.prettierrc` found — `react-scripts` default formatting
- Inconsistent semicolon usage — some files use semicolons throughout, others omit them
- Example inconsistency: `backend/app/routes/auth.py` has clean style, while some JS files have mixed semicolon/no-semicolon

**Linting:**
- Configured via `package.json` `eslintConfig` key:
  ```json
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"]
  }
  ```
- No custom rules or `.eslintrc` file

### Import Organization

**Order observed in React components:**
1. React/Redux hooks: `import { useState, useEffect } from "react";`
2. Redux: `import { useSelector, useDispatch } from "react-redux";`
3. Router: `import { useNavigate } from "react-router-dom";`
4. Project modules: `import { thunkGetAllProperties } from "../../redux/properties";`
5. CSS: `import "./ComponentName.css";`

**Redux slices follow a three-part structure:**
1. Action type constants (SCREAMING_SNAKE)
2. Action creators (camelCase functions returning `{type, payload}`)
3. Thunks (async functions dispatching actions)
4. Reducer (switch statement)

### Component Patterns

**Functional components with useState/useEffect:**
```jsx
export default function ComponentName({ prop }) {
    const [state, setState] = useState(null);
    useEffect(() => {
        // effect logic
    }, [dependency]);
    return ( /* JSX */ );
}
```

**Redux usage pattern:**
```jsx
const properties = useSelector(store => store.properties);
const dispatch = useDispatch();
useEffect(() => {
    dispatch(thunkGetAllProperties());
}, [dispatch]);
```

**handleSubmit convention:**
```jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    // ...
};
```

**Error state pattern:**
```jsx
const [err, setErr] = useState({});
// Usage: {err.field && <p>{err.field}</p>}
```

**Modal context pattern:**
```jsx
import { useModal } from "../../context/Modal";
const { closeModal } = useModal();
```

### API Calls

**fetch-based with custom checkAndReturnRes wrapper:**
```javascript
export async function checkAndReturnRes(res) {
    const data = await res.json();
    let check = false;
    if(res.ok) {
        check = true;
    }
    return {ok: check, data};
}
```
Defined in `frontend/src/redux/apiUtils.js`.

**Thunk API call pattern:**
```javascript
export const thunkCreateProperty = (data) => async(dispatch) => {
    const res = await fetch('/api/property', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
        credentials: "include"
    });
    const check = await checkAndReturnRes(res);
    if(check.ok) {
        await dispatch(actionCreator(check.data.data.item));
    }
    return check.data;
};
```

**Credentials:** Always `"include"` for cookie-based auth.

### Error Handling

**Primary pattern:** Try/catch in thunks with console.log debugging:
```javascript
try {
    const res = await dispatch(thunkAction(data));
    if(res.success) {
        closeModal();
    } else {
        setErr({server: res.detail});
    }
} catch(err) {
    setErr({server: err});
}
```

**Console.log debugging is pervasive:**
- Used extensively throughout components and thunks for development
- `console.log("CHECK", check)`, `console.log("SUCCESS HOME DATA", deleteRes)`, etc.
- Not removed — this is development-stage code

### Redux Conventions

**Action type format:** `'domain/actionName'` (e.g., `'properties/createProperty'`)

**Reducer pattern:**
```javascript
export default function propertiesReducer(state = initialState, action) {
    switch(action.type) {
        case CREATE_PROPERTY:
            return {...state, data: [...state.data, action.payload]};
        case LOAD_PROPERTIES:
            return {...state, data: action.payload};
        case REMOVE_PROPERTY:
            return {...state, data: state.data.filter(p => p.id !== action.payload)};
        default:
            return state;
    }
}
```

**Store configuration:**
```javascript
export const reduxStore = configureStore({
    reducer: {
        session: sessionReducer,
        settings: settingsReducer,
        users: usersReducer,
        properties: propertiesReducer,
        floors: floorsReducer,
        images: imagesReducer,
        points: pointsReducer,
        savedTypes: savedTypesReducer
    }
});
```

### Anti-Patterns Observed

**Stub reducers:** Several reducer files have empty/missing `return` statements, returning `undefined`:
- `frontend/src/redux/users.js` — switch cases `return` with no value (lines 29, 31, 33)
- `frontend/src/redux/floors.js` — switch cases `return` with no value (lines 32, 34, 36, 38)
- `frontend/src/redux/images.js` — switch cases `return` with no value (lines 33, 35, 37, 39)

**Inconsistent semicolons across files:**
- Some files use semicolons consistently (e.g., `apiUtils.js`)
- Others omit them (e.g., `properties.js`)

**Heavy console.log usage throughout production code:**
- 50+ console.log statements across the frontend codebase

**Dead/commented code blocks:**
- Commented-out code in `PropertyForm.jsx` (lines 60-67, 142-143, 241-250)
- Commented-out root reducer in `store.js` (lines 12-18)

---

## Logging

**Backend:** No logging framework — uses `print()` statements in `main.py` and `db.py`
```
print("PROJECT ENV - MAIN", PROJECT_ENV)
print("Database models initialized via SQLAlchemy ORM.")
```

**Frontend:** Uses `console.log()` extensively for debugging throughout all files.

---

## Comments

**When to Comment:**
- Minimal JSDoc/docstrings found
- `useLocalStorageWithTTL.js` has JSDoc on the function
- `auth.py` has occasional inline comments: `# Password Helpers`
- Most code is self-documenting through naming

**JSDoc/TSDoc:**
- Rarely used. One example in `frontend/src/hooks/useLocalStorageWithTTL.js`

---

*Convention analysis: 2026-05-28*
