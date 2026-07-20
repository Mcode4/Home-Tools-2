# MapEditor Architecture & Vision

## Overview
The `MapEditor` is the core "vision-management" page for the application. It is designed for home inspectors, builders, and enthusiasts to prototype projects, track coordinates, update metadata, and manage spatial data.

The application is structured around three main pillars:
1. **MapEditor (Vision & Action):** The unified workspace for all map-related actions.
2. **RenderPage (Realization):** The 2D -> 3D building space where map footprints are visualized.
3. **Dashboard (Management):** The space for managing multiple Maps, Teams, and Personal settings.

## Design System
**CRITICAL:** All new elements, components, and layouts must strictly follow the project's **Tailwind CSS** and **Shadcn UI** design system. Legacy raw CSS files should be avoided in favor of Tailwind utility classes and Shadcn variables (e.g., `bg-card`, `text-foreground`, `border-border`) to ensure perfect compatibility with Light, Dark, and Blueprint themes.

---

## UI Layout & Components

### 1. Topbar (Header)
The Topbar handles global navigation, map switching, and high-level actions.
*   **Navigation:** Home button to return to the Dashboard.
*   **Map Switcher (NEW):** A dropdown component displaying the current map's name (e.g., "Smith Residence"). Clicking it allows users to quickly switch between other maps without leaving the editor.
*   **Search:** Shadcn input with Lucide icons for querying points/addresses.
*   **History:** Undo/Redo actions.
*   **Share/Team (NEW):** A button to invite team members or generate a read-only share link.

### 2. Sidebar (Left Panel)
The Sidebar is a constrained, flex-based panel that mounts only the active tab. It avoids legacy `.hidden` CSS DOM manipulation in favor of pure React conditional rendering.
*   **DrawTab (Creation):** Tools for dropping markers, drawing footprints, etc.
*   **DataTab (Current Map):** Lists all points and properties for the *current* active map.
*   **LayersTab (Data Management - NEW):** A new tab for overlaying multiple maps, toggling map/point visibility, and moving/combining points between different maps.
*   **AnalyticsTab (Optional - NEW):** A summary tab for calculations (total sq ft, number of issues marked).
*   **SettingsPanel:** Visual theme and map style configuration.

### 3. DetailPanel (Right Panel)
The Inspector panel. When a user clicks on a point or property in the map, this panel slides out to allow editing of exact coordinates, dimensions, and metadata.

---

## Database Architecture (Phase 1: Maps)

Currently, Points and Properties exist, but they need to be grouped logically into "Projects" or "Maps". 

### The `Map` Entity
Maps will become a core table in the database and act as the parent container for spatial data.

**Relationships:**
*   A User can have many Maps.
*   A Map can have many Points.
*   A Map can have many Properties.
*   (Future) A Team can share many Maps.

### Feature Roadmap

#### Phase 1: Database Foundation
*   Create the `Map` database model (id, name, description, owner_id, created_at).
*   Update `Point` and `Property` models to include a foreign key: `map_id`.
*   Update Redux slices and backend routes to fetch data based on the active `map_id`.

#### Phase 2: MapEditor Integration
*   Build the Topbar Map Switcher component.
*   Update the `MapEditor` to load the `activeMap` from state and restrict fetched points to that map.

#### Phase 3: Layers & Advanced Data Management
*   Build the `LayersTab` in the Sidebar.
*   Allow fetching secondary maps as overlays.
*   Implement drag-and-drop or select-and-move logic to transfer points between maps.

#### Phase 4: Team & Read-Only Views
*   Add permission levels (Owner, Editor, Viewer) to the `Map` database table.
*   Update `MapEditor` UI to disable the `DrawTab` and editing tools if the user is a Viewer.
