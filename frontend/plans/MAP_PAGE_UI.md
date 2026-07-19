# MapPage UI Migration — Wave Plan

## Goal
Replace custom CSS classes in MapPage with shadcn components, reducing `MapPage.css` (681 lines), `PropertyDetailsSidebar.css` (1,328 lines), `UnsavedIndicator.css` (38 lines), and `NoteCanvas.css` (274 lines).

## Installed shadcn components available
`Button`, `Card`, `Input`, `Label`, `Select`, `Dialog`, `Sheet`, `Separator`, `ScrollArea`, `Alert`, `Badge`

## CSS-to-shadcn mapping

### Wave 1 — Header + Settings (current)
| Old CSS | shadcn replacement | Target files |
|---------|-------------------|--------------|
| `.header-btn` | `<Button variant="ghost" size="sm">` | MapPage.jsx header |
| `.save-btn` | `<Button variant="default">` | MapPage.jsx header |
| `.app-searchbar` | `<Input>` | MapPage.jsx search |
| `.header-btn:disabled` | `<Button disabled>` | MapPage.jsx undo/redo |
| `.theme-btn` / `.active` | `<Button variant={active ? "default" : "outline"}>` | SettingsPanel.jsx |
| `.setting-control label` | `<Label>` | SettingsPanel.jsx |
| `.setting-control input[type=range]` | Keep custom (no shadcn range) | SettingsPanel.jsx |
| `.setting-control input` | `<Input type="range">` (keep as range) | SettingsPanel.jsx |

### Wave 2 — PropertyDetailsSidebar buttons + forms
| Old CSS | shadcn replacement | Target file |
|---------|-------------------|-------------|
| `.sidebar-input` | `<Input>` | PropertyDetailsSidebar.jsx |
| `.sidebar-select` | `<Select>` | PropertyDetailsSidebar.jsx |
| `.sidebar-label` | `<Label>` | PropertyDetailsSidebar.jsx |
| `.delete-action-btn` | `<Button variant="destructive" size="sm">` | PropertyDetailsSidebar.jsx |
| `.confirm-delete-btn` | `<Button variant="destructive">` | PropertyDetailsSidebar.jsx |
| `.cancel-btn` | `<Button variant="ghost">` | PropertyDetailsSidebar.jsx |
| `.count-badge` | `<Badge>` | PropertyDetailsSidebar.jsx |
| `.sidebar-container` | `<Sheet>` | PropertyDetailsSidebar.jsx |
| Action buttons in tree | `<Button variant="ghost" size="icon">` | PropertyDetailsSidebar.jsx |
| `.sidebar-pane` | `<Card>` | PropertyDetailsSidebar.jsx |

### Wave 3 — Tabs + polish (DONE)
| Old CSS | shadcn replacement | Target file |
|---------|-------------------|-------------|
| `.sidebar-tabs` / `.sidebar-tab` | `<Tabs>` + `<TabsList>` + `<TabsTrigger>` | PropertyDetailsSidebar.jsx |
| `.sidebar-pane` | `<Card className="border-0 shadow-none">` | PropertyDetailsSidebar.jsx |
| `.sidebar-label` in editor tab | `<Label>` | PropertyDetailsSidebar.jsx |

### Keep as custom CSS (complex/unique)
- `.menu` (60px icon bar) + `.menu li img` (SVG filters)
- `#menu-tools`, `.menu-item-container` (sectioned sidebar)
- `.app-slider`, `.app-slider-right` (absolute-positioned panels)
- `.search-results`, `.search-result` (custom dropdown)
- `.node-container` (react-arborist tree nodes)
- `.note-canvas`, `.canvas-block-*` (Milkdown editor)
- `.split-divider`, `.divider-handle` (resize handle)
- `.loading-mask` (full-screen overlay)
- `.persona-dropdown` (portal popover)
- `.staged-banner`, `.pulse-dot` (pulse animation)
- `.sidebar-tabs`, `.sidebar-tab` (until Wave 3)
