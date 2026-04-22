# Architecture: Home-Tools-2

High-level architecture of the Home-Tools-2 system.

## Pattern: Client-Server
The project follows a standard decoupled Client-Server architecture.
- **Client**: Single Page Application (SPA) built with React.
- **Server**: RESTful API built with FastAPI.

## Containerization
The entire system is orchestrating using Docker Compose, separating services into isolated networks:
- **db**: Data persistence layer.
- **backend**: Application logic layer.
- **frontend**: User interface layer.
- **adminer**: Management layer.

## Frontend State Management
- Uses **Redux Toolkit** for predictable state updates and cross-component data sharing.
- **Context API** is used specifically for UI-level modals and popups.

## Multi-Database Support (Environment Specific)
The backend architecture supports two database types depending on the `PROJECT_ENV` environment variable:
1. **Production Mode**: Uses PostgreSQL for reliability and performance.
2. **Development Mode**: Uses SQLite for low-overhead local development.

## Authentication Flow
- **JSON Web Tokens (JWT)**: Secure authentication handled by the backend.
- **Roles**: User-team relationships define permissions.
