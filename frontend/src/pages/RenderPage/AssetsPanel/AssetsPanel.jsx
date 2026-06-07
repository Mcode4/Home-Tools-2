import { useState } from "react";
import ShapesTab from "./ShapesTab";
import CanvasTab from "./CanvasTab";
import SectionsTab from "./SectionsTab";
import ObjectsTab from "./ObjectsTab";
import TemplateTab from "./TemplateTab";
import ImportsTab from "./ImportsTab";
import DoorsWallsTab from "./DoorsWallsTab";

export default function AssetsPanel({
    stage,
    addShape,
    canvasSettings,
    setCanvasSettings,
    hasFloors,
    addRoomToFloor,
    activeFloorId,
    mapDistance,
    setMapDistance,
    setPendingPlacement,
    pendingPlacement,
    activeTool,
    onSelectTool,
    canCombine,
    canSelect,
    addLevel,
    onSelectCatalogItem,
    selectedCount = 0,
    onBooleanOp,
    outlines = [],
    onLoadTemplate,
    onLoadBuiltin,
    onImport,
    onSearchAddress,
    searchResults,
    onSelectResult,
    onPlaceAtCursor,
    isSearching,
    onBatchMerge,
    onBatchDelete,
    onBatchChangeType,
    onBatchFullWall,
    multiSelectIds,
    onApplyTemplate,
    onApplyObjectTemplate,
    selectedShape,
    onUpdateShape,
    onApplyArchitecturalStyle,
    importedObjects,
    onDeleteImport,
    onUploadImport,
    wallHeight,
    onWallHeightChange,
    onExportGLTF,
    onExportSelectedGLTF,
    selectedObjectId,
}) {
    const [tab, setTab] = useState("tools");

    if (stage === "objects") {
        const activeTab = ["catalog", "templates", "doorswalls", "imports", "settings"].includes(tab) ? tab : "catalog";
        return (
            <aside className="app-slider">
                <ul className="menu">
                    <li className={`user-select-none ${activeTab === "catalog" ? "menu-active" : ""}`}
                        onClick={() => setTab("catalog")} title="Furniture Catalog">
                        <span style={{ fontSize: 20 }}>🪑</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "templates" ? "menu-active" : ""}`}
                        onClick={() => setTab("templates")} title="Templates">
                        <span style={{ fontSize: 20 }}>📋</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "doorswalls" ? "menu-active" : ""}`}
                        onClick={() => setTab("doorswalls")} title="Doors & Walls">
                        <span style={{ fontSize: 20 }}>🚪</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "imports" ? "menu-active" : ""}`}
                        onClick={() => setTab("imports")} title="Imports">
                        <span style={{ fontSize: 20 }}>📥</span>
                    </li>
                    <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                    <li className={`user-select-none ${activeTab === "settings" ? "menu-active" : ""}`}
                        onClick={() => setTab("settings")} title="Settings">
                        <span style={{ fontSize: 20 }}>⚙️</span>
                    </li>
                </ul>
                <ul id="menu-tools" style={{ width: 220 }}>
                    {activeTab === "catalog" && <ObjectsTab onSelectCatalogItem={onSelectCatalogItem} activeItemId={pendingPlacement?.kind === "object" ? pendingPlacement.item?.id : null} />}
                    {activeTab === "templates" && <TemplateTab outlines={outlines} onLoadTemplate={onLoadTemplate} onLoadBuiltin={onLoadBuiltin} onImport={onImport} stage={stage} onApplyTemplate={onApplyTemplate} onApplyObjectTemplate={onApplyObjectTemplate} activeObjectTemplateId={pendingPlacement?.kind === "object-template" ? pendingPlacement.templateId : null} />}
                    {activeTab === "doorswalls" && <DoorsWallsTab selectedElement={selectedShape} onApplyElementStyle={onApplyArchitecturalStyle} wallHeight={wallHeight} onWallHeightChange={onWallHeightChange} />}
                    {activeTab === "imports" && <ImportsTab onSelectCatalogItem={onSelectCatalogItem} activeItemId={pendingPlacement?.kind === "object" ? pendingPlacement.item?.id : null} importedObjects={importedObjects} onDeleteImport={onDeleteImport} onUploadImport={onUploadImport} />}
                    {activeTab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
                </ul>
            </aside>
        );
    }

    if (stage === "render3d") {
        const activeTab = ["scene", "objects", "shapes", "export", "settings"].includes(tab) ? tab : "scene";
        return (
            <aside className="app-slider">
                <ul className="menu">
                    <li className={`user-select-none ${activeTab === "scene" ? "menu-active" : ""}`}
                        onClick={() => setTab("scene")} title="Scene Settings">
                        <span style={{ fontSize: 20 }}>🏠</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "objects" ? "menu-active" : ""}`}
                        onClick={() => setTab("objects")} title="3D Objects">
                        <span style={{ fontSize: 20 }}>🪑</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "shapes" ? "menu-active" : ""}`}
                        onClick={() => setTab("shapes")} title="Add Shapes">
                        <span style={{ fontSize: 20 }}>⬡</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "export" ? "menu-active" : ""}`}
                        onClick={() => setTab("export")} title="Export">
                        <span style={{ fontSize: 20 }}>💾</span>
                    </li>
                    <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                    <li className={`user-select-none ${activeTab === "settings" ? "menu-active" : ""}`}
                        onClick={() => setTab("settings")} title="Settings">
                        <span style={{ fontSize: 20 }}>⚙️</span>
                    </li>
                </ul>
                <ul id="menu-tools" style={{ width: 220 }}>
                    {activeTab === "scene" && (
                        <li className="tool-item" style={{ padding: "8px 12px" }}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>Wall Height (m)</label>
                                <input
                                    type="number"
                                    className="input"
                                    min={0.5}
                                    max={10}
                                    step={0.1}
                                    value={wallHeight ?? 2.4}
                                    onChange={e => onWallHeightChange?.(Math.max(0.5, Math.min(10, parseFloat(e.target.value) || 2.4)))}
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                <p style={{ margin: "4px 0" }}>Left-click + drag: Pan</p>
                                <p style={{ margin: "4px 0" }}>Right-click + drag: Rotate</p>
                                <p style={{ margin: "4px 0" }}>Scroll: Zoom</p>
                                <p style={{ margin: "4px 0" }}>Click object: Select</p>
                            </div>
                        </li>
                    )}
                    {activeTab === "objects" && <ObjectsTab onSelectCatalogItem={onSelectCatalogItem} activeItemId={pendingPlacement?.kind === "object" ? pendingPlacement.item?.id : null} />}
                    {activeTab === "shapes" && (
                        <li className="tool-item" style={{ padding: "8px 12px" }}>
                            <div style={{ fontSize: 12, color: "var(--text-main)", marginBottom: 8 }}>Add 2D Shape</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {[
                                    { type: "rectangle", label: "Rectangle", icon: "▭" },
                                    { type: "circle", label: "Circle", icon: "○" },
                                    { type: "polygon", label: "Polygon", icon: "⬠" },
                                ].map(shape => (
                                    <button
                                        key={shape.type}
                                        className="tool-item"
                                        onClick={() => {
                                            onSelectCatalogItem?.({ ...shape, kind: "shape" });
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}
                                    >
                                        <span style={{ fontSize: 16 }}>{shape.icon}</span>
                                        <span>{shape.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>
                                Click on 3D scene to place
                            </div>
                        </li>
                    )}
                    {activeTab === "export" && (
                        <li className="tool-item" style={{ padding: "8px 12px" }}>
                            <div style={{ fontSize: 12, color: "var(--text-main)", marginBottom: 8 }}>Export 3D Scene</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <button
                                    className="tool-item"
                                    onClick={onExportGLTF}
                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}
                                >
                                    <span style={{ fontSize: 16 }}>📦</span>
                                    <span>Export Entire Scene</span>
                                </button>
                                {selectedObjectId && (
                                    <button
                                        className="tool-item"
                                        onClick={onExportSelectedGLTF}
                                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}
                                    >
                                        <span style={{ fontSize: 16 }}>🎯</span>
                                        <span>Export Selected Object</span>
                                    </button>
                                )}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>
                                Downloads as .gltf file
                            </div>
                        </li>
                    )}
                    {activeTab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
                </ul>
            </aside>
        );
    }

    if (stage === "sections") {
        const activeTab = ["tools", "templates", "settings"].includes(tab) ? tab : "tools";
        return (
            <aside className="app-slider">
                <ul className="menu">
                    <li className={`user-select-none ${activeTab === "tools" ? "menu-active" : ""}`}
                        onClick={() => setTab("tools")} title="Room Tools">
                        <span style={{ fontSize: 20 }}>🔨</span>
                    </li>
                    <li className={`user-select-none ${activeTab === "templates" ? "menu-active" : ""}`}
                        onClick={() => setTab("templates")} title="Templates">
                        <span style={{ fontSize: 20 }}>📋</span>
                    </li>
                    <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                    <li className={`user-select-none ${activeTab === "settings" ? "menu-active" : ""}`}
                        onClick={() => setTab("settings")} title="Settings">
                        <span style={{ fontSize: 20 }}>⚙️</span>
                    </li>
                </ul>
                <ul id="menu-tools" style={{ width: 220 }}>
                    {activeTab === "tools" && <SectionsTab activeTool={activeTool} onSelectTool={onSelectTool} canCombine={canCombine} canSelect={canSelect} onBatchMerge={onBatchMerge} onBatchDelete={onBatchDelete} onBatchChangeType={onBatchChangeType} onBatchFullWall={onBatchFullWall} multiSelectIds={multiSelectIds} selectedShape={selectedShape} onUpdateShape={onUpdateShape} canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} />}
                    {activeTab === "templates" && <TemplateTab outlines={outlines} onLoadTemplate={onLoadTemplate} onLoadBuiltin={onLoadBuiltin} onImport={onImport} stage={stage} onApplyTemplate={onApplyTemplate} />}
                    {activeTab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
                </ul>
            </aside>
        );
    }

    const activeTab = ["shapes", "templates", "settings"].includes(tab) ? tab : "shapes";

    return (
        <aside className="app-slider">
            <ul className="menu">
                <li className={`user-select-none ${activeTab === "shapes" ? "menu-active" : ""}`}
                    onClick={() => setTab("shapes")} title="Outlines">
                    <span style={{ fontSize: 20 }}>▲</span>
                </li>
                <li className={`user-select-none ${activeTab === "templates" ? "menu-active" : ""}`}
                    onClick={() => setTab("templates")} title="Templates">
                    <span style={{ fontSize: 20 }}>📋</span>
                </li>
                <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                <li className={`user-select-none ${activeTab === "settings" ? "menu-active" : ""}`}
                    onClick={() => setTab("settings")} title="Canvas Settings">
                    <span style={{ fontSize: 20 }}>⚙️</span>
                </li>
            </ul>
            <ul id="menu-tools" style={{ width: 220 }}>
                {activeTab === "shapes" && <ShapesTab setPendingPlacement={setPendingPlacement} activeTool={activeTool} selectedCount={selectedCount} onBooleanOp={onBooleanOp} />}
                {activeTab === "templates" && <TemplateTab outlines={outlines} onLoadTemplate={onLoadTemplate} onLoadBuiltin={onLoadBuiltin} onImport={onImport} stage={stage} onApplyTemplate={onApplyTemplate} />}
                {activeTab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
            </ul>
        </aside>
    );
}
