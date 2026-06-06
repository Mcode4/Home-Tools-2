const SECTION_TOOLS = [
    { type: "divider", label: "Divider", icon: "✂", desc: "Draw a line to split a room" },
    { type: "select", label: "Select", icon: "↗", desc: "Select and move divider lines" },
    { type: "combine", label: "Combine", icon: "⊞", desc: "Remove divider line to merge rooms" },
];

const PAD_TOOLS = [
    { type: "wall_square", label: "Full Wall", icon: "▬", desc: "Place a filled wall section" },
    { type: "wall_line", label: "Section Wall", icon: "╱", desc: "Place a line wall section" },
];

export default function SectionsTab({ activeTool, onSelectTool, canCombine, canSelect }) {
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
                <h4>Pads</h4>
                <ul className="tool-list">
                    {PAD_TOOLS.map(tool => (
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
