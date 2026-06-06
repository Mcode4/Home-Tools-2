# Home Tools 2

## What This Is

A property management and mapping tool with a React frontend (MapLibre GL maps, hierarchy editor) and FastAPI backend (PostgreSQL, JWT auth). Users can create properties with multi-floor/room layouts, annotate maps with markers, and generate rendered views.

## Core Value

Users can visually manage property data on an interactive map with hierarchical floor/room organization.

## Requirements

### Validated (existing codebase)

- ✓ User authentication (signup/login/logout with JWT) — existing
- ✓ Property CRUD with JSONB hierarchy — existing
- ✓ Map marker management with type-specific icons — existing
- ✓ Editor with staging/undo/redo and Save All — existing
- ✓ Render page with drawing tools — existing
- ✓ Image upload for properties — existing
- ✓ Responsive layout with dark / light / blueprint themes — existing
- ✓ Analytics tracking (Umami) — existing

### Active

- [ ] **CLEAN-01**: Remove 30+ debug console.log statements across all pages
- [ ] **CLEAN-02**: Remove dead imports / unused variables (eslint warnings)
- [ ] **CLEAN-03**: Implement stub Redux reducers (floors, images, users)
- [ ] **RENDER-01**: Render page — assets menu and properties menu panels
- [ ] **RENDER-02**: Render page — 2D addon tools
- [ ] **RENDER-03**: Render page — 3D addon tools (future)

### Out of Scope

- Multi-user collaboration / real-time sync
- Mobile native apps
- External API for third-party consumers

## Context

React SPA with FastAPI backend, PostgreSQL database, MapLibre GL maps, and Konva-based render canvas. The codebase has been reorganized — pages in `pages/`, shared components in `components/` (organized into Page, Forms, MapPageComponents, Popups, RenderPageComponents subfolders). Utility functions live in `functions/` (nominatim.js, map.js, validations.js, analytics.js). Staging/undo/redo logic is extracted into `hooks/mapHooks.js`. MapPage itself is broken into ToolPanel and DetailPanel sub-components. Umami analytics is running in Docker for event tracking.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pages in `pages/`, components in `components/` | Clean separation of concerns | ✓ Good |
| Custom hooks for staging logic | Reduced MapPage from 1211 to 132 lines | ✓ Good |
| Umami for analytics | Lightweight, self-hosted, custom events | ✓ Good |

---
*Last updated: 2026-06-04 after phases 1-3*
