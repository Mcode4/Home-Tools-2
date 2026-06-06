const SECTION_TOOLS = [
    { type: "divider", label: "Divider", icon: "✂", desc: "Draw a line to split a room" },
    { type: "select", label: "Select", icon: "↗", desc: "Select and move divider lines" },
    { type: "combine", label: "Merge", icon: "⊞", desc: "Remove divider line to merge rooms" },
];

const WALL_TOOLS = [
    { type: "wall_square", label: "Full Wall", icon: "▬", desc: "Fill entire room area" },
    { type: "wall_line", label: "Section Wall", icon: "╱", desc: "Pad a specific room side" },
];

const BATCH_TOOLS = [
    { type: "batch_merge", label: "Merge All", icon: "⊞", desc: "Merge selected rooms" },
    { type: "batch_delete", label: "Delete All", icon: "🗑", desc: "Delete selected rooms" },
    { type: "batch_type", label: "Change Type", icon: "📋", desc: "Change type for all selected" },
];

const ROOM_TYPES = [
    { value: "bedroom", label: "Bedroom", color: "#6366f1" },
    { value: "bathroom", label: "Bathroom", color: "#06b6d4" },
    { value: "kitchen", label: "Kitchen", color: "#10b981" },
    { value: "living_room", label: "Living Room", color: "#f59e0b" },
    { value: "dining_room", label: "Dining Room", color: "#ef4444" },
    { value: "office", label: "Office", color: "#8b5cf6" },
    { value: "garage", label: "Garage", color: "#6b7280" },
    { value: "closet", label: "Closet", color: "#ec4899" },
    { value: "hallway", label: "Hallway", color: "#14b8a6" },
    { value: "other", label: "Other", color: "#6b7280" },
];

export default function SectionsTab({ activeTool, onSelectTool, canCombine, canSelect, onBatchMerge, onBatchDelete, onBatchChangeType, multiSelectIds, selectedShape, onUpdateShape }) {
    const isBatchMode = multiSelectIds && multiSelectIds.length >= 2;

    const handleToolClick = (tool) => {
        if (tool.disabled) return;
        if (tool.type === "batch_merge") { onBatchMerge?.(); return; }
        if (tool.type === "batch_delete") { onBatchDelete?.(); return; }
        if (tool.type === "batch_type") { onBatchChangeType?.(); return; }
        onSelectTool(tool.type);
    };

    const handleRoomType = (type) => {
        if (!selectedShape || selectedShape.type !== "room") return;
        onUpdateShape?.({ ...selectedShape, roomType: type.value, fill: type.color });
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
                <h4>Room Type</h4>
                <ul className="tool-list">
                    {ROOM_TYPES.map(type => (
                        <li key={type.value}
                            className={`tool-item${selectedShape?.roomType === type.value ? " tool-item-active" : ""}`}
                            onClick={() => handleRoomType(type)}
                            title={`Set room type to ${type.label}`}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0, color: type.color }}>●</span>
                            <span>{type.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    );
}