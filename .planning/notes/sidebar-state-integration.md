# Note: Sidebar State Integration

- **Date:** 2026-04-22
- **Topic:** Point Property Sidebar Staging Strategy

## Context
The project is moving from transient right-click popups and modals (`ManagePointsModal`) to a persistent Right Sidebar for editing point properties (homes, apartments, units, etc.).

## Execution Strategy
- **Batch Editing:** The sidebar will modify local state (via existing `createdCanvasObject` / `onPointChange` or equivalent Redux/Local Storage mechanisms).
- **Persistence:** Changes are **not** saved to the database immediately. They remain in local storage/Redux staging until the global **"Save All"** button is clicked.
- **Selection Persistence:** The sidebar handles multiple edits across many points. Switching between points in the sidebar (by clicking on the map or left-nav) simply changes the view context without clearing unsaved changes for other points.
- **Cleanup:** No "Do you want to save?" prompts. Edits persist in local storage until explicitly saved or the session decays/is cleared.
