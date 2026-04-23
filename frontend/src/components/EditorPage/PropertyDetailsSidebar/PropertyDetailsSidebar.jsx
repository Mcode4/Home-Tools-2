import { useState, useEffect } from "react";
import UnsavedIndicator from "./UnsavedIndicator";
import { reverseLookupAddress } from "../../../functions/search/search";
import "./PropertyDetailsSidebar.css";

export default function PropertyDetailsSidebar({
    point,
    allPoints = [],
    isPinned,
    onPinToggle,
    onUpdate,
    onDelete,
    onClose
}) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState(null);
    const [icon, setIcon] = useState("");
    const [radius, setRadius] = useState(0);
    const [type, setType] = useState("");
    const [length, setLength] = useState(0);
    const [unitList, setUnitList] = useState("");
    const [parentId, setParentId] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [hasStagedChanges, setHasStagedChanges] = useState(false);

    // Sync internal state with selected point
    useEffect(() => {
        if (!point) return;

        let cleanName = point.name || "";
        if (cleanName.includes("(Unsaved)")) {
            cleanName = cleanName.split("(Unsaved)")[1].trim();
            setHasStagedChanges(true);
        } else {
            setHasStagedChanges(point.source === "canvas");
        }

        setName(cleanName);
        setType(point.type || "point");
        setIcon(point.icon || "");
        setRadius(point.radius || 0);
        setLength(point.length || 0);
        setUnitList(point.extra_info?.units?.join(", ") || "");
        setParentId(point.parent_id || "");
        setConfirmingDelete(false);

        if (point.location) {
            setLocation(point.location);
            setLoaded(true);
        } else {
            setLoaded(false);
            reverseLookupAddress(point.lng, point.lat)
                .then(data => {
                    setLocation(data.text);
                    setLoaded(true);
                })
                .catch(() => {
                    setLocation("Address not found");
                    setLoaded(true);
                });
        }
    }, [point?.id, point?.lng, point?.lat]);

    // Handle Live Updates
    const handleChange = (field, value) => {
        const update = { [field]: value };
        
        // Semantic sync for complex objects
        if (field === "unitList") {
            update.extra_info = { 
                ...point.extra_info, 
                units: value.split(",").map(u => u.trim()).filter(u => u) 
            };
            delete update.unitList;
        }

        onUpdate({ ...point, ...update });
    };

    if (!point) return null;

    return (
        <div className="sidebar-container glass-container">
            <div className="sidebar-header">
                <div className="sidebar-title-row">
                    <span className="sidebar-title">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Details
                    </span>
                    {hasStagedChanges && <UnsavedIndicator />}
                </div>
                <button 
                    className={`pin-button ${isPinned ? "active" : ""}`} 
                    onClick={onPinToggle}
                    title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M7 6v1b0 0 0 4 4v5l-1 3v1h10v-1l-1-3v-5a4 4 0 0 0-4-4V6z" />
                        <line x1="12" y1="17" x2="12" y2="22" />
                    </svg>
                </button>
            </div>

            <div className="sidebar-form">
                <div className="sidebar-group">
                    <label className="sidebar-label">Name</label>
                    <input 
                        type="text" 
                        className="sidebar-input"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            handleChange("name", e.target.value);
                        }}
                    />
                </div>

                <div className="sidebar-group">
                    <label className="sidebar-label">Location</label>
                    <input 
                        type="text" 
                        className="sidebar-input"
                        value={location || "Loading..."}
                        disabled
                    />
                </div>

                <div className="sidebar-group">
                    <label className="sidebar-label">Type</label>
                    <select 
                        className="sidebar-select"
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            handleChange("type", e.target.value);
                        }}
                    >
                        {["home", "apartment", "unit"].includes(point.type) ? (
                            <>
                                <option value="home">Home</option>
                                <option value="apartment">Apartment</option>
                                <option value="unit">Unit</option>
                            </>
                        ) : (
                            <>
                                <option value="point">Point</option>
                                <option value="radius">Radius</option>
                                <option value="line">Line</option>
                            </>
                        )}
                    </select>
                </div>

                {type === "apartment" && (
                    <div className="sidebar-group">
                        <label className="sidebar-label">Units / Rooms (CSV)</label>
                        <textarea 
                            className="sidebar-textarea"
                            value={unitList}
                            onChange={(e) => {
                                setUnitList(e.target.value);
                                handleChange("unitList", e.target.value);
                            }}
                            placeholder="e.g. 101, 102"
                        />
                    </div>
                )}

                {type === "unit" && (
                    <div className="sidebar-group">
                        <label className="sidebar-label">Parent Property</label>
                        <select 
                            className="sidebar-select"
                            value={parentId}
                            onChange={(e) => {
                                setParentId(e.target.value);
                                handleChange("parent_id", e.target.value);
                            }}
                        >
                            <option value="">-- No Connection --</option>
                            {allPoints.filter(p => (p.type === "unit" || p.type === "home" || p.type === "apartment") && p.id !== point.id).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {type === "radius" && (
                    <div className="sidebar-group">
                        <label className="sidebar-label">Radius (meters)</label>
                        <input 
                            type="number" 
                            className="sidebar-input"
                            value={radius}
                            onChange={(e) => {
                                setRadius(e.target.value);
                                handleChange("radius", e.target.value);
                            }}
                            step="0.01"
                        />
                    </div>
                )}

                {type === "point" && (
                    <div className="sidebar-group">
                        <label className="sidebar-label">Icon / Emoji</label>
                        <input 
                            type="text" 
                            className="sidebar-input"
                            value={icon}
                            onChange={(e) => {
                                setIcon(e.target.value);
                                handleChange("icon", e.target.value);
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                {!confirmingDelete ? (
                    <button 
                        className="delete-action-btn"
                        onClick={() => setConfirmingDelete(true)}
                    >
                        Delete Property
                    </button>
                ) : (
                    <div className="confirm-delete-row">
                        <button 
                            className="confirm-cancel-btn"
                            onClick={() => setConfirmingDelete(false)}
                        >
                            Cancel
                        </button>
                        <button 
                            className="confirm-delete-btn"
                            onClick={() => onDelete(point.id)}
                        >
                            Confirm Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
