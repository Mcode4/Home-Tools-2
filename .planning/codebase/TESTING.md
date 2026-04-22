# Testing: Home-Tools-2

Current state of automated testing.

## Frontend
- **Framework**: Jest (via `react-scripts`).
- **Library**: `react-testing-library`.
- **Configuration**: `frontend/src/setupTests.js` is present.
- **Coverage**: Initial setup exists, though component-specific test density appears low.

## Backend
- **Framework**: No explicit test framework (like pytest) configuration file (e.g., `pytest.ini` or `conftest.py`) was found in the root or `backend/`.
- **Utility**: `backend/app/utils/test.py` exists but its usage is unclear (seems like a scratch script or manual test helper).
- **Status**: Identified as a major gap; backend functional testing is a priority for future updates.

## Integration / E2E
- None implemented in the current codebase.
