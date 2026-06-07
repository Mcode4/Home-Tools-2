import { useState } from "react";

const DOOR_TYPES = [
    { id: "door-single", name: "Single Door", icon: "🚪", width: 90, height: 210, height3d: 210 },
    { id: "door-double", name: "Double Door", icon: "🚪", width: 160, height: 210, height3d: 210 },
    { id: "door-sliding", name: "Sliding Door", icon: "🚪", width: 180, height: 210, height3d: 210 },
    { id: "door-french", name: "French Door", icon: "🚪", width: 140, height: 210, height3d: 210 },
];

const WINDOW_TYPES = [
    { id: "window-single", name: "Single Window", icon: "🪟", width: 100, height: 100, height3d: 100 },
    { id: "window-double", name: "Double Window", icon: "🪟", width: 160, height: 100, height3d: 100 },
    { id: "window-bay", name: "Bay Window", icon: "🪟", width: 180, height: 120, height3d: 120 },
    { id: "window-skylight", name: "Skylight", icon: "🪟", width: 120, height: 80, height3d: 80 },
];

const WALL_TYPES = [
    { id: "wall-standard", name: "Standard Wall", icon: "🧱", width: 100, height: 10, height3d: 240 },
    { id: "wall-half", name: "Half Wall", icon: "🧱", width: 100, height: 10, height3d: 120 },
    { id: "wall-full", name: "Full Wall", icon: "🧱", width: 100, height: 10, height3d: 360 },
];

export default function DoorsWallsTab({ onSelectCatalogItem, wallHeight, onWallHeightChange }) {
    const [activeCategory, setActiveCategory] = useState("doors");

    const categories = [
        { id: "doors", label: "Doors", icon: "🚪" },
        { id: "windows", label: "Windows", icon: "🪟" },
        { id: "walls", label: "Walls", icon: "🧱" },
    ];

    const getItems = () => {
        switch (activeCategory) {
            case "doors": return DOOR_TYPES;
            case "windows": return WINDOW_TYPES;
            case "walls": return WALL_TYPES;
            default: return [];
        }
    };

    return (
        <li className="menu-item-container">
            <div className="menu-tools-section">
                <h4>Architectural Elements</h4>
                <div className="objects-category-row">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`tb-btn${activeCategory === cat.id ? " active" : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                <ul className="tool-list objects-catalog-list">
                    {getItems().map(item => (
                        <li
                            key={item.id}
                            className="tool-item object-tool-item"
                            onClick={() => onSelectCatalogItem?.({
                                ...item,
                                category: activeCategory,
                                fill: activeCategory === "walls" ? "#9CA3AF" : "#D1D5DB",
                                modelUrl: null,
                            })}
                            title={item.name}
                        >
                            <span className="object-tool-icon">{item.icon}</span>
                            <span className="object-tool-name">{item.name}</span>
                        </li>
                    ))}
                </ul>

                <div className="menu-tools-section" style={{ marginTop: 12 }}>
                    <h4>Wall Height</h4>
                    <div className="settings-row stacked">
                        <input
                            type="range"
                            className="input"
                            min={2.4}
                            max={3.6}
                            step={0.1}
                            value={wallHeight || 2.4}
                            onChange={(e) => onWallHeightChange?.(Number(e.target.value))}
                        />
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                            {wallHeight || 2.4}m
                        </span>
                    </div>
                </div>
            </div>
        </li>
    );
}