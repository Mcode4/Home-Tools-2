# TODO: Home-Tools-2 Completion Roadmap

This document tracks the remaining tasks needed to bring the project to a production-ready state.

## High Priority: Database Architecture
- [ ] **SQLAlchemy Transition**: Unify the database access layer. Currently, the project branches SQL logic between `sqlite3` and `psycopg2` in almost every route. Replacing this with an ORM (SQLAlchemy or SQLModel) will simplify code and reduce bugs.
- [ ] **Data Model Consolidation**: Use the unified ORM models for both development and production.

## High Priority: Quality & Reliability
- [ ] **Backend Testing**: Implement a test suite using `pytest`.
    - [ ] Unit tests for utility functions.
    - [ ] Integration tests for API routes.
    - [ ] Mock database for testing environment.
- [ ] **Error Handling**: Standardize error responses across the API.

## Medium Priority: Security & Performance
- [ ] **CORS Refinement**: Move allowed origins to a configurable list in `.env`.
- [ ] **Secret Management**: Ensure `.env` is properly managed and not committed (it is already in `.gitignore`).
- [ ] **Image Optimization**: Implement processing for uploaded images (resizing, compression).

## Medium Priority: Deployment
- [ ] **Production Configuration**: Finalize Nginx configurations for serving the React frontend.
- [ ] **CI/CD**: Set up GitHub Actions for automated test execution on PRs.

## Future Exploration
- [ ] Geospatial query optimization for property searches.
- [ ] Advanced notification features (push notifications, email integration).
