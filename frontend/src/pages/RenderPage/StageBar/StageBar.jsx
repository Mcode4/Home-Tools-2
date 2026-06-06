const STAGES = [
    { key: "outline", label: "Outline", icon: "▲" },
    { key: "sections", label: "Sections", icon: "■" },
    { key: "objects", label: "Objects", icon: "◻" },
    { key: "render3d", label: "3D Render", icon: "◆" },
];

export default function StageBar({ stage, setStage, hasOutlines, hasRooms }) {
    return (
        <div className="stage-bar">
            {STAGES.map((s, i) => {
                const isDisabled =
                    (s.key === "sections" && !hasOutlines) ||
                    (s.key === "objects" && !hasRooms) ||
                    (s.key === "render3d" && !hasRooms);
                const tooltip =
                    s.key === "sections" && !hasOutlines ? "Add an outline first" :
                    s.key === "objects" && !hasRooms ? "Add rooms in Sections first" :
                    s.key === "render3d" && !hasRooms ? "Add rooms in Sections first" : "";
                return (
                    <button key={s.key}
                        className={`stage-btn ${stage === s.key ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                        onClick={() => { if (isDisabled) return; setStage(s.key); }}
                        disabled={isDisabled}
                        title={tooltip}
                    >
                        {s.icon} {s.label}
                    </button>
                );
            })}
            <span className="stage-arrow">▶</span>
        </div>
    );
}
