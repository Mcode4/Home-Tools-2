const VIEWS = [
    { axis: "iso", label: "ISO", title: "Isometric view" },
    { axis: "top", label: "TOP", title: "Top view" },
    { axis: "front", label: "FR", title: "Front view" },
    { axis: "right", label: "RT", title: "Right view" },
];

export default function ViewportGizmo({ onAxisClick }) {
    return (
        <div className="viewport-gizmo" aria-label="3D view controls">
            <div className="viewport-gizmo-axis">
                <button className="viewport-axis viewport-axis-x" onClick={() => onAxisClick?.("right")} title="Right view">X</button>
                <button className="viewport-axis viewport-axis-y" onClick={() => onAxisClick?.("top")} title="Top view">Y</button>
                <button className="viewport-axis viewport-axis-z" onClick={() => onAxisClick?.("front")} title="Front view">Z</button>
            </div>
            <div className="viewport-gizmo-grid">
                {VIEWS.map(view => (
                    <button
                        key={view.axis}
                        className="viewport-gizmo-btn"
                        onClick={() => onAxisClick?.(view.axis)}
                        title={view.title}
                    >
                        {view.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
