import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkUpdateSettings } from "../../../redux/settings";

export default function SettingsPanel({ onClose }) {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);

    const handleUpdate = (updates) => {
        dispatch(thunkUpdateSettings(updates));
    };

    return (
        <div className="menu-item-container" id="menu-item-settings">
            <div className="menu-item-title-row">
                <h4 className="user-select-none">Editor Settings</h4>
                <button onClick={onClose}>X</button>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Visual Theme</h4>
                <div className="theme-options">
                    <button 
                        className={`theme-btn ${settings.theme === "light" ? "active" : ""}`}
                        onClick={() => handleUpdate({ theme: "light" })}
                    >
                        ☀️ Light
                    </button>
                    <button 
                        className={`theme-btn ${settings.theme === "dark" ? "active" : ""}`}
                        onClick={() => handleUpdate({ theme: "dark" })}
                    >
                        🌙 Dark
                    </button>
                    <button 
                        className={`theme-btn ${settings.theme === "blueprint" ? "active" : ""}`}
                        onClick={() => handleUpdate({ theme: "blueprint" })}
                    >
                        📐 Blueprint
                    </button>
                </div>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Map Style</h4>
                <div className="tool-list">
                    <li 
                        className={`tool-item ${settings.map_layer === "osm-layer" ? "tool-active" : ""}`}
                        onClick={() => handleUpdate({ map_layer: "osm-layer" })}
                    >
                        <div className="tool-icon">🗺️</div>
                        <span>Street Map (2D)</span>
                    </li>
                    <li 
                        className={`tool-item ${settings.map_layer === "satellite-layer" ? "tool-active" : ""}`}
                        onClick={() => handleUpdate({ map_layer: "satellite-layer" })}
                    >
                        <div className="tool-icon">🛰️</div>
                        <span>Satellite (3D Views)</span>
                    </li>
                </div>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Marker Scaling</h4>
                <div className="setting-control">
                    <label>Icon Size ({settings.icon_size}px)</label>
                    <input 
                        type="range" min="16" max="64" 
                        value={settings.icon_size}
                        onChange={(e) => handleUpdate({ icon_size: parseInt(e.target.value) })}
                    />
                </div>
                <div className="setting-control" style={{ marginTop: "12px" }}>
                    <label>Label Text Size ({settings.text_size}px)</label>
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
