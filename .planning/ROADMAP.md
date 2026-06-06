# Roadmap: Home Tools 2

## Phase 1: Page Reorganization
**Goal:** Move page components from `components/` into `pages/` directory
**Status:** ✓ Complete
**Requirements:** (infrastructure — no REQ-IDs)
**Plans:** 5/5 ✓

**Success Criteria:**
1. All page components exist in `frontend/src/pages/` with barrel exports
2. Router imports point to `pages/` instead of `components/`
3. Frontend build passes

---

## Phase 2: Import Audit & Cleanup
**Goal:** Remove dead code, fix stale imports, clean up unused files
**Status:** ✓ Complete
**Requirements:** (infrastructure — no REQ-IDs)
**Plans:** 3/3 ✓

**Success Criteria:**
1. Dead page directories removed from `components/`
2. `createPointMarker.js` deleted from both locations
3. Unused imports (`combineReducers`, `DEMO_BACKEND_API`) removed
4. Frontend build passes

---

## Phase 3: Component Restructuring
**Goal:** Reorganize components into logical subfolders, extract utilities and hooks, split MapPage
**Status:** ✓ Complete
**Requirements:** (infrastructure — no REQ-IDs)
**Plans:** (executed inline)

**Success Criteria:**
1. Components organized into Page, Forms, MapPageComponents, Popups, RenderPageComponents
2. Cartographic utilities extracted to `functions/map.js`
3. Staging/undo/redo logic extracted to `hooks/mapHooks.js`
4. `validatePoint` extracted to `functions/validations.js`
5. MapPage ToolPanel + DetailPanel extracted
6. Umami analytics running with custom event tracking

---

## Phase 4: Code Cleanup
**Goal:** Remove debug logging, dead code, and implement stub reducers
**Status:** ○ Pending
**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03

**Success Criteria:**
1. No console.log/console.error statements in production code (except intentional error logging)
2. No unused import or variable ESLint warnings
3. `redux/floors.js`, `redux/images.js`, `redux/users.js` have proper reducer logic
4. Frontend build passes with zero warnings

---

## Phase 5: Render Page Enhancements — 2D Tools
**Goal:** Build out the render page with assets panel, properties panel, and 2D shape tools
**Status:** ○ Pending
**Requirements:** RENDER-01, RENDER-02, RENDER-03, RENDER-04

**Success Criteria:**
1. Assets menu panel shows available drawing primitives (rectangle, circle, polygon)
2. Properties menu panel shows selected item's properties (position, size, color)
3. User can add 2D shapes to the render canvas via click-drag
4. User can select, move, resize, rotate, and delete placed shapes
5. User can change shape properties (fill color, stroke, opacity) via properties panel

---

## Phase 6: Objects Stage + 3D Render
**Goal:** Enable the Objects stage (stage 3) for furniture placement and the 3D Render stage (stage 4) using Three.js
**Status:** ○ Pending
**Requirements:** RENDER-05
**Plans:** 7 plans

**Plans:**
- [ ] 06-01-PLAN.md — Install Three.js deps, create useObjectsHistory hook, enable Objects stage button
- [ ] 06-02-PLAN.md — Furniture catalog data (6 categories, 18+ items) and ObjectsTab UI
- [ ] 06-03-PLAN.md — ThreeCanvas with OrthographicCamera, RoomWalls extrusion, dual-canvas CSS
- [ ] 06-04-PLAN.md — useObjectsPlacement hook, GhostPreview, FurnitureObject, RoomBoundary utils
- [ ] 06-05-PLAN.md — ObjectProperties panel, selection/drag/rotate/delete, RenderPage wiring
- [ ] 06-06-PLAN.md — 3D Render stage: PerspectiveCamera, GLB loading, enhanced lighting/shadows
- [ ] 06-07-PLAN.md — Persistence: API load/save, localStorage TTL, undo/redo verification

**Success Criteria:**
1. Objects stage (stage 3) is active with furniture catalog, placement mode, ghost preview, room snapping
2. Placed objects render as 3D meshes in Three.js canvas layered on Konva floor grid
3. Objects can be selected, dragged within rooms, rotated, and deleted
4. Properties panel shows object position, rotation, size, color, room assignment
5. 3D Render stage (stage 4) provides perspective camera walkthrough with shadows
6. GLB/GLTF models load for user-uploaded furniture
7. Objects persist via API (objects_data column) and localStorage (6h TTL)
8. Undo/redo works for all object operations

## Phase 5.1: Outline Stage Enhancements — Boolean ops, vertex editing, templates, import/export, validation, geocoding, snapping/measurements

**Goal:** Extend the Outline stage with advanced tools: boolean operations, vertex editing, templates, import/export, validation, geocoding, and snapping/measurements
**Requirements:** (infrastructure — no REQ-IDs)
**Depends on:** Phase 5
**Plans:** 5 plans

**Plans:**
- [ ] 05.1-01-PLAN.md — Reorganize ShapesTab menu, create parametric template generators, add offset/buffer controls
- [ ] 05.1-02-PLAN.md — Build TemplateTab with save/load/delete, GeoJSON/DXF import, GeoJSON/SVG/PDF export, copy/paste
- [ ] 05.1-03-PLAN.md — Implement multi-select (Ctrl+click), vertex editing mode, boolean operations (Union/Subtract/Intersect)
- [ ] 05.1-04-PLAN.md — Create validation engine (self-intersection, overlap, min-size), snapping settings, live measurements
- [ ] 05.1-05-PLAN.md — Add geocoding search, right-click placement, template→sections validation, final integration

**Success Criteria:**
1. ShapesTab reorganized with Primitives (Polygon first), Templates, Configure sections
2. TemplateTab with save/load/delete, GeoJSON/DXF import, GeoJSON/SVG/PDF export
3. Multi-select with Ctrl+click and boolean operations (Union, Subtract, Intersect)
4. Vertex editing mode with add/remove/chamfer/fillet on polygons
5. Validation engine detects self-intersections, overlaps, min-size violations
6. Snapping settings (grid, edge, alignment) with keyboard shortcuts G/E/A
7. Geocoding search centers map, right-click places outline with reverse geocode
8. Live measurements with metric/imperial toggle
9. Template→sections validates room areas > 0 and no orphan spaces

---

## Summary

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Page Reorganization | ✓ Complete | — |
| 2 | Import Audit & Cleanup | ✓ Complete | — |
| 3 | Component Restructuring | ✓ Complete | — |
| 4 | Code Cleanup | ○ Pending | CLEAN-01, CLEAN-02, CLEAN-03 |
| 5 | Render Page — 2D Tools | ○ Pending | RENDER-01 to RENDER-04 |
| 5.1 | Outline Stage Enhancements | ○ Pending | (infrastructure) |
| 6 | Objects Stage + 3D Render | ○ Pending | RENDER-05 |

**10 requirements** across **4 pending phases** | All v1 requirements covered ✓
