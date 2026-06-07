import { useState } from "react";

const PRIMITIVES = [
    { type: "rectangle", label: "Rectangle", icon: "▭" },
    { type: "circle", label: "Circle", icon: "○" },
    { type: "polygon", label: "Polygon", icon: "⬠" },
    { type: "triangle", label: "Triangle", icon: "△" },
    { type: "hexagon", label: "Hexagon", icon: "⬡" },
    { type: "octagon", label: "Octagon", icon: "⬢" },
];

const TRANSFORM_TOOLS = [
    { type: "move", label: "Move", icon: "↕", key: "G" },
    { type: "rotate", label: "Rotate", icon: "↻", key: "R" },
    { type: "scale", label: "Scale", icon: "⇔", key: "S" },
];

const OPERATIONS = [
    { type: "extrude", label: "Extrude", icon: "⬆" },
    { type: "union", label: "Union", icon: "∪" },
    { type: "intersect", label: "Intersect", icon: "∩" },
    { type: "subtract", label: "Subtract", icon: "−" },
];

export default function BuildToolsTab({
    onSelectCatalogItem,
    activeTool,
    onSelectTool,
    wallHeight,
    onWallHeightChange,
}) {
    const [gridSnap, setGridSnap] = useState(true);
    const [surfaceSnap, setSurfaceSnap] = useState(false);

    return (
        <div style={{ padding: "8px 12px" }}>
            {/* Primitives Section */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    PRIMITIVES
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {PRIMITIVES.map(shape => (
                        <button
                            key={shape.type}
                            className="tool-item"
                            onClick={() => onSelectCatalogItem?.({ ...shape, kind: "shape" })}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", fontSize: 12 }}
                        >
                            <span style={{ fontSize: 14 }}>{shape.icon}</span>
                            <span>{shape.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transform Section */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    TRANSFORM
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {TRANSFORM_TOOLS.map(tool => (
                        <button
                            key={tool.type}
                            className={`tool-item ${activeTool?.type === tool.type ? "tool-item-active" : ""}`}
                            onClick={() => onSelectTool?.({ type: tool.type })}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12 }}
                        >
                            <span style={{ fontSize: 14 }}>{tool.icon}</span>
                            <span>{tool.label}</span>
                            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" }}>{tool.key}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Operations Section */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    OPERATIONS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {OPERATIONS.map(op => (
                        <button
                            key={op.type}
                            className="tool-item"
                            onClick={() => onSelectTool?.({ type: op.type })}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12 }}
                        >
                            <span style={{ fontSize: 14 }}>{op.icon}</span>
                            <span>{op.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Wall Height */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    WALL HEIGHT
                </div>
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

            {/* Snapping Section */}
            <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    SNAPPING
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={gridSnap}
                            onChange={e => setGridSnap(e.target.checked)}
                        />
                        <span>Grid Snap</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={surfaceSnap}
                            onChange={e => setSurfaceSnap(e.target.checked)}
                        />
                        <span>Surface Snap</span>
                    </label>
                </div>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div style={{ marginTop: 16, fontSize: 10, color: "var(--text-dim)" }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>SHORTCUTS</div>
                <div>G - Move</div>
                <div>R - Rotate</div>
                <div>S - Scale</div>
                <div>Esc - Deselect</div>
            </div>
        </div>
    );
}
