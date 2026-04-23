# Project Requirements

## Property Sidebar System

**REQ-001: Sidebar Triggering**
The Right Sidebar MUST open when a point is clicked on the map or selected from the global navigation (Left Sidebar / Maps Menu).

**REQ-002: Batch Saving Integration**
The Sidebar MUST stage changes in local state/storage without immediate database persistence. It MUST signal changes to the existing global "Save All" mechanism.

**REQ-003: Selection Persistence**
Switching between points in the sidebar MUST NOT lose unsaved changes for previously edited points during the same session.

**REQ-004: UI Cleanup**
All legacy right-click context menus and hover-based map menus MUST be removed or disabled in favor of the Sidebar interface.

**REQ-005: Responsive Layout**
The sidebar MUST adjust to the available vertical height and maintain a premium, state-of-the-art aesthetic consistent with modern GIS tools.
