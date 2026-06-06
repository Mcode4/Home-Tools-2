import { useState } from "react";
import ShapesTab from "./ShapesTab";
import CanvasTab from "./CanvasTab";
import SectionsTab from "./SectionsTab";
import ObjectsTab from "./ObjectsTab";
import TemplateTab from "./TemplateTab";

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
    onShowOffset,
    outlines = [],
    onLoadTemplate,
    onLoadBuiltin,
    onImport,
}) {
    const [tab, setTab] = useState("tools");

    if (stage === "objects") {
        return (
            <aside className="app-slider">
                <ul className="menu">
                    <li className={`user-select-none ${tab === "catalog" ? "menu-active" : ""}`}
                        onClick={() => setTab("catalog")} title="Furniture Catalog">
                        <span style={{ fontSize: 20 }}>🪑</span>
                    </li>
                    <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                    <li className={`user-select-none ${tab === "settings" ? "menu-active" : ""}`}
                        onClick={() => setTab("settings")} title="Settings">
                        <span style={{ fontSize: 20 }}>⚙️</span>
                    </li>
                </ul>
                <ul id="menu-tools" style={{ width: 220 }}>
                    {tab === "catalog" && <ObjectsTab onSelectCatalogItem={onSelectCatalogItem} />}
                    {tab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
                </ul>
            </aside>
        );
    }

    if (stage === "sections") {
        return (
            <aside className="app-slider">
                <ul className="menu">
                    <li className={`user-select-none ${tab === "tools" ? "menu-active" : ""}`}
                        onClick={() => setTab("tools")} title="Room Tools">
                        <span style={{ fontSize: 20 }}>🔨</span>
                    </li>
                    <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                    <li className={`user-select-none ${tab === "settings" ? "menu-active" : ""}`}
                        onClick={() => setTab("settings")} title="Settings">
                        <span style={{ fontSize: 20 }}>⚙️</span>
                    </li>
                </ul>
                <ul id="menu-tools" style={{ width: 220 }}>
                    {tab === "tools" && <SectionsTab activeTool={activeTool} onSelectTool={onSelectTool} canCombine={canCombine} canSelect={canSelect} />}
                    {tab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
                </ul>
            </aside>
        );
    }

    return (
        <aside className="app-slider">
            <ul className="menu">
                <li className={`user-select-none ${tab === "shapes" ? "menu-active" : ""}`}
                    onClick={() => setTab("shapes")} title="Outlines">
                    <span style={{ fontSize: 20 }}>▲</span>
                </li>
                <li className={`user-select-none ${tab === "templates" ? "menu-active" : ""}`}
                    onClick={() => setTab("templates")} title="Templates">
                    <span style={{ fontSize: 20 }}>📋</span>
                </li>
                <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                <li className={`user-select-none ${tab === "settings" ? "menu-active" : ""}`}
                    onClick={() => setTab("settings")} title="Canvas Settings">
                    <span style={{ fontSize: 20 }}>⚙️</span>
                </li>
            </ul>
            <ul id="menu-tools" style={{ width: 220 }}>
                {tab === "shapes" && <ShapesTab setPendingPlacement={setPendingPlacement} activeTool={activeTool} selectedCount={selectedCount} onBooleanOp={onBooleanOp} onShowOffset={onShowOffset} />}
                {tab === "templates" && <TemplateTab outlines={outlines} onLoadTemplate={onLoadTemplate} onLoadBuiltin={onLoadBuiltin} onImport={onImport} />}
                {tab === "settings" && <CanvasTab canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} mapDistance={mapDistance} setMapDistance={setMapDistance} />}
            </ul>
        </aside>
    );
}