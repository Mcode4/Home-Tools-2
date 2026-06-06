import { BUILTIN_TEMPLATES } from "../../../functions/outlineTemplates";

const PRIMITIVE_ITEMS = [
    { type: "polygon", label: "Polygon", icon: "✎" },
    { type: "rectangle", label: "Rectangle", icon: "▭" },
    { type: "circle", label: "Circle", icon: "○" },
    { type: "triangle", label: "Triangle", icon: "△", sides: 3 },
    { type: "pentagon", label: "Pentagon", icon: "⬠", sides: 5 },
    { type: "hexagon", label: "Hexagon", icon: "⬡", sides: 6 },
    { type: "octagon", label: "Octagon", icon: "⯃", sides: 8 },
];

const CONFIGURE_TOOLS = [
    { type: "union", label: "Union", icon: "⊕", desc: "Merge selected outlines" },
    { type: "subtract", label: "Subtract", icon: "⊖", desc: "Subtract outlines" },
    { type: "intersect", label: "Intersect", icon: "⊗", desc: "Intersect outlines" },
    { type: "offset", label: "Offset", icon: "⊞", desc: "Expand/contract outline" },
];

export default function ShapesTab({ setPendingPlacement, activeTool, selectedCount = 0, onBooleanOp, onShowOffset }) {
    const handleAdd = (item) => {
        if (item.type === "polygon") {
            setPendingPlacement({ type: "polygon", active: true });
        } else {
            setPendingPlacement({ type: item.type, sides: item.sides, active: true });
        }
    };

    const handleTemplate = (template) => {
        setPendingPlacement({ type: "template", templateId: template.id, active: true });
    };

    const handleConfigure = (toolType) => {
        if (toolType === "offset") {
            onShowOffset?.();
        } else {
            onBooleanOp?.(toolType);
        }
    };

    const isConfigureDisabled = selectedCount < 2;

    return (
        <li className="menu-item-container">
            <div className="menu-tools-section">
                <h4>Primitives</h4>
                <ul className="tool-list">
                    {PRIMITIVE_ITEMS.map(item => {
                        const isActive = activeTool?.type === "polygon" && item.type === "polygon";
                        return (
                            <li key={item.type}
                                className={`tool-item${isActive ? " tool-item-active" : ""}`}
                                onClick={() => handleAdd(item)}
                                title="Click to select, then click on map to place">
                                <span className="tool-icon" style={{ fontSize: 20 }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Templates</h4>
                <ul className="tool-list">
                    {BUILTIN_TEMPLATES.map(template => (
                        <li key={template.id}
                            className="tool-item"
                            onClick={() => handleTemplate(template)}
                            title={template.description}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{template.icon}</span>
                            <span>{template.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Configure</h4>
                <ul className="tool-list">
                    {CONFIGURE_TOOLS.map(tool => (
                        <li key={tool.type}
                            className={`tool-item${isConfigureDisabled ? " tool-item-disabled" : ""}`}
                            onClick={() => { if (isConfigureDisabled) return; handleConfigure(tool.type); }}
                            title={isConfigureDisabled ? "Select 2+ outlines first" : tool.desc}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{tool.icon}</span>
                            <span>{tool.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    );
}