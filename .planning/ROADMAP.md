# Project Roadmap: Home Tools v2

## Milestone 1: Editor Stabilization & Property Intel
Current primary focus is finalizing the data capture layer and streamlining the editor experience.

### Phase 1: Property Details Sidebar (COMPLETED)
**Goal:** Replace map popups and modals with a premium, slide-out sidebar for point editing.
- **Depends on:** N/A
- **UAT:** Clicking any point on map or left-nav opens sidebar; edits persist to "Save All" staging.

### Phase 2: Database Layer Consolidation (ACTIVE)
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

### Phase 7: File Tree, Floors, and Notes UI

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 6
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 7 to break down)

---
## Backlog
999.x items will be added here as deferred work.

### Phase 999.1: Redis-powered Autosave for large Property Hierarchies (BACKLOG)

**Goal:** Implement Redis-backed autosave patching for the new hierarchical File Tree to reduce network load from the global 'Save All' button.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: Complete Type Conversion and Data Persistence Stabilization (BACKLOG)

**Goal:** Resolve remaining duplicate marker bugs when shifting between 'Property' and 'Point' categories. Ensure hierarchical data (Floors/Notes) is strictly preserved across all conversions.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (Refine conversion logic discussion required)
- [ ] Fix ID prefix collision causing ghosts
- [ ] Implement recursive data cloning for nested hierarchies
