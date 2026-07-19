import MapTab from "./Map/Map";
import DrawTab from "./Draw/Draw";
import SettingsPanel from "./Settings/SettingsPanel";
import "./ToolPanel.css";

export default function ToolPanel({
    menu, selectMenu,
    canvasSelect, selectCanvasAddon, setCanvasSelect,
    mapProperties, mapPoints, handlePointSelect, deleteCanvasObjects,
    savedTypesStore, navigate
}) {
    return (
        <aside className="flex h-full bg-background border-r z-40 relative">
            <ul className="flex flex-col items-center py-4 w-16 border-r bg-muted/20 gap-4">
                <li
                    id="menu-draw"
                    className={`cursor-pointer p-2 rounded-md hover:bg-accent ${menu === "draw" ? "bg-accent" : ""}`}
                    onClick={(e) => selectMenu(e, "draw")}
                >
                    <img src="/icons/brush.svg" alt="Draw" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <li
                    id="menu-map"
                    className={`cursor-pointer p-2 rounded-md hover:bg-accent ${menu === "map" ? "bg-accent" : ""}`}
                    onClick={(e) => selectMenu(e, "map")}
                >
                    <img src="/icons/map.svg" alt="Properties" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <li
                    id="menu-render"
                    className="cursor-pointer p-2 rounded-md hover:bg-accent"
                    onClick={() => navigate("/render")}
                >
                    <img src="/icons/eye.svg" alt="Render Page" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <li
                    id="menu-exports"
                    className={`cursor-pointer p-2 rounded-md hover:bg-accent ${menu === "exports" ? "bg-accent" : ""}`}
                    onClick={(e) => selectMenu(e, "exports")}
                >
                    <img src="/icons/export.svg" alt="Exports" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <div className="flex-1"></div>
                <li
                    id="menu-settings"
                    className={`cursor-pointer p-2 rounded-md hover:bg-accent ${menu === "settings" ? "bg-accent" : ""}`}
                    onClick={(e) => selectMenu(e, "settings")}
                >
                    <img src="/icons/setting.svg" alt="Settings" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
            </ul>

            <ul id="menu-tools" className="w-72 bg-card h-full overflow-y-auto shadow-xl relative border-r">
                <MapTab
                    mapProperties={mapProperties}
                    mapPoints={mapPoints}
                    handlePointSelect={handlePointSelect}
                    deleteCanvasObjects={deleteCanvasObjects}
                />
                <DrawTab
                    canvasSelect={canvasSelect}
                    savedTypesStore={savedTypesStore}
                    selectCanvasAddon={selectCanvasAddon}
                    setCanvasSelect={setCanvasSelect}
                />

                <li className="hidden menu-item-container" id="menu-item-exports">
                    <div className="menu-tools-section">
                        <h4>Data Export</h4>
                        <p className="empty-section-text">Coming Soon...</p>
                    </div>
                </li>

                {menu === "settings" && <SettingsPanel onClose={(e) => selectMenu(e, "settings")} />}
            </ul>
        </aside>
    )
}
