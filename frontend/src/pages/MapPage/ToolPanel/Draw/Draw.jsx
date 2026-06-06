import { ModalItem } from "../../../../context/Modal";

export default function DrawTab({ canvasSelect, savedTypesStore, selectCanvasAddon, setCanvasSelect }) {
    return (
        <li className="menu-item-container" id="menu-item-draw">
            <div className="menu-tools-section">
                <h4 className="user-select-none">Primary Tools</h4>
                <ul className="tool-list">
                    <li className={`tool-item ${(canvasSelect.type === "marker" || canvasSelect.type === "icon") ? "tool-active" : ""}`} onClick={() => selectCanvasAddon("/icons/geo-alt-fill.svg", "Marker", "marker")}>
                        <div className="tool-icon"><img src="/icons/geo-alt-fill.svg" alt="Marker" /></div>
                        <span>Marker</span>
                    </li>
                    <li className={`tool-item ${canvasSelect.type === "home" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Home", "home")}>
                        <div className="tool-icon"><img src="/icons/home-point.svg" alt="Home" /></div>
                        <span>Home</span>
                    </li>
                    <li className={`tool-item ${canvasSelect.type === "apartment" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Apartment", "apartment")}>
                        <div className="tool-icon"><img src="/icons/building-point.svg" alt="Apartment" /></div>
                        <span>Apartment</span>
                    </li>
                    <li className={`tool-item ${canvasSelect.type === "unit" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Unit", "unit")}>
                        <div className="tool-icon"><img src="/icons/unit-point.svg" alt="Unit" /></div>
                        <span>Unit</span>
                    </li>

                    {savedTypesStore.data.map(type => (
                        <li
                            key={`saved-type-${type.id}`}
                            className={`tool-item tool-marker ${canvasSelect.savedTypeId === type.id ? "tool-active" : ""}`}
                            onClick={() => setCanvasSelect({
                                type: "icon",
                                savedTypeId: type.id,
                                name: type.name,
                                icon: type.type
                            })}
                        >
                            <div className="tool-icon">
                                {type.type.length > 5 ? <img src={type.type} alt={type.name} /> : type.type}
                            </div>
                            <span className="user-select-none">{type.name}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="menu-tools-section">
                <h4 className="user-select-none">Measures</h4>
                <ul className="tool-list">
                    <li className={`tool-item tool-marker ${canvasSelect.type === "radius" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Radius", "radius")}>
                        <div className="tool-icon">⭕</div>
                        <span className="user-select-none">Radius</span>
                    </li>
                    <li className={`tool-item tool-marker ${canvasSelect.type === "line" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Line", "line")}>
                        <div className="tool-icon">📏</div>
                        <span className="user-select-none">Line</span>
                    </li>
                </ul>
            </div>
        </li>
    )
}
