# Research: Property Details Sidebar Implementation

## Current State Analysis

### Modal-based Editor (`ManagePointsModal.jsx`)
- **State Management**: Uses local `useState` hooks for `name`, `location`, `icon`, `radius`, `type`, `length`, `unitList`, and `parentId`.
- **Initialization**: Hydrates state from `point` prop in a `useEffect`. Handles `(Unsaved)` prefixing logic.
- **Actions**:
  - `handleSubmit`: Collects form data, calls `changeFunc` (if saved) or `addFunc` (if new).
  - `handleDelete`: Calls `deleteFunc`.
- **Layout**: Conditional rendering based on `type` (home, apartment, unit, point, line, radius).

### Editor Page (`EditorPage.jsx`)
- **State**: Manages `properties`, `points`, `canvasObjects` dictionaries.
- **Sync**: `localStorage` automatic persistence.
- **Popup Logic**: `.popup-span` contains a `.popup` for "Map Layers".
- **Legacy UI**: `marker-context` (ContextMenu) and `hover-element` exist as separate divs.

## Proposed Technical Path

### 1. New Component: `PropertyDetailsSidebar`
- **Location**: `frontend/src/components/EditorPage/PropertyDetailsSidebar/`
- **Role**: Replaces `ManagePointsModal` content.
- **Architecture**:
  - Receives `selectedPoint`, `onUpdate`, `onDelete`, `isPinned`, `setIsPinned`.
  - Internal state synced with `selectedPoint` whenever it changes.
  - **Live Syncing**: Instead of a "Save" button in the form, every `onChange` event should trigger `onUpdate` to push changes to the parent's staged state (`properties` / `points` / `canvasObjects`). This fulfills the "Save All" requirement where edits are temporary until global save.

### 2. Header & Pinning
- **Template**: Mirror `.popup-controls` from `EditorPage.jsx`.
- **State**: `isPinned` (boolean) in `EditorPage.jsx`.
- **Logic**: 
  - If `!isPinned`, map clicks on empty space set `selectedPoint(null)`.
  - If `isPinned`, sidebar remains open, switching content only when another point is clicked.

### 3. "Unsaved" Indicator Logic
- **Detection**: A helper function `hasPendingChanges(point)` will compare the live `point` object (which may have been modified in local state) against the original version in the store (or check if it has the `(Unsaved)` flag in its name).
- **Implementation**: The pulsing amber dot will be a `CSS` animation tied to this boolean.
- **Sync**: Needs to be updated in both the Sidebar and the `EditorPage`'s left-nav list.

### 4. Layout Integration
- **CSS**: Convert `.popup-span` to `display: flex; flex-direction: column;`.
- **Flex**: "Map Layers" remains fixed size; Sidebar uses `flex: 1` with `overflow-y: auto`.

### 5. Cleanup Items
| Item | File | Action |
|------|------|--------|
| `marker-context` | `EditorPage.jsx` | Remove DOM element and `showPointContextMenu` function. |
| `hover-element` | `EditorPage.jsx` | Remove DOM element and `showDefaultHoverContext` function. |
| `ManagePointsModal` | `MapComponent.jsx` | Remove usage in Tooltip/Context menu. |
| `(Unsaved)` Text | `EditorPage.jsx` | Replace logic in list rendering with the amber dot component. |

## Validation Architecture

### Sidebar Form Validation
1. **Name Validation**: Required field. If empty, the indicator should turn red/error state, and global "Save All" should be blocked (or warned).
2. **Type-Specific Validation**:
   - `radius`: Must be a positive number.
   - `unit`: Must select a valid parent from the filtered list (already handled in `ManagePointsModal`).
3. **Staging Guard**: Changes are pushed to local state immediately (`onUpdate`), but we should maintain a `validationError` state in the sidebar to prevent invalid data from "poisoning" the local storage with corrupt schema.

## Reference Implementations
- **Glassmorphism**: `EditorPage.css` existing `.popup` class will be the base.
- **State Sync**: `EditorPage.jsx` `addCanvasObjects` / `signalPointUpdate`.
