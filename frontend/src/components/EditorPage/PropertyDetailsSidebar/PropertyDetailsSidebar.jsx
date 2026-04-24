import { useState, useEffect, useMemo, useRef } from "react";
import { Tree } from "react-arborist";
import UnsavedIndicator from "./UnsavedIndicator";
import { reverseLookupAddress } from "../../../functions/search/search";
import { useLocalStorageWithTTL } from "../../../hooks/useLocalStorageWithTTL";
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
    const [activeTab, setActiveTab] = useState("general");
    const [name, setName] = useState("");
    const [location, setLocation] = useState(null);
    const [icon, setIcon] = useState("");
    const [type, setType] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [hasStagedChanges, setHasStagedChanges] = useState(false);

    // Hierarchy State
    const [hierarchy, setHierarchy] = useState({ dimensions: null, notes: [], floors: [] });
    // Selection state for tree
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [treeSearch, setTreeSearch] = useState("");

    // Sync internal state with selected point
    useEffect(() => {
        if (!point) return;

        let cleanName = point.name || "";
        if (cleanName.includes("(Unsaved)")) {
            cleanName = cleanName.split("(Unsaved)")[1].trim();
            setHasStagedChanges(true);
        } else {
            setHasStagedChanges(point.source === "canvas" || point.source === "mod");
        }

        setName(cleanName);
        setType(point.type === "icon" ? "marker" : (point.type || "marker"));
        setIcon(point.icon || "");
        setConfirmingDelete(false);

        // Initialize Hierarchy from point or legacy data
        if (point.hierarchy) {
            setHierarchy(point.hierarchy);
        } else {
            // Legacy Migration (Soft)
            const legacyFloorsCount = point.extra_info?.floors || 1;
            const legacyUnits = point.extra_info?.units || [];
            
            const initialFloors = Array.from({ length: legacyFloorsCount }, (_, i) => ({
                id: `floor-${Date.now()}-${i}`,
                name: `Floor ${i + 1}`,
                dimensions: null,
                notes: [],
                rooms: i === 0 ? legacyUnits.map((u, ui) => ({
                    id: `room-${Date.now()}-${ui}`,
                    name: u,
                    dimensions: null,
                    notes: []
                })) : []
            }));

            setHierarchy({
                dimensions: null,
                notes: [],
                floors: initialFloors
            });
        }

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
    }, [point?.id, point?.lng, point?.lat, point?.type]);

    // Format hierarchy for React Arborist
    const treeData = useMemo(() => {
        if (!point) return [];
        
        const root = {
            id: 'root',
            name: name || "Property",
            type: 'property',
            children: [
                ...hierarchy.floors.map(f => ({
                    id: f.id,
                    name: f.name,
                    type: 'floor',
                    children: [
                        ...f.rooms.map(r => ({
                            id: r.id,
                            name: r.name,
                            type: 'room',
                            children: r.notes.map(n => ({
                                id: n.id,
                                name: n.title || "Untitled Note",
                                type: 'note'
                            }))
                        })),
                        ...f.notes.map(n => ({
                            id: n.id,
                            name: n.title || "Untitled Note",
                            type: 'note'
                        }))
                    ]
                })),
                ...hierarchy.notes.map(n => ({
                    id: n.id,
                    name: n.title || "Untitled Note",
                    type: 'note'
                }))
            ]
        };
        return [root];
    }, [hierarchy, name, point]);

    // Handle Live Updates
    const handleChange = (field, value) => {
        const update = { [field]: value };
        onUpdate({ ...point, ...update });
    };

    const handleHierarchyChange = (newHierarchy) => {
        setHierarchy(newHierarchy);
        onUpdate({ ...point, hierarchy: newHierarchy });
    };

    const handleCreateChild = (parentId, type) => {
        const newNode = {
            id: `${type}-${Date.now()}`,
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            dimensions: null,
            notes: [],
            rooms: type === 'floor' ? [] : undefined
        };

        const newHierarchy = { ...hierarchy };
        if (parentId === 'root') {
            if (type === 'floor') newHierarchy.floors.push(newNode);
            if (type === 'note') newHierarchy.notes.push({ id: newNode.id, title: newNode.name, content: "", type: "inspection" });
        } else {
            // Find parent and add
            const floor = newHierarchy.floors.find(f => f.id === parentId);
            if (floor) {
                if (type === 'room') floor.rooms.push(newNode);
                if (type === 'note') floor.notes.push({ id: newNode.id, title: newNode.name, content: "", type: "inspection" });
            } else {
                newHierarchy.floors.forEach(f => {
                    const room = f.rooms.find(r => r.id === parentId);
                    if (room && type === 'note') {
                        room.notes.push({ id: newNode.id, title: newNode.name, content: "", type: "inspection" });
                    }
                });
            }
        }
        handleHierarchyChange(newHierarchy);
    };

    const handleRenameNode = (id, newName) => {
        const newHierarchy = { ...hierarchy };
        // Deep search and rename
        if (id === 'root') return; // Controlled by General tab

        let found = false;
        newHierarchy.floors.forEach(f => {
            if (f.id === id) { f.name = newName; found = true; }
            if (!found) {
                f.rooms.forEach(r => {
                    if (r.id === id) { r.name = newName; found = true; }
                    if (!found) {
                        r.notes.forEach(n => {
                            if (n.id === id) { n.title = newName; found = true; }
                        });
                    }
                });
                f.notes.forEach(n => {
                    if (n.id === id) { n.title = newName; found = true; }
                });
            }
        });
        newHierarchy.notes.forEach(n => {
            if (n.id === id) { n.title = newName; found = true; }
        });

        if (found) handleHierarchyChange(newHierarchy);
    };

    const handleDeleteNode = (id) => {
        let newHierarchy = { ...hierarchy };
        newHierarchy.floors = newHierarchy.floors.filter(f => f.id !== id);
        newHierarchy.floors.forEach(f => {
            f.rooms = f.rooms.filter(r => r.id !== id);
            f.notes = f.notes.filter(n => n.id !== id);
            f.rooms.forEach(r => {
                r.notes = r.notes.filter(n => n.id !== id);
            });
        });
        newHierarchy.notes = newHierarchy.notes.filter(n => n.id !== id);
        handleHierarchyChange(newHierarchy);
    };

    // Node Component for Arborist
    const Node = ({ node, style, dragHandle, tree }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [tempName, setTempName] = useState(node.data.name);

        const onEdit = () => {
            setIsEditing(true);
            setTempName(node.data.name);
        };

        const onSave = () => {
            setIsEditing(false);
            handleRenameNode(node.id, tempName);
        };

        return (
            <div 
                style={style} 
                ref={dragHandle}
                className={`node-container ${node.isSelected ? 'selected' : ''}`}
                onClick={() => {
                    node.select();
                    setSelectedNodeId(node.id);
                }}
            >
                <div className="node-icon">
                    {node.data.type === 'property' && '🏠'}
                    {node.data.type === 'floor' && '🪜'}
                    {node.data.type === 'room' && '🚪'}
                    {node.data.type === 'note' && '📝'}
                </div>
                
                {isEditing ? (
                    <input 
                        className="node-edit-input"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={onSave}
                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                        autoFocus
                    />
                ) : (
                    <span className="node-text">{node.data.name}</span>
                )}

                <div className="node-actions">
                    {node.data.type === 'property' && (
                        <>
                            <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); handleCreateChild('root', 'floor'); }}>➕🪜</button>
                            <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); handleCreateChild('root', 'note'); }}>➕📝</button>
                        </>
                    )}
                    {node.data.type === 'floor' && (
                        <>
                            <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); handleCreateChild(node.id, 'room'); }}>➕🚪</button>
                            <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); handleCreateChild(node.id, 'note'); }}>➕📝</button>
                        </>
                    )}
                    {node.data.type === 'room' && (
                        <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); handleCreateChild(node.id, 'note'); }}>➕📝</button>
                    )}
                    {node.data.type !== 'property' && (
                        <>
                            <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>✏️</button>
                            <button className="node-action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}>🗑️</button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    if (!point) return null;

    return (
        <div className="sidebar-container">
            {hasStagedChanges && (
                <div className="staged-banner">
                    <UnsavedIndicator pulseOnly />
                    <span>STAGED CHANGES</span>
                </div>
            )}
            <div className="sidebar-header">
                <div className="sidebar-header-titles">
                    <h3 className="sidebar-main-title">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Details
                    </h3>
                    <p className="sidebar-subtitle">Editing {point.name || "Unnamed Point"}</p>
                </div>
                <button
                    className={`pin-button ${isPinned ? "active" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPinToggle();
                    }}
                    title={isPinned ? "Unpin sidebar (Volatile Mode)" : "Pin sidebar (Persistent Mode)"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 6v1b0 0 0 4 4v5l-1 3v1h10v-1l-1-3v-5a4 4 0 0 0-4-4V6z" />
                        <line x1="12" y1="17" x2="12" y2="22" />
                    </svg>
                </button>
            </div>

            <div className="sidebar-tabs">
                <button 
                    className={`sidebar-tab ${activeTab === "general" ? "active" : ""}`}
                    onClick={() => setActiveTab("general")}
                >
                    General
                </button>
                <button 
                    className={`sidebar-tab ${activeTab === "structure" ? "active" : ""}`}
                    onClick={() => setActiveTab("structure")}
                >
                    Structure
                </button>
                <button 
                    className={`sidebar-tab ${activeTab === "details" ? "active" : ""}`}
                    onClick={() => setActiveTab("details")}
                >
                    Details
                </button>
            </div>

            <div className="sidebar-form">
                {activeTab === "general" && (
                    <>
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
                            <div className="sidebar-coords">
                                <span>LAT: {point.lat?.toFixed(6)}</span>
                                <span>LNG: {point.lng?.toFixed(6)}</span>
                            </div>
                        </div>

                        <div className="sidebar-group">
                            <label className="sidebar-label">Address</label>
                            <input
                                type="text"
                                className="sidebar-input sidebar-readonly"
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
                                <option value="marker">Marker</option>
                                <option value="home">Home</option>
                                <option value="apartment">Apartment</option>
                                <option value="unit">Unit</option>
                            </select>
                        </div>
                    </>
                )}

                {activeTab === "structure" && (
                    <div className="sidebar-tree-container">
                        <input 
                            type="text" 
                            className="tree-search-input"
                            placeholder="Search points..."
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                        />
                        <div style={{ height: '400px' }}>
                            <Tree
                                data={treeData}
                                searchTerm={treeSearch}
                                searchMatch={(node, term) => 
                                    node.data.name.toLowerCase().includes(term.toLowerCase())
                                }
                                width={240}
                                height={400}
                                indent={16}
                                rowHeight={32}
                            >
                                {Node}
                            </Tree>
                        </div>
                    </div>
                )}

                {activeTab === "details" && (
                    <div className="sidebar-group">
                        {selectedNodeId ? (
                            <p>Editing Node: {selectedNodeId}</p>
                        ) : (
                            <p className="sidebar-subtitle">Select a node in Structure to edit details</p>
                        )}
                    </div>
                )}
            </div>

            <div className="sidebar-footer">
                <button
                    className="apply-action-btn"
                    onClick={onClose}
                >
                    Apply Changes
                </button>

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
