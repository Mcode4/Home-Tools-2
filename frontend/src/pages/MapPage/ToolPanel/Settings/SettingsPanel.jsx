import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { thunkUpdateSettings } from "../../../../redux/settings";

export default function SettingsPanel({ onClose }) {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);

    const handleUpdate = (updates) => {
        dispatch(thunkUpdateSettings(updates));
    };

    return (
        <div className="settings-panel-content">
            <div className="menu-item-title-row">
                <h4 className="user-select-none">Editor Settings</h4>
                <button onClick={onClose}>X</button>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Visual Theme</h4>
                <div className="theme-options">
                    <Button
                        variant={settings.theme === "light" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "light" })}
                    >
                        ☀️ Light
                    </Button>
                    <Button
                        variant={settings.theme === "dark" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "dark" })}
                    >
                        🌙 Dark
                    </Button>
                    <Button
                        variant={settings.theme === "blueprint" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "blueprint" })}
                    >
                        📐 Blueprint
                    </Button>
                </div>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Map Style</h4>
                <div className="tool-list">
                    <div 
                        className={`tool-item ${settings.map_layer === "osm-layer" ? "tool-active" : ""}`}
                        onClick={() => handleUpdate({ map_layer: "osm-layer" })}
                    >
                        <div className="tool-icon">🗺️</div>
                        <span>Street Map (2D)</span>
                    </div>
                    <div 
                        className={`tool-item ${settings.map_layer === "satellite-layer" ? "tool-active" : ""}`}
                        onClick={() => handleUpdate({ map_layer: "satellite-layer" })}
                    >
                        <div className="tool-icon">🛰️</div>
                        <span>Satellite (3D Views)</span>
                    </div>
                </div>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Marker Scaling</h4>
                <div className="setting-control">
                    <Label>Icon Size ({settings.icon_size}px)</Label>
                    <input
                        type="range" min="16" max="64"
                        value={settings.icon_size}
                        onChange={(e) => handleUpdate({ icon_size: parseInt(e.target.value) })}
                    />
                </div>
                <div className="setting-control" style={{ marginTop: "12px" }}>
                    <Label>Label Text Size ({settings.text_size}px)</Label>
                    <input
                        type="range" min="8" max="24"
                        value={settings.text_size}
                        onChange={(e) => handleUpdate({ text_size: parseInt(e.target.value) })}
                    />
                </div>
            </div>
        </div>
    );
}
