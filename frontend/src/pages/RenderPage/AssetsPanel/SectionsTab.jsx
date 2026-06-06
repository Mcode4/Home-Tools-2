const SECTION_TOOLS = [
    { type: "divider", label: "Divider", icon: "✂", desc: "Draw a line to split a room" },
    { type: "select", label: "Select", icon: "↗", desc: "Select and move divider lines" },
    { type: "combine", label: "Merge", icon: "⊞", desc: "Remove divider line to merge rooms" },
];

const WALL_TOOLS = [
    { type: "wall_square", label: "Full Wall", icon: "▬", desc: "Fill entire room area" },
    { type: "wall_line", label: "Section Wall", icon: "╱", desc: "Pad a specific room side" },
];

const OPENING_TOOLS = [
    { type: "door", label: "Door", icon: "🚪", desc: "Place a door opening", disabled: true },
    { type: "window", label: "Window", icon: "🪟", desc: "Place a window opening", disabled: true },
];

const BATCH_TOOLS = [
    { type: "batch_merge", label: "Merge All", icon: "⊞", desc: "Merge selected rooms" },
    { type: "batch_delete", label: "Delete All", icon: "🗑", desc: "Delete selected rooms" },
    { type: "batch_type", label: "Change Type", icon: "📋", desc: "Change type for all selected" },
];

const CONFIGURE_TOOLS = [
    { type: "room_type", label: "Room Type", icon: "🏷", desc: "Quick-assign room type" },
    { type: "room_color", label: "Room Color", icon: "🎨", desc: "Quick-assign room color" },
];

export default function SectionsTab({ activeTool, onSelectTool, canCombine, canSelect, onBatchMerge, onBatchDelete, onBatchChangeType, multiSelectIds }) {
    const isBatchMode = multiSelectIds && multiSelectIds.length >= 2;

    const handleToolClick = (tool) => {
        if (tool.disabled) return;
        if (tool.type === "batch_merge") { onBatchMerge?.(); return; }
        if (tool.type === "batch_delete") { onBatchDelete?.(); return; }
        if (tool.type === "batch_type") { onBatchChangeType?.(); return; }
        onSelectTool(tool.type);
    };

    return (
        <li className="menu-item-container">
            <div className="menu-tools-section">
                <h4>Room Tools</h4>
                <ul className="tool-list">
                    {SECTION_TOOLS.map(tool => {
                        const disabled = (tool.type === "combine" && !canCombine)
                            || (tool.type === "select" && !canSelect);
                        return (
                            <li key={tool.type}
                                className={`tool-item${activeTool?.type === tool.type ? " tool-item-active" : ""}${disabled ? " tool-item-disabled" : ""}`}
                                onClick={() => { if (disabled) return; onSelectTool(tool.type); }}
                                title={disabled ? "No divider lines to work with" : tool.desc}>
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{tool.icon}</span>
                                <span>{tool.label}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Openings</h4>
                <ul className="tool-list">
                    {OPENING_TOOLS.map(tool => (
                        <li key={tool.type}
                            className={`tool-item tool-item-disabled`}
                            title="Coming soon">
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{tool.icon}</span>
                            <span>{tool.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Walls</h4>
                <ul className="tool-list">
                    {WALL_TOOLS.map(tool => (
                        <li key={tool.type}
                            className={`tool-item${activeTool?.type === tool.type ? " tool-item-active" : ""}`}
                            onClick={() => onSelectTool(tool.type)}
                            title={tool.desc}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{tool.icon}</span>
                            <span>{tool.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {isBatchMode && (
                <div className="menu-tools-section" style={{ marginTop: 12 }}>
                    <h4>Batch Operations</h4>
                    <ul className="tool-list">
                        {BATCH_TOOLS.map(tool => (
                            <li key={tool.type}
                                className="tool-item"
                                onClick={() => handleToolClick(tool)}
                                title={tool.desc}>
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{tool.icon}</span>
                                <span>{tool.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Configure</h4>
                <ul className="tool-list">
                    {CONFIGURE_TOOLS.map(tool => (
                        <li key={tool.type}
                            className={`tool-item${activeTool?.type === tool.type ? " tool-item-active" : ""}`}
                            onClick={() => onSelectTool(tool.type)}
                            title={tool.desc}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{tool.icon}</span>
                            <span>{tool.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    );
}