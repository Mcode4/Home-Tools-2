# Project Roadmap: Home Tools v2

## Milestone 1: Editor Stabilization & Property Intel
Current primary focus is finalizing the data capture layer and streamlining the editor experience.

### Phase 1: Property Details Sidebar (ACTIVE)
**Goal:** Replace map popups and modals with a premium, slide-out sidebar for point editing.
- **Depends on:** N/A
- **UAT:** Clicking any point on map or left-nav opens sidebar; edits persist to "Save All" staging.

### Phase 2: Database Layer Consolidation
**Goal:** Transition from raw SQL/branching logic to a unified SQLAlchemy/SQLModel ORM.
- **Depends on:** N/A (Can run parallel or after Phase 1)
- **UAT:** All CRUD operations use unified models; backend tests pass.

## Milestone 2: Rendering & Visualization
Moving from points on a map to structural representation.

### Phase 3: 2D Room Outlining
**Goal:** Implement vector-based room drawing and outline tools in the Render Page.

### Phase 4: 3D Item Storage Integration
**Goal:** Build out the 3D rendering layer for item storage and spatial visualization.

## Milestone 3: Professional Suite & Polish
Finalizing the product for end-user delivery.

### Phase 5: Export System (JSON/PDF)
**Goal:** Generate professional home inspection reports based on captured map/render data.

### Phase 6: Final Polish & Dashboard
**Goal:** Cleanup dashboard, user profiles, and 404 pages. Stabilization of overall UX.

---
## Backlog
999.x items will be added here as deferred work.
