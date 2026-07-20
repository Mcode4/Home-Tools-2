import DataTab from "./DataTab/DataTab";
import DrawTab from "./Draw/Draw";
import SettingsPanel from "./Settings/SettingsPanel";
import LayersTab from "./LayersTab/LayersTab";
import { Layers } from "lucide-react";
export default function Sidebar({
    menu, selectMenu,
    canvasSelect, selectCanvasAddon, setCanvasSelect,
    mapProperties, mapPoints, handlePointSelect, deleteCanvasObjects,
    savedTypesStore, navigate
}) {
    return (
        <aside className="flex h-full bg-background border-r z-40 relative shadow-sm">
            <ul className="flex flex-col items-center py-4 w-16 h-full border-r bg-muted/30 gap-4">
                <li
                    id="menu-draw"
                    className={`cursor-pointer p-2 rounded-md transition-colors ${menu === "draw" ? "bg-accent/80 shadow-sm" : "hover:bg-accent/50"}`}
                    onClick={(e) => selectMenu(e, "draw")}
                    title="Draw Tools"
                >
                    <img src="/icons/brush.svg" alt="Draw" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <li
                    id="menu-map"
                    className={`cursor-pointer p-2 rounded-md transition-colors ${menu === "map" ? "bg-accent/80 shadow-sm" : "hover:bg-accent/50"}`}
                    onClick={(e) => selectMenu(e, "map")}
                    title="Map Data"
                >
                    <img src="/icons/map.svg" alt="Properties" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <li
                    id="menu-layers"
                    className={`cursor-pointer p-2 rounded-md transition-colors flex justify-center items-center ${menu === "layers" ? "bg-accent/80 shadow-sm text-foreground" : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"}`}
                    onClick={(e) => selectMenu(e, "layers")}
                    title="Map Layers"
                >
                    <Layers className="w-6 h-6" strokeWidth={1.5} />
                </li>
                <li
                    id="menu-render"
                    className={`cursor-pointer p-2 rounded-md transition-colors hover:bg-accent/50`}
                    onClick={() => navigate("/render")}
                    title="3D Render"
                >
                    <img src="/icons/eye.svg" alt="Render Page" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                <li
                    id="menu-exports"
                    className={`cursor-pointer p-2 rounded-md transition-colors ${menu === "exports" ? "bg-accent/80 shadow-sm" : "hover:bg-accent/50"}`}
                    onClick={(e) => selectMenu(e, "exports")}
                    title="Export Data"
                >
                    <img src="/icons/export.svg" alt="Exports" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
                
                <div className="flex-grow"></div>
                <li
                    id="menu-settings"
                    className={`cursor-pointer p-2 rounded-md transition-colors ${menu === "settings" ? "bg-accent/80 shadow-sm" : "hover:bg-accent/50"}`}
                    onClick={(e) => selectMenu(e, "settings")}
                    title="Settings"
                >
                    <img src="/icons/setting.svg" alt="Settings" className="w-6 h-6 dark:invert opacity-80 hover:opacity-100" />
                </li>
            </ul>

            {/* The active panel for the selected menu */}
            {menu && (
                <div id="menu-tools" className="w-80 bg-card h-full overflow-y-auto shadow-lg relative border-r animate-in slide-in-from-left-4 duration-200">
                {menu === "map" && (
                    <DataTab
                        mapProperties={mapProperties}
                        mapPoints={mapPoints}
                        handlePointSelect={handlePointSelect}
                        deleteCanvasObjects={deleteCanvasObjects}
                    />
                )}
                
                {menu === "layers" && (
                    <LayersTab />
                )}
                
                {menu === "draw" && (
                    <DrawTab
                        canvasSelect={canvasSelect}
                        savedTypesStore={savedTypesStore}
                        selectCanvasAddon={selectCanvasAddon}
                        setCanvasSelect={setCanvasSelect}
                    />
                )}

                {menu === "exports" && (
                    <li className="flex flex-col p-4">
                        <div className="flex flex-col gap-2">
                            <h4 className="font-semibold tracking-tight text-foreground uppercase text-sm">Data Export</h4>
                            <p className="text-muted-foreground text-sm">Coming Soon...</p>
                        </div>
                    </li>
                )}

                {menu === "settings" && <SettingsPanel onClose={(e) => selectMenu(e, "settings")} />}
                </div>
            )}
        </aside>
    )
}
