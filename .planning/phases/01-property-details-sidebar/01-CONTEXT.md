# Context: Property Details Sidebar

## Phase Goal
Replace map popups and modals with a premium, slide-out sidebar for point editing that integrates with the existing overlay system.

## Decisions

### Layout & UI
- **Container:** Lives inside `.popup-span`. It will be a second `.div.popup` positioned under the "Map Layers" popup.
- **Sizing:** Must dynamically fill the remaining height of the `.popup-span`.
- **Header:** Mirrors `.popup-controls` design, including a **Pin Toggle**.
- **Indicator:** Implement a premium visual indicator for "Unsaved" state (e.g., status dot, highlight, or high-end icon) to replace the current `(Unsaved)` text. This applies to both the sidebar and the Left Sidebar "Maps Menu".

### Interaction & Behavior
- **Pinned State:**
  - **Unpinned (Default):** Sidebar closes when clicking empty map space.
  - **Pinned:** Sidebar stays open; clicking other points updates the sidebar content but keeps the panel visible.
- **Selection:** Triggered by clicks on map markers or selection in the Left Sidebar list.

### Actions
- **Saving:** No local save button. Sidebar modifications must signal the existing global staging state which is committed by the main "Save All" button.
- **Deletion:** A "Delete" button at the bottom of the sidebar.
- **Safety:** Use an "Are you sure?" confirmation (modal or inline) before proceeding with deletion.

## Technical Scope
- Transition logic from `ManagePointsModal` fields into the new sidebar.
- Remove legacy `marker-context` (right-click menu) and `hover-element` tooltip.

## Canonical Refs
- [EditorPage.jsx](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/EditorPage.jsx)
- [MapComponent.jsx](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/Map/MapComponent.jsx)
- [REQUIREMENTS.md](file:///home/user/Documents/projects/Home-Tools-2/.planning/REQUIREMENTS.md)
