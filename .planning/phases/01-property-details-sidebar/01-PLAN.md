# Phase 1: Property Details Sidebar - Plan

Transition the property editor to a persistent right-hand sidebar with glassmorphic aesthetics and live staging.

## User Review Required

> [!IMPORTANT]
> This change replaces all right-click and hover-based menus with a single persistent sidebar. Ensure that user workflows that relied on quick right-click actions are adequately covered by the new selection + sidebar model.

## Proposed Changes

### [NEW] Component: PropertyDetailsSidebar
#### [NEW] [PropertyDetailsSidebar.jsx](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/PropertyDetailsSidebar/PropertyDetailsSidebar.jsx)
#### [NEW] [PropertyDetailsSidebar.css](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/PropertyDetailsSidebar/PropertyDetailsSidebar.css)
#### [NEW] [UnsavedIndicator.jsx](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/PropertyDetailsSidebar/UnsavedIndicator.jsx)

### [MODIFY] Component: EditorPage
#### [MODIFY] [EditorPage.jsx](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/EditorPage.jsx)
#### [MODIFY] [EditorPage.css](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/EditorPage.css)

### [MODIFY] Component: MapComponent
#### [MODIFY] [MapComponent.jsx](file:///home/user/Documents/projects/Home-Tools-2/frontend/src/components/EditorPage/Map/MapComponent.jsx)

---

## Tasks

### Wave 1: Foundation & Core UI

<task wave="1">
<read_first>frontend/src/components/EditorPage/EditorPage.css</read_first>
<action>
Create `PropertyDetailsSidebar.jsx` and `PropertyDetailsSidebar.css`. 
Implement the Glassmorphism base styles (16px blur, 70% opacity backgrounds, shimmer border) as defined in UI-SPEC.
</action>
<acceptance_criteria>
- `PropertyDetailsSidebar.jsx` exists and renders a test container.
- CSS uses `backdrop-filter: blur(16px)` and `rgba` backgrounds.
</acceptance_criteria>
</task>

<task wave="1">
<read_first>frontend/src/components/EditorPage/EditorPage.jsx</read_first>
<action>
Create `UnsavedIndicator.jsx`. 
Implement the pulsing amber dot (`#f59e0b`) with a glowing box-shadow and opacity animation.
</action>
<acceptance_criteria>
- Grep `#f59e0b` and `box-shadow` in `UnsavedIndicator.css` or style block.
- Component renders a small 6x6 circle.
</acceptance_criteria>
</task>

### Wave 2: Integration & Pinning

<task wave="2">
<read_first>frontend/src/components/EditorPage/EditorPage.jsx</read_first>
<action>
In `EditorPage.jsx`, add `selectedPoint` and `isPinned` to the component state.
Modify `.popup-span` in `EditorPage.css` to use `display: flex; flex-direction: column;`.
Insert `PropertyDetailsSidebar` as a child of `.popup-span`.
</action>
<acceptance_criteria>
- `EditorPage.jsx` contains `useState` for `selectedPoint` and `isPinned`.
- `.popup-span` uses flexbox layout.
- Grep `PropertyDetailsSidebar` inside `EditorPage.jsx`.
</acceptance_criteria>
</task>

<task wave="2">
<read_first>frontend/src/components/EditorPage/EditorPage.jsx</read_first>
<action>
Implement selection logic:
1. Pass `selectedPoint` and `setSelectedPoint` callbacks to `MapComponent`.
2. Map clicks on markers update `selectedPoint`.
3. If `!isPinned`, clicking empty map space sets `selectedPoint` to `null`.
Implement the header toggle for `isPinned`.
</action>
<acceptance_criteria>
- Sidebar opens on map marker click.
- Sidebar closes on empty map click only when `isPinned` is `false`.
</acceptance_criteria>
</task>

### Wave 3: Data Migration & Live Sync

<task wave="3">
<read_first>frontend/src/components/ManagePointsModal/ManagePointsModal.jsx</read_first>
<action>
Port form fields (Name, Type, Radius, Units, Parent Connection) from `ManagePointsModal` to `PropertyDetailsSidebar`.
Ensure the sidebar correctly handles different point types (home, apartment, unit, etc.).
</action>
<acceptance_criteria>
- Sidebar displays input fields appropriate for the selected point type.
- Form fields match the UI-SPEC (inset background, indigo focus).
</acceptance_criteria>
</task>

<task wave="3">
<read_first>frontend/src/components/EditorPage/EditorPage.jsx</read_first>
<action>
Hook up sidebar `onChange` events to update the parent’s staged state (e.g., using `addCanvasObjects` or `signalPointUpdate`).
The sidebar should not have its own Save button; changes should be reflected in the global staging state immediately upon input.
</action>
<acceptance_criteria>
- Modifying a field in the sidebar updates the map marker's tooltips or attributes immediately.
- Grep callback passing from `EditorPage` to `PropertyDetailsSidebar`.
</acceptance_criteria>
</task>

### Wave 4: Cleanup & Feedback

<task wave="4">
<read_first>frontend/src/components/EditorPage/EditorPage.jsx</read_first>
<action>
Update the Left Sidebar (Maps Menu) in `EditorPage.jsx`.
Replace the `(Unsaved)` text logic with the `UnsavedIndicator` component.
Ensure the indicator pulses precisely when the point has staged changes.
</action>
<acceptance_criteria>
- string `(Unsaved)` is removed from `EditorPage.jsx` render sections.
- `UnsavedIndicator` is visible in the list items for modified points.
</acceptance_criteria>
</task>

<task wave="4">
<read_first>frontend/src/components/EditorPage/PropertyDetailsSidebar/PropertyDetailsSidebar.jsx</read_first>
<action>
Implement the sticky Delete button with confirmation footer.
Clicking "Delete" should swap the button for "Cancel" and "Confirm" buttons.
"Confirm" triggers the existing `deleteFunc` callback.
</action>
<acceptance_criteria>
- Sidebar footer contains a sticky button.
- Interaction swap logic exists (state for `confirmingDelete`).
</acceptance_criteria>
</task>

<task wave="4">
<read_first>frontend/src/components/EditorPage/EditorPage.jsx</read_first>
<action>
Final Cleanup:
1. Remove `marker-context` div and associated `showPointContextMenu` / `hideContextMenu` logic.
2. Remove `hover-element` div and `showDefaultHoverContext` logic.
3. Remove legacy `useEffect` listeners for context menu closing.
</action>
<acceptance_criteria>
- Grep `marker-context` and `hover-element` returns no results in `EditorPage.jsx`.
- Right-clicking a marker no longer opens the custom menu.
</acceptance_criteria>
</task>

---

## Verification Plan

### Automated Verification
- `ls` checks for the new components.
- `grep` checks for the removal of legacy logic in `EditorPage.jsx` and `MapComponent.jsx`.

### Manual Verification
- **Aesthetics**: Verify glassmorphism (blur/shimmer) via visual check.
- **Pinning**: Verify sidebar persistence when pinned.
- **Live Staging**: Verify edits persist across selections and are committed by "Save All".
- **Safety**: Verify "Are you sure?" confirmation before point deletion.
