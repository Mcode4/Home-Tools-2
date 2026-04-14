# Testing Patterns
**Analysis Date:** 2026-04-14

## Test Framework
**Runner:**
- Frontend: Jest (via `react-scripts test` in `frontend/package.json`).
- Backend: Not explicitly configured. A standalone `backend/app/utils/test.py` exists but no framework (like pytest) is defined in `requirements.txt`.

**Assertion Library:**
- Frontend: `@testing-library/jest-dom` and `@testing-library/react`.

**Run Commands:**
```bash
cd frontend && npm test # Run frontend tests
```

## Test File Organization
**Location:**
- Frontend: `frontend/src/setupTests.js` is present. Tests are expected to be co-located or in `__tests__` directories (though none were explicitly found in the initial glob).
- Backend: Ad-hoc testing in `backend/app/utils/test.py`.

## Test Structure
**Suite Organization:**
Not enough test files found to determine a consistent suite pattern.

## Mocking
**Framework:**
- Frontend: Jest's built-in mocking capabilities are available.

## Fixtures and Factories
**Test Data:**
Not detected.

## Coverage
**Requirements:** None enforced.

## Test Types
**Unit Tests:**
- Frontend: Component-level testing using React Testing Library.
- Backend: Manual/Ad-hoc unit testing in `test.py`.

**Integration Tests:**
- Not explicitly detected.

**E2E Tests:**
- Not used.

## Common Patterns
**Async Testing:**
- Frontend: Standard `async/await` with `waitFor` from React Testing Library.

**Error Testing:**
- Backend: Route handlers explicitly raise `HTTPException` which can be tested via `FastAPI.testclient`.
---
*Testing analysis: 2026-04-14*
