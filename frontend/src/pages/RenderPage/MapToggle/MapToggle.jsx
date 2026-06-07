import { useState, useRef, useEffect } from "react";
import "./MapToggle.css";

const MAP_OPTIONS = [
    { key: "satellite", label: "Satellite (3D)", icon: "🛰" },
    { key: "street", label: "Street Map (2D)", icon: "🗺" },
    { key: "off", label: "Disabled", icon: "✕" },
];

const RENDER_OPTIONS = [
    { key: "block", label: "Block View", icon: "🔲" },
    { key: "pure", label: "Pure View", icon: "🧹" },
];

export default function MapToggle({ value, onChange, stage }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, [open]);

    const isRender3d = stage === "render3d";
    const options = isRender3d ? RENDER_OPTIONS : MAP_OPTIONS;
    const current = options.find(o => o.key === value) || options[0];

    return (
        <div className="map-toggle" ref={ref}>
            <button className="map-toggle-btn" onClick={() => setOpen(!open)} title={isRender3d ? "View Mode" : "Map Layer"}>
                <span className="map-toggle-icon">{current.icon}</span>
                <span className="map-toggle-label">{current.label}</span>
                <span className="map-toggle-caret">▾</span>
            </button>
            {open && (
                <ul className="map-toggle-menu">
                    {options.map(opt => (
                        <li key={opt.key}
                            className={`map-toggle-item ${opt.key === value ? "active" : ""}`}
                            onClick={() => { onChange(opt.key); setOpen(false); }}>
                            <span className="map-toggle-icon">{opt.icon}</span>
                            <span>{opt.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
