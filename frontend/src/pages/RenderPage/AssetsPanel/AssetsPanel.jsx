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
    importedObjects,
    onDeleteImport,
    onUploadImport,
    wallHeight,
    onWallHeightChange,
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
                    {activeTab === "catalog" && <ObjectsTab onSelectCatalogItem={onSelectCatalogItem} />}
                    {activeTab === "templates" && <TemplateTab outlines={outlines} onLoadTemplate={onLoadTemplate} onLoadBuiltin={onLoadBuiltin} onImport={onImport} stage={stage} onApplyTemplate={onApplyTemplate} onApplyObjectTemplate={onApplyObjectTemplate} />}
                    {activeTab === "doorswalls" && <DoorsWallsTab onSelectCatalogItem={onSelectCatalogItem} wallHeight={wallHeight} onWallHeightChange={onWallHeightChange} />}
                    {activeTab === "imports" && <ImportsTab onSelectCatalogItem={onSelectCatalogItem} importedObjects={importedObjects} onDeleteImport={onDeleteImport} onUploadImport={onUploadImport} />}
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
