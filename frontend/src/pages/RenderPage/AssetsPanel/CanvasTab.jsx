export default function CanvasTab({
    canvasSettings, setCanvasSettings, mapDistance, setMapDistance,
    onSearchAddress, searchResults, onSelectResult,
    onPlaceAtCursor, isSearching
}) {
    const themes = [
        { key: "dark", label: "Dark" },
        { key: "light", label: "Light" },
        { key: "blueprint", label: "Blueprint" },
    ];

    const toggleTheme = (t) => {
        const themeColors = {
            dark: { bgColor: "#2a2a3e", gridColor: "#888" },
            light: { bgColor: "#f0f0f0", gridColor: "#aaa" },
            blueprint: { bgColor: "#0a1628", gridColor: "#1e3a5f" },
        };
        setCanvasSettings(s => ({ ...s, theme: t, ...themeColors[t] }));
    };

    const label = (text) => <label>{text}</label>;
    const numInput = (key, min, max, step) => (
        <input type="number" className="input" min={min} max={max} step={step}
            value={canvasSettings[key]}
            onChange={e => setCanvasSettings(s => ({ ...s, [key]: Number(e.target.value) }))} />
    );
    const toggleBtn = (key, labelText, shortcut) => (
        <div className="props-section" style={{ border: "none" }}>
            <label>{labelText} <span style={{ color: "var(--text-dim)", fontSize: 11 }}>({shortcut})</span></label>
            <button className="theme-btn"
                style={canvasSettings[key] ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}
                onClick={() => setCanvasSettings(s => ({ ...s, [key]: !s[key] }))}>
                {canvasSettings[key] ? "On" : "Off"}
            </button>
        </div>
    );
    const panLimit = canvasSettings?.mapPanLimit ?? 500;

    return (
        <li className="menu-item-container">
            <div className="menu-tools-section">
                <h4>Location</h4>
                <div className="props-section" style={{ border: "none", display: "flex", gap: 4 }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search address..."
                        style={{ flex: 1 }}
                        onKeyDown={e => e.key === "Enter" && onSearchAddress?.(e.target.value.trim())}
                    />
                    <button className="tb-btn" onClick={e => onSearchAddress?.(e.target.previousElementSibling.value.trim())} disabled={isSearching}>
                        {isSearching ? "..." : "Search"}
                    </button>
                </div>
                {searchResults && searchResults.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 4, maxHeight: 150, overflow: "auto" }}>
                        {searchResults.map((result, i) => (
                            <li key={i} style={{ padding: 4, cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                                onClick={() => onSelectResult?.(result)}
                                title="Click to center map here">
                                <span style={{ fontSize: 12 }}>{result.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {isSearching && !searchResults.length && (
                    <div style={{ fontSize: 11, color: "var(--text-dim)", padding: 4 }}>Searching...</div>
                )}
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Quick Place</h4>
                <div className="props-section" style={{ border: "none" }}>
                    <button className="tb-btn" onClick={onPlaceAtCursor} title="Place outline at searched location">
                        📍 Place Outline Here
                    </button>
                </div>
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Theme</h4>
                <div className="props-section" style={{ border: "none", flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    {themes.map(t => (
                        <button key={t.key} className="theme-btn"
                            style={canvasSettings.theme === t.key ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}
                            onClick={() => toggleTheme(t.key)}>{t.label}</button>
                    ))}
                </div>
            </div>
            <div className="menu-tools-section">
                <h4>Grid</h4>
                <div className="props-section" style={{ border: "none" }}>
                    <label>Grid</label>
                    <button className="theme-btn"
                        style={canvasSettings.gridActive ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}
                        onClick={() => setCanvasSettings(s => ({ ...s, gridActive: !s.gridActive }))}>
                        {canvasSettings.gridActive ? "On" : "Off"}
                    </button>
                </div>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Cell Size")}
                    {numInput("gridPixelSize", 10, 200)}
                </div>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Grid Color")}
                    <input type="color" className="input" style={{ height: 32, padding: 2 }}
                        value={canvasSettings.gridColor}
                        onChange={e => setCanvasSettings(s => ({ ...s, gridColor: e.target.value }))} />
                </div>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Background")}
                    <input type="color" className="input" style={{ height: 32, padding: 2 }}
                        value={canvasSettings.bgColor}
                        onChange={e => setCanvasSettings(s => ({ ...s, bgColor: e.target.value }))} />
                </div>
            </div>
            <div className="menu-tools-section">
                <h4>Canvas</h4>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Width")}
                    {numInput("canvasWidth", 100, 5000, 50)}
                </div>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Height")}
                    {numInput("canvasHeight", 100, 5000, 50)}
                </div>
            </div>
            <div className="menu-tools-section">
                <h4>Map Background</h4>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Distance (m)")}
                    <input type="number" className="input" min={50} max={10000} step={10}
                        value={mapDistance}
                        onChange={e => setMapDistance(Math.max(50, Math.min(10000, Number(e.target.value) || 200)))} />
                    <input type="range" className="input" min={50} max={5000} step={10}
                        value={Math.min(5000, Math.max(50, mapDistance))}
                        onChange={e => setMapDistance(Number(e.target.value))}
                        style={{ marginTop: 6 }} />
                </div>
                <div className="props-section" style={{ border: "none" }}>
                    {label("Pan Limit (m)")}
                    <input type="number" className="input" min={100} max={50000} step={50}
                        value={panLimit}
                        onChange={e => setCanvasSettings(s => ({ ...s, mapPanLimit: Math.max(100, Math.min(50000, Number(e.target.value) || 500)) }))} />
                    <input type="range" className="input" min={100} max={10000} step={50}
                        value={Math.min(10000, Math.max(100, panLimit))}
                        onChange={e => setCanvasSettings(s => ({ ...s, mapPanLimit: Number(e.target.value) }))}
                        style={{ marginTop: 6 }} />
                </div>
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Snapping</h4>
                {toggleBtn("gridSnap", "Grid Snap", "G")}
                {toggleBtn("edgeSnap", "Edge Snap", "E")}
                {toggleBtn("alignmentGuides", "Alignment Guides", "A")}
                <div className="props-section" style={{ border: "none" }}>
                    {label("Snap Threshold")}
                    {numInput("snapThreshold", 5, 50)}
                </div>
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Measurements</h4>
                {toggleBtn("showMeasurements", "Show Measurements", "M")}
                <div className="props-section" style={{ border: "none" }}>
                    <label>Unit</label>
                    <div style={{ display: "flex", gap: 4 }}>
                        <button className={`theme-btn${canvasSettings.unit === "metric" ? " active" : ""}`}
                            onClick={() => setCanvasSettings(s => ({ ...s, unit: "metric" }))}>Metric</button>
                        <button className={`theme-btn${canvasSettings.unit === "imperial" ? " active" : ""}`}
                            onClick={() => setCanvasSettings(s => ({ ...s, unit: "imperial" }))}>Imperial</button>
                    </div>
                </div>
            </div>
        </li>
    );
}