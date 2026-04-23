# Validation Strategy: Phase 1 (Property Details Sidebar)

## Overview
This phase transitions property management from transient modals to a persistent sidebar. Validation must ensure that staged edits are accurate, visually indicated, and safely removable.

## Dimension 8: Nyquist Validation Criteria

### 8.1. Layout & Responsiveness (Visual Verification)
- **Criterion**: The sidebar must appear within `.popup-span`, below the Map Layers popup.
- **Test**: Open the editor, select a point. Verify the sidebar occupies the vertical space between the Map Layers popup and the bottom of the screen.
- **Verification**: Browser subagent check of `.popup` children within `.popup-span`.

### 8.2. Pinning Logic (State Verification)
- **Criterion**: Unpinned sidebar must close on empty map click. Pinned sidebar must remain open.
- **Test**:
  1. Click point -> Sidebar opens.
  2. Click empty map -> Sidebar closes.
  3. Click point -> Sidebar opens.
  4. Toggle "Pin" on.
  5. Click empty map -> Sidebar remains open.
- **Verification**: Map click event propagation and `selectedPoint` state check.

### 8.3. Live Staging (Data Verification)
- **Criterion**: Changes in the sidebar must update `localStorage` staged state without triggering a database `PUT/POST`.
- **Test**: Modify a point name in the sidebar. Refresh page. Verify name persists in sidebar/list but is NOT reflected in a direct database query (if inspected via DevTools).
- **Verification**: `localStorage` key `properties`/`points` check.

### 8.4. "Unsaved" Indicator (Feedback Verification)
- **Criterion**: Premium pulsing amber dot must replace the legacy `(Unsaved)` text.
- **Test**: Edit a saved point. Verify the dot appears in the sidebar header AND the left-sidebar list item.
- **Verification**: CSS classes `.unsaved-dot` and `.pulsing` presence.

### 8.5. Safe Deletion (Modal/Confirm Verification)
- **Criterion**: Deletion must require confirmation.
- **Test**: Click "Delete" in sidebar. Verify an "Are you sure?" state or modal appears. Click "Cancel" -> Point remains. Click "Confirm" -> Point removed from map and list.
- **Verification**: Interaction flow check.

## Automated Verification Commands
```bash
# Verify component structure exists
ls frontend/src/components/EditorPage/PropertyDetailsSidebar/PropertyDetailsSidebar.jsx

# Grep for removal of legacy elements in EditorPage.jsx
! grep "marker-context" frontend/src/components/EditorPage/EditorPage.jsx
! grep "hover-element" frontend/src/components/EditorPage/EditorPage.jsx

# Check for new state in EditorPage.jsx
grep "selectedPoint" frontend/src/components/EditorPage/EditorPage.jsx
grep "isPinned" frontend/src/components/EditorPage/EditorPage.jsx
```

## Manual Verification (UAT)
1. **Selection Flow**: Verify selecting from the Left Sidebar "Maps Menu" also triggers the Right Sidebar.
2. **Glassmorphism Aesthetic**: Verify the "shimmer" border and background blur match the UI-SPEC description.
3. **Save All Sync**: Verify clicking the global "Save All" clears the amber indicators and persists all changes to the database.
