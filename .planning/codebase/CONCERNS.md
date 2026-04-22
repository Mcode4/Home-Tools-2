# Concerns: Home-Tools-2

Key issues, potential technical debt, and improvement areas.

## Technical Debt: Dual Database Logic
The codebase current manually branches between Postgres and SQLite across many route files. This leads to:
- **Duplicated Logic**: Similar SQL queries written for two different dialects.
- **Maintenance Overhead**: Any schema change must be applied and tested in both paths.
- **Risk of Desync**: Errors may exist in one path (prod) that don't appear in dev.
- **Solution**: Migrate to an ORM (SQLAlchemy/SQLModel) to provide a unified data access layer.

## Security: Plaintext Secrets
The `docker-compose.yml` contains hardcoded passwords and secrets (e.g., `POSTGRES_PASSWORD: strongpassword`).
- **Risk**: Secrets committed to version control.
- **Solution**: Move to an `.env` file excluded from git or use Docker Secrets.

## Testing Coverage
As documented in `TESTING.md`, the backend lacks a formal testing framework.
- **Risk**: Regressions in core application logic (user/team/property management).
- **Solution**: Implement `pytest` and basic unit/integration tests for critical API routes.

## Deployment / CI/CD
No evidence of automated deployment pipelines or CI checks.
- **Impact**: Manual deployment process increases risk of human error.
- **Solution**: Implement GitHub Actions for linting and test execution.
