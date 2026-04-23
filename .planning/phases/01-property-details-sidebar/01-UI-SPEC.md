# Phase 1: Property Details Sidebar UI-SPEC

## 1. Visual Language & Aesthetics (Glassmorphism)
- **Theme**: Premium "Frosted" aesthetic optimized for both Dark and Light modes.
- **Glass Effects**:
  - **Backdrop**: `backdrop-filter: blur(16px) saturate(180%);`
  - **Background**: `rgba(15, 23, 42, 0.7)` (Slate-900 at 70% opacity for Dark Mode) or `rgba(255, 255, 255, 0.6)` (Light Mode).
  - **Border**: `1px solid rgba(255, 255, 255, 0.1)` (creates a "shimmer" edge).
- **Shadows**: Soft, multi-layered depth: `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 20px 25px -5px rgb(0 0 0 / 0.1);`
- **Typography**:
  - **Font Stack**: `Inter, system-ui, -apple-system, sans-serif;`
  - **Sizes**: 
    - Title: 14px (Semi-bold, Tracking tight)
    - Labels: 11px (Medium, All-caps, Character spacing 0.05em)
    - Input Text: 13px (Regular)

## 2. Layout & Overlay Logic
- **Parent Container**: `.popup-span`
  - Strategy: Use `flexbox` to stack popups vertically.
  - `display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 40px); margin: 20px;`
- **Property Sidebar Component**:
  - Location: Second child of `.popup-span`.
  - Height: `flex-grow: 1;` (Ensures it occupies all space not used by the Map Layers popup).
  - Overflow: `overflow-y: auto;` with a custom thin scrollbar.

## 3. Component Design

### A. Pinning Header (`.popup-controls` mirror)
- **Design**: A clean bar at the top with a divider below.
- **Title Section**: Left-aligned, displays the current selected point type (e.g., "Apartment Details").
- **Pin Toggle**: 
  - Visual: A small pin icon (`lucide-pin` or similar).
  - **State - Unpinned (Default)**: Outline icon, gray color.
  - **State - Pinned**: Solid icon, Indigo color (`#6366f1`), subtle outer glow.
- **Behavior**: Clicking the pin toggle locks the sidebar open.

### B. "Unsaved" Indicator (The "Live" Dot)
- **Visual**: A 6x6px circular dot.
- **Color**: Amber-500 (`#f59e0b`).
- **Effect**: `box-shadow: 0 0 8px #f59e0b;` with a pulsing animation (`opacity: 0.6` to `1.0`).
- **Placement**:
  - **Sidebar**: Placed immediately to the right of the Title in the header.
  - **Maps Menu (Left Sidebar)**: Replaces the `(Unsaved)` text. Vertically centered next to the item label.

### C. Input Fields & Controls
- **Form Fields**: 
  - Background: `rgba(255, 255, 255, 0.05)` (inset look).
  - Border: `1px solid rgba(255, 255, 255, 0.1)`.
  - Focus: Border color shifts to Indigo (`#6366f1`) with 0.2 opacity rings.
- **Labels**: Muted gray (`#94a3b8`), positioned above the input.

### D. Delete Action (Footer)
- **Position**: Sticky to the bottom of the sidebar.
- **Button Style**: 
  - Default: Transparent background, Red-500 text, thin border.
  - Hover: Background Red-500 (`#ef4444`), White text.
- **Confirmation State**:
  - On click, the button expands or swaps with a "Are you sure? [Cancel] [Confirm]" dual-button layout to prevent accidental deletions.

## 4. Spacing & Grid System
- **Unit**: 4px base grid.
- **Padding**: 16px (Interior padding), 12px (Header/Footer padding).
- **Corner Radius**: 12px for the main container, 8px for internal elements (inputs/buttons).

## 5. Interactions
- **Context Switch**: When selecting a new point on the map, the sidebar content fades out and in (`opacity: 0 -> 1` over 200ms) with new data.
- **Hover States**: Components slightly brighten or increase blur on hover to reinforce the glass effect.
