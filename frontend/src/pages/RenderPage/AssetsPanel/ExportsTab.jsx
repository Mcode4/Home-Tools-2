import { useState } from "react";

const FORMATS = [
    { value: "gltf", label: "GLTF", description: "JSON format" },
    { value: "glb", label: "GLB", description: "Binary format" },
];

const QUALITY = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "ultra", label: "Ultra" },
];

export default function ExportsTab({
    onExportGLTF,
    onExportSelectedGLTF,
    selectedObjectId,
}) {
    const [format, setFormat] = useState("gltf");
    const [quality, setQuality] = useState("high");
    const [includeCamera, setIncludeCamera] = useState(true);
    const [includeLighting, setIncludeLighting] = useState(true);
    const [includeMaterials, setIncludeMaterials] = useState(true);

    const handleExport = (type) => {
        const settings = {
            format,
            quality,
            includeCamera,
            includeLighting,
            includeMaterials,
        };
        
        if (type === "scene") {
            onExportGLTF?.(settings);
        } else if (type === "selected" && selectedObjectId) {
            onExportSelectedGLTF?.(settings);
        }
    };

    return (
        <div style={{ padding: "8px 12px" }}>
            {/* Format Selection */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    FORMAT
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {FORMATS.map(f => (
                        <label
                            key={f.value}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 8px",
                                fontSize: 12,
                                cursor: "pointer",
                                background: format === f.value ? "var(--active-bg)" : "transparent",
                                borderRadius: "var(--radius-sm)",
                            }}
                        >
                            <input
                                type="radio"
                                name="format"
                                value={f.value}
                                checked={format === f.value}
                                onChange={() => setFormat(f.value)}
                            />
                            <span>{f.label}</span>
                            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>({f.description})</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Quality Selection */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    QUALITY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {QUALITY.map(q => (
                        <label
                            key={q.value}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 8px",
                                fontSize: 12,
                                cursor: "pointer",
                                background: quality === q.value ? "var(--active-bg)" : "transparent",
                                borderRadius: "var(--radius-sm)",
                            }}
                        >
                            <input
                                type="radio"
                                name="quality"
                                value={q.value}
                                checked={quality === q.value}
                                onChange={() => setQuality(q.value)}
                            />
                            <span>{q.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Include Options */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: "bold" }}>
                    INCLUDE
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={includeCamera}
                            onChange={e => setIncludeCamera(e.target.checked)}
                        />
                        <span>Camera Position</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={includeLighting}
                            onChange={e => setIncludeLighting(e.target.checked)}
                        />
                        <span>Lighting</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={includeMaterials}
                            onChange={e => setIncludeMaterials(e.target.checked)}
                        />
                        <span>Materials</span>
                    </label>
                </div>
            </div>

            {/* Export Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                    className="tool-item"
                    onClick={() => handleExport("scene")}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}
                >
                    <span style={{ fontSize: 16 }}>📦</span>
                    <span>Export Entire Scene</span>
                </button>
                {selectedObjectId && (
                    <button
                        className="tool-item"
                        onClick={() => handleExport("selected")}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}
                    >
                        <span style={{ fontSize: 16 }}>🎯</span>
                        <span>Export Selected Object</span>
                    </button>
                )}
            </div>

            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 12 }}>
                Downloads as .{format} file
            </div>
        </div>
    );
}
