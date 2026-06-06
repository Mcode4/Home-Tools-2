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
        <aside className="app-slider">
            <ul className="menu">
                <li
                    id="menu-draw"
                    className={`user-select-none ${menu === "draw" ? "menu-active" : ""}`}
                    onClick={(e) => selectMenu(e, "draw")}
                >
                    <img src="/icons/brush.svg" alt="Draw" />
                </li>
                <li
                    id="menu-map"
                    className={`user-select-none ${menu === "map" ? "menu-active" : ""}`}
                    onClick={(e) => selectMenu(e, "map")}
                >
                    <img src="/icons/map.svg" alt="Properties" />
                </li>
                <li
                    id="menu-render"
                    className="user-select-none"
                    onClick={() => navigate("/render")}
                >
                    <img src="/icons/eye.svg" alt="Render Page" />
                </li>
                <li
                    id="menu-exports"
                    className={`user-select-none ${menu === "exports" ? "menu-active" : ""}`}
                    onClick={(e) => selectMenu(e, "exports")}
                >
                    <img src="/icons/export.svg" alt="Exports" />
                </li>
                <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                <li
                    id="menu-settings"
                    className={`user-select-none ${menu === "settings" ? "menu-active" : ""}`}
                    onClick={(e) => selectMenu(e, "settings")}
                >
                    <img src="/icons/setting.svg" alt="Settings" />
                </li>
            </ul>

            <ul id="menu-tools">
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
