import { useState } from "react";
import { BUILTIN_TEMPLATES } from "../../../functions/outlineTemplates";
import { exportGeoJSON, exportSVG, exportPDF, parseGeoJSON, parseDXF } from "../../../functions/outlineExport";

export default function TemplateTab({ outlines, onLoadTemplate, onLoadBuiltin, onImport }) {
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [importError, setImportError] = useState(null);
    const [saveName, setSaveName] = useState("");

    const loadSavedTemplates = () => {
        try {
            const stored = localStorage.getItem("render_templates");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setSavedTemplates(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load templates:", e);
        }
    };

    const saveTemplate = () => {
        if (!outlines || outlines.length === 0) {
            alert("No outlines to save");
            return;
        }
        const name = window.prompt("Enter template name:", saveName || "My Template");
        if (!name) return;

        const template = {
            id: `custom-${Date.now()}`,
            name,
            outlines: outlines.map(o => ({
                ...o,
                points: Array.isArray(o.points) ? o.points.map(p => [...p]) : undefined,
            })),
            createdAt: new Date().toISOString(),
        };

        const updated = [...savedTemplates, template];
        localStorage.setItem("render_templates", JSON.stringify(updated));
        setSavedTemplates(updated);
    };

    const deleteTemplate = (id) => {
        if (!window.confirm("Delete this template?")) return;
        const updated = savedTemplates.filter(t => t.id !== id);
        localStorage.setItem("render_templates", JSON.stringify(updated));
        setSavedTemplates(updated);
    };

    const handleFileImport = async (file, parser) => {
        setImportError(null);
        const text = await file.text();
        try {
            const imported = await parser(text);
            if (imported.length > 0) {
                onImport?.(imported);
            } else {
                setImportError("No valid outlines found in file");
            }
        } catch (e) {
            setImportError(`Import failed: ${e.message}`);
        }
    };

    const handlePaste = async () => {
        setImportError(null);
        try {
            const text = await navigator.clipboard.readText();
            const imported = parseGeoJSON(text);
            if (imported.length > 0) {
                onImport?.(imported);
            } else {
                setImportError("Clipboard doesn't contain valid GeoJSON");
            }
        } catch (e) {
            setImportError("Failed to read clipboard");
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExport = async (format) => {
        if (!outlines || outlines.length === 0) {
            alert("No outlines to export");
            return;
        }

        try {
            if (format === "geojson") {
                const json = exportGeoJSON(outlines);
                const blob = new Blob([json], { type: "application/geo+json" });
                downloadBlob(blob, `outlines-${Date.now()}.geojson`);
            } else if (format === "svg") {
                const svg = exportSVG(outlines);
                const blob = new Blob([svg], { type: "image/svg+xml" });
                downloadBlob(blob, `outlines-${Date.now()}.svg`);
            } else if (format === "pdf") {
                const blob = await exportPDF(outlines);
                downloadBlob(blob, `outlines-${Date.now()}.pdf`);
            } else if (format === "copy") {
                const json = JSON.stringify(outlines.map(o => ({
                    ...o,
                    points: Array.isArray(o.points) ? o.points.map(p => [...p]) : undefined,
                })), null, 2);
                await navigator.clipboard.writeText(json);
                alert("Outlines copied to clipboard");
            }
        } catch (e) {
            console.error("Export failed:", e);
            alert(`Export failed: ${e.message}`);
        }
    };

    return (
        <li className="menu-item-container">
            <div className="menu-tools-section">
                <h4>My Templates</h4>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button className="tb-btn" onClick={saveTemplate} title="Save current outlines as template">⊞ Save</button>
                </div>
                <ul className="tool-list">
                    {savedTemplates.length === 0 ? (
                        <li className="tool-item" style={{ color: "var(--text-dim)", justifyContent: "center" }}>
                            <span>No saved templates yet</span>
                        </li>
                    ) : (
                        savedTemplates.map(template => (
                            <li key={template.id} className="tool-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span onClick={() => onLoadTemplate?.(template)} style={{ cursor: "pointer", flex: 1 }}>
                                    {template.name} <span style={{ color: "var(--text-dim)", fontSize: 11 }}>({template.outlines.length} outlines)</span>
                                </span>
                                <button className="tb-btn" style={{ width: 18, height: 18, fontSize: 10 }} onClick={() => deleteTemplate(template.id)} title="Delete">✕</button>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Import</h4>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="file" accept=".geojson,.json" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFileImport(e.target.files[0], parseGeoJSON)} />
                        <button className="tb-btn" onClick={e => e.target.previousElementSibling.click()}>GeoJSON</button>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="file" accept=".dxf" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFileImport(e.target.files[0], parseDXF)} />
                        <button className="tb-btn" onClick={e => e.target.previousElementSibling.click()}>DXF</button>
                    </label>
                    <button className="tb-btn" onClick={handlePaste}>Paste</button>
                </div>
                {importError && <p style={{ color: "var(--danger)", fontSize: 11, marginTop: 4 }}>{importError}</p>}
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Export</h4>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button className="tb-btn" onClick={() => handleExport("geojson")}>GeoJSON</button>
                    <button className="tb-btn" onClick={() => handleExport("svg")}>SVG</button>
                    <button className="tb-btn" onClick={() => handleExport("pdf")}>PDF</button>
                    <button className="tb-btn" onClick={() => handleExport("copy")}>Copy</button>
                </div>
            </div>

            <div className="menu-tools-section" style={{ marginTop: 12 }}>
                <h4>Built-in Templates</h4>
                <ul className="tool-list">
                    {BUILTIN_TEMPLATES.map(template => (
                        <li key={template.id}
                            className="tool-item"
                            onClick={() => onLoadBuiltin?.(template.id)}
                            title={template.description}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, fontSize: 18, flexShrink: 0 }}>{template.icon}</span>
                            <span>{template.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </li>
    );
}