import { useState, useRef, useEffect } from "react";
import "./MapToggle.css";

const OPTIONS = [
    { key: "satellite", label: "Satellite (3D)", icon: "🛰" },
    { key: "street", label: "Street Map (2D)", icon: "🗺" },
    { key: "off", label: "Disabled", icon: "✕" },
];

export default function MapToggle({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, [open]);

    const current = OPTIONS.find(o => o.key === value) || OPTIONS[0];

    return (
        <div className="map-toggle" ref={ref}>
            <button className="map-toggle-btn" onClick={() => setOpen(!open)} title="Map Layer">
                <span className="map-toggle-icon">{current.icon}</span>
                <span className="map-toggle-label">{current.label}</span>
                <span className="map-toggle-caret">▾</span>
            </button>
            {open && (
                <ul className="map-toggle-menu">
                    {OPTIONS.map(opt => (
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
