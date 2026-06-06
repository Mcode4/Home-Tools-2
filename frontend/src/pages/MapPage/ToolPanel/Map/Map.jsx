export default function MapTab({ mapProperties, mapPoints, handlePointSelect, deleteCanvasObjects }) {
    return (
        <li className="menu-item-container" id="menu-item-map">
            <div className="menu-tools-section">
                <div className="menu-item-title-row">
                    <h4 className="user-select-none">Properties</h4>
                    <img src="/icons/down-arrow.svg" className="menu-section-icon" alt="Expand" />
                </div>
                <ul className="tool-list">
                    {mapProperties.map((p, i) => (
                        <li key={`map-prop-${p.id}`} className="tool-item map-list-item" onClick={() => handlePointSelect(p)}>
                            <div className="tool-icon">
                                {(p.icon && (p.icon.startsWith("http") || p.icon.startsWith("/") || p.icon.startsWith("data:"))) ? <img src={p.icon} alt="Icon" style={{width: '20px', height: '20px', display: 'block'}} /> :
                                 p.icon ? <span style={{fontSize: '18px'}}>{p.icon}</span> :
                                 p.type === "home" ? <img src="/icons/home-point.svg" alt="Home" /> :
                                 p.type === "apartment" ? <img src="/icons/building-point.svg" alt="Apartment" /> :
                                 p.type === "unit" ? <img src="/icons/unit-point.svg" alt="Unit" /> :
                                 "📍"}
                            </div>
                            <div className="map-list-item-content">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.name.replace("(Unsaved)", "").trim() || `Property ${p.id}`}
                                    </span>
                                    {p.name.includes("(Unsaved)") && (
                                        <div className="unsaved-dot-marker" style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} title="Unsaved changes" />
                                    )}
                                </div>
                                {p.source === "canvas" && <div className="unsaved-dot" title="Unsaved changes"></div>}
                                <button className="inline-delete-btn" onClick={(e) => { e.stopPropagation(); deleteCanvasObjects(p.id); }}>🗑️</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="menu-tools-section">
                <div className="menu-item-title-row">
                    <h4 className="user-select-none">Points</h4>
                    <img src="/icons/down-arrow.svg" className="menu-section-icon" alt="Expand" />
                </div>
                <ul className="tool-list">
                    {mapPoints.map((p, i) => (
                        <li key={`map-point-${p.id}`} className="tool-item map-list-item" onClick={() => handlePointSelect(p)}>
                            <div className="tool-icon">
                                {p.type === "radius" ? "⭕" :
                                 p.type === "line" ? "📏" :
                                 (p.icon && (p.icon.startsWith("http") || p.icon.startsWith("/") || p.icon.startsWith("data:"))) ? <img src={p.icon} alt="Marker" style={{width: '20px', height: '20px', display: 'block'}} /> :
                                 (p.icon ? <span style={{fontSize: '18px'}}>{p.icon}</span> : "📍")}
                            </div>
                            <div className="map-list-item-content">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white' }}>
                                        {(p.name || (p.type === "marker" || p.type === "icon" ? "Icon" : `Point ${p.id}`)).replace("(Unsaved)", "").trim()}
                                    </span>
                                    {p.name?.includes("(Unsaved)") && (
                                        <div className="unsaved-dot-marker" style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} title="Unsaved changes" />
                                    )}
                                </div>
                                {p.source === "canvas" && <div className="unsaved-dot" title="Unsaved changes"></div>}
                                <button className="inline-delete-btn" onClick={(e) => { e.stopPropagation(); deleteCanvasObjects(p.id); }}>🗑️</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    )
}
