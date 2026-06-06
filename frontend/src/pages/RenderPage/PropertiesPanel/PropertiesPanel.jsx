import { useState, useEffect, useRef, useCallback } from "react";
import ObjectProperties from "./ObjectProperties";
import { getOutlineArea, getOutlinePerimeter, metersToUnit, metersToAreaUnit } from "../../../functions/outlineValidation";

const ROOM_TYPES = [
    { value: "bedroom", label: "Bedroom" },
    { value: "bathroom", label: "Bathroom" },
    { value: "kitchen", label: "Kitchen" },
    { value: "living_room", label: "Living Room" },
    { value: "dining_room", label: "Dining Room" },
    { value: "office", label: "Office" },
    { value: "garage", label: "Garage" },
    { value: "closet", label: "Closet" },
    { value: "hallway", label: "Hallway" },
    { value: "other", label: "Other" },
];

export default function PropertiesPanel({
    stage, selectedShape, updateShape,
    floors, elements, activeFloorId, selectedLevel, onSelectLevel,
    onSelectFloor, onSelectShape,
    addFloor, addRoomToFloor,
    deleteElement, moveElement, outlines, addLevel,
    objects, selectedObjectId, onSelectObject, onUpdateObject,
    vertexMode = false, selectedVertexIndex = -1, onSelectVertex,
    multiSelectIds = [],
    validationResults = { isValid: true, warnings: [], measurements: [] },
    showMeasurements = false,
    unit = "metric",
}) {
    const containerRef = useRef(null);
    const [splitHeight, setSplitHeight] = useState(250);
    const [isDragging, setIsDragging] = useState(false);
    const [expandedFloors, setExpandedFloors] = useState({});

    const toggleFloor = (fid) => setExpandedFloors(prev => ({ ...prev, [fid]: !(prev[fid] ?? true) }));
    const toggleLevel = (lvl) => setExpandedFloors(prev => ({ ...prev, [`level-${lvl}`]: !(prev[`level-${lvl}`] ?? true) }));

    const handleMouseDown = useCallback((e) => { setIsDragging(true); e.preventDefault(); }, []);

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            setSplitHeight(Math.max(120, Math.min(relY, rect.height - 120)));
        };
        const onUp = () => setIsDragging(false);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    }, [isDragging]);

    const s = selectedShape;
    const update = (changes) => s && updateShape({ ...s, ...changes });
    const roundSize = (value) => Math.round((Number(value) || 0) * 100) / 100;
    const roundCoordinate = (value) => Math.round((Number(value) || 0) * 1000000) / 1000000;

    const roomColors = {
        bedroom: "#6366f1", bathroom: "#22c55e", kitchen: "#f59e0b",
        living_room: "#06b6d4", dining_room: "#a855f7", office: "#ec4899",
        garage: "#78716c", closet: "#a1a1aa", hallway: "#d4d4d8", other: "#888",
    };
    const elementLabel = (el) => {
        const t = el.type || "shape";
        if (t === "room") return (el.roomType || "room").replace("_", " ");
        if (t === "wall") return el.wallType === "wall_square" ? "Full Wall" : "Section Wall";
        if (t === "divider_line") return "Divider Line";
        return t;
    };

    // Objects mode — placed objects list + property editing
    if (stage === "objects") {
        const selectedObj = objects?.find(o => o.id === selectedObjectId) || null;
        const rooms = elements?.filter(el => el.type === "room" && el.floor_id && el.sectionRole !== "base") || [];
        const visibleFloorIds = new Set(rooms.map(room => room.floor_id));
        const visibleRoomIds = new Set(rooms.map(room => room.id));
        const visibleObjects = (objects || []).filter(obj => {
            if (!visibleFloorIds.size) return true;
            return visibleFloorIds.has(obj.floor_id) || visibleRoomIds.has(obj.room_id);
        });

        return (
            <aside className="app-slider-right" ref={containerRef}>
                <div className="render-props-section" style={{ height: splitHeight, overflow: "auto", flexShrink: 0 }}>
                    <h4 className="render-props-title">Objects ({visibleObjects.length})</h4>
                    {visibleObjects.length === 0 && (
                        <p style={{ fontSize: 13, color: "var(--text-dim)", padding: 8 }}>
                            Select furniture from the catalog to place
                        </p>
                    )}
                    <div className="render-tree">
                        {visibleObjects.map(obj => (
                            <div key={obj.id} className="render-tree-node"
                                onClick={() => onSelectObject?.(obj.id)}
                                style={obj.id === selectedObjectId ? { background: "var(--active-bg)", color: "#fff" } : {}}>
                                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{obj.icon || "📦"}</span>
                                <span style={{ flex: 1 }}>{obj.name || "Object"}</span>
                                <button className="tb-btn" style={{ width: 18, height: 18, fontSize: 10, color: "var(--danger)" }}
                                    onClick={(e) => { e.stopPropagation(); deleteElement?.(obj.id); }} title="Delete">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="split-divider" onMouseDown={handleMouseDown}>
                    <div className="divider-handle"></div>
                </div>
                <div className="render-props-section" style={{ flex: 1, overflow: "auto", paddingTop: 12 }}>
                    <ObjectProperties
                        selectedObject={selectedObj}
                        onUpdateObject={onUpdateObject}
                        rooms={rooms}
                    />
                </div>
            </aside>
        );
    }

    // Sections mode — Level → Outline → Rooms hierarchy
    if (stage === "sections") {
        const sectionFloors = outlines || [];
        const sectionItems = elements || [];
        const levels = [...new Set(sectionFloors.map(f => f.level || 1))].sort((a, b) => a - b);

        return (
            <aside className="app-slider-right" ref={containerRef}>
                <div className="render-props-section" style={{ height: splitHeight, overflow: "auto", flexShrink: 0 }}>
                    <h4 className="render-props-title">Floor Levels</h4>
                    {levels.length === 0 && (
                        <p style={{ fontSize: 13, color: "var(--text-dim)", padding: 8 }}>
                            Add outlines in the Outline stage first
                        </p>
                    )}
                    <div className="render-tree">
                        {levels.map(lvl => {
                            const isLevelExpanded = expandedFloors[`level-${lvl}`] ?? true;
                            const lvlFloors = sectionFloors.filter(f => (f.level || 1) === lvl);
                            const isSelectedLevel = lvl === selectedLevel;
                            return (
                                <div key={lvl}>
                                    <div className="render-tree-node"
                                        onClick={() => { onSelectLevel(lvl); toggleLevel(lvl); }}
                                        style={{ fontWeight: 600, color: isSelectedLevel ? "var(--accent)" : "var(--text-main)" }}>
                                        <span style={{ fontSize: 11, width: 14 }}>{isLevelExpanded ? "▼" : "▶"}</span>
                                        <span>Level {lvl}</span>
                                        <span style={{ color: "var(--text-dim)", fontSize: 11, marginLeft: "auto" }}>
                                            {lvlFloors.length} outline{(lvlFloors.length !== 1 ? "s" : "")}
                                        </span>
                                    </div>
                                    {isLevelExpanded && isSelectedLevel && (
                                        <div className="render-tree" style={{ marginLeft: 12 }}>
                                            {lvlFloors.map(outline => {
                                                const outlineRooms = sectionItems.filter(r => r.floor_id === outline.id && r.type === "room" && r.sectionRole !== "base");
                                                const isOutlineExpanded = expandedFloors[outline.id] ?? true;
                                                const isOutlineActive = outline.id === activeFloorId;
                                                return (
                                                    <div key={outline.id}>
                                                        <div className="render-tree-node"
                                                            onClick={() => { onSelectFloor(outline.id); toggleFloor(outline.id); }}
                                                            style={isOutlineActive ? { background: "var(--active-bg)", color: "#fff" } : {}}>
                                                            <span style={{ fontSize: 11, width: 14 }}>{isOutlineExpanded ? "▼" : "▶"}</span>
                                                            <span style={{ flex: 1 }}>{outline.name || outline.type || "Outline"}</span>
                                                            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
                                                                {outlineRooms.length} room{(outlineRooms.length !== 1 ? "s" : "")}
                                                            </span>
                                                        </div>
                                                        {isOutlineExpanded && (
                                                            <div className="render-tree" style={{ marginLeft: 12 }}>
                                                                {outlineRooms.length === 0 ? (
                                                                    <p style={{ fontSize: 12, color: "var(--text-dim)", padding: "4px 8px" }}>
                                                                        No rooms yet — use Divider or Pad tools
                                                                    </p>
                                                                ) : (
                                                                    outlineRooms.map(room => {
                                                                        const roomWalls = sectionItems.filter(w => w.type === "wall" && w.parent_id === room.id);
                                                                        return (
                                                                            <div key={room.id}>
                                                                                <div className="render-tree-node render-tree-child"
                                                                                    onClick={() => onSelectShape?.(room.id)}
                                                                                    style={room.id === selectedShape?.id ? { background: "var(--active-bg)", color: "#fff" } : {}}>
                                                                                    <span style={{ fontSize: 10, color: roomColors[room.roomType] || "var(--accent)" }}>●</span>
                                                                                    <span style={{ flex: 1 }}>{room.name || room.roomType || "room"}</span>
                                                                                    <button className="tb-btn" style={{ width: 16, height: 16, fontSize: 9, color: "var(--danger)" }}
                                                                                        onClick={(e) => { e.stopPropagation(); deleteElement?.(room.id); }} title="Delete">✕</button>
                                                                                </div>
                                                                                {roomWalls.map(wall => (
                                                                                    <div key={wall.id} className="render-tree-node render-tree-child"
                                                                                        onClick={() => onSelectShape?.(wall.id)}
                                                                                        style={{ marginLeft: 16, ...(wall.id === selectedShape?.id ? { background: "var(--active-bg)", color: "#fff" } : {}) }}>
                                                                                        <span style={{ fontSize: 10, color: "#d4d4d8" }}>▮</span>
                                                                                        <span style={{ flex: 1 }}>{wall.name || elementLabel(wall)}</span>
                                                                                        <button className="tb-btn" style={{ width: 16, height: 16, fontSize: 9, color: "var(--danger)" }}
                                                                                            onClick={(e) => { e.stopPropagation(); deleteElement?.(wall.id); }} title="Delete">✕</button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ padding: "8px 0" }}>
                        <button className="tb-btn" style={{ width: "calc(100% - 16px)", margin: "0 8px", padding: "6px 12px", fontSize: 12 }}
                            onClick={() => addLevel?.()}>
                            + Add Level
                        </button>
                    </div>
                </div>
                <div className="split-divider" onMouseDown={handleMouseDown}>
                    <div className="divider-handle"></div>
                </div>
                <div className="render-props-section" style={{ flex: 1, overflow: "auto", paddingTop: 12 }}>
                    {s ? (
                        <>
                            <h4 className="render-props-title">{s.name || elementLabel(s)}</h4>
                            <div className="props-section" style={{ border: "none" }}>
                                <label>Name</label>
                                <input type="text" className="input" value={s.name || ""} onChange={e => update({ name: e.target.value })} />
                            </div>
                            {s.roomType !== undefined && (
                                <div className="props-section">
                                    <label>Type</label>
                                    <select className="input" value={s.roomType || "other"} onChange={e => update({ roomType: e.target.value })}>
                                        {ROOM_TYPES.map(rt => (
                                            <option key={rt.value} value={rt.value}>{rt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {s.type === "divider_line" ? (
                                <div className="props-section">
                                    <label>X1</label><input type="number" value={Math.round(s.x1 || 0)} onChange={e => update({ x1: Number(e.target.value) })} />
                                    <label>Y1</label><input type="number" value={Math.round(s.y1 || 0)} onChange={e => update({ y1: Number(e.target.value) })} />
                                    <label>X2</label><input type="number" value={Math.round(s.x2 || 0)} onChange={e => update({ x2: Number(e.target.value) })} />
                                    <label>Y2</label><input type="number" value={Math.round(s.y2 || 0)} onChange={e => update({ y2: Number(e.target.value) })} />
                                </div>
                            ) : (
                                <>
                                    <div className="props-section">
                                        <label>X</label><input type="number" value={Math.round(s.x || 0)} onChange={e => update({ x: Number(e.target.value) })} />
                                        <label>Y</label><input type="number" value={Math.round(s.y || 0)} onChange={e => update({ y: Number(e.target.value) })} />
                                    </div>
                                    {s.width !== undefined && <div className="props-section">
                                        <label>Width</label><input type="number" value={Math.round(s.width)} onChange={e => update({ width: Number(e.target.value) })} />
                                        <label>Height</label><input type="number" value={Math.round(s.height)} onChange={e => update({ height: Number(e.target.value) })} />
                                    </div>}
                                    <div className="props-section" style={{ border: "none" }}>
                                        <label>Fill</label><input type="color" value={s.fill || "#6366f1"} onChange={e => update({ fill: e.target.value })} />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <p style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: 20 }}>
                            Select a room to edit properties
                        </p>
                    )}
                </div>
            </aside>
        );
    }

    // Outline mode — shapes/properties only, no floors
    return (
        <aside className="app-slider-right" ref={containerRef}>
            <div className="render-props-section" style={{ height: splitHeight, overflow: "auto", flexShrink: 0 }}>
                <h4 className="render-props-title">Outlines ({elements.length})</h4>
                {elements.length === 0 && <p style={{ fontSize: 13, color: "var(--text-dim)", padding: 8 }}>Add outlines from the left panel</p>}
                {elements.map(el => (
                    <div key={el.id} className="render-tree-node"
                        onClick={() => onSelectShape?.(el.id)}
                        style={el.id === selectedShape?.id ? { background: "var(--active-bg)", color: "#fff" } : {}}>
                        <span style={{ fontSize: 14, color: "var(--accent)", width: 20, textAlign: "center" }}>
                            {el.type === "circle" ? "○" : el.type === "rectangle" ? "▭" : "⬡"}
                        </span>
                        <span style={{ flex: 1 }}>{el.name || el.type || "shape"}</span>
                        <button className="tb-btn" style={{ width: 18, height: 18, fontSize: 10, color: "var(--danger)" }}
                            onClick={(e) => { e.stopPropagation(); deleteElement?.(el.id); }} title="Delete">✕</button>
                    </div>
                ))}
            </div>
            <div className="split-divider" onMouseDown={handleMouseDown}>
                <div className="divider-handle"></div>
            </div>
            <div className="render-props-section" style={{ flex: 1, overflow: "auto", paddingTop: 12 }}>
                {s ? (
                    <>
                        <h4 className="render-props-title">{s.name || s.type || "Shape"}</h4>
                        <div className="props-section" style={{ border: "none" }}>
                            <label>Name</label><input type="text" className="input" value={s.name || ""} onChange={e => update({ name: e.target.value })} />
                        </div>
                        {s.lat != null && s.lng != null ? (
                            <div className="props-section">
                                <label>Lat</label>
                                <input type="number" step="0.000001" value={roundCoordinate(s.lat)} onChange={e => update({ lat: Number(e.target.value), x: undefined, y: undefined })} />
                                <label>Lng</label>
                                <input type="number" step="0.000001" value={roundCoordinate(s.lng)} onChange={e => update({ lng: Number(e.target.value), x: undefined, y: undefined })} />
                            </div>
                        ) : (
                            <div className="props-section">
                                <label>Screen X</label><input type="number" value={Math.round(s.x || 0)} onChange={e => update({ x: Number(e.target.value) })} />
                                <label>Screen Y</label><input type="number" value={Math.round(s.y || 0)} onChange={e => update({ y: Number(e.target.value) })} />
                            </div>
                        )}
                        {(s.width !== undefined || s.widthMeters !== undefined) && <div className="props-section">
                            <label>{s.widthMeters !== undefined ? "Width (m)" : "Width (px)"}</label>
                            <input
                                type="number"
                                value={s.widthMeters !== undefined ? roundSize(s.widthMeters) : Math.round(s.width || 0)}
                                onChange={e => s.widthMeters !== undefined
                                    ? update({ widthMeters: Number(e.target.value), width: undefined })
                                    : update({ width: Number(e.target.value) })}
                            />
                            <label>{s.heightMeters !== undefined ? "Length (m)" : "Height (px)"}</label>
                            <input
                                type="number"
                                value={s.heightMeters !== undefined ? roundSize(s.heightMeters) : Math.round(s.height || 0)}
                                onChange={e => s.heightMeters !== undefined
                                    ? update({ heightMeters: Number(e.target.value), height: undefined })
                                    : update({ height: Number(e.target.value) })}
                            />
                        </div>}
                        {(s.radius !== undefined || s.radiusMeters !== undefined) && <div className="props-section">
                            <label>{s.radiusMeters !== undefined ? "Radius (m)" : "Radius"}</label>
                            <input
                                type="number"
                                value={s.radiusMeters !== undefined ? roundSize(s.radiusMeters) : Math.round(s.radius || 0)}
                                onChange={e => s.radiusMeters !== undefined
                                    ? update({ radiusMeters: Number(e.target.value), radius: undefined })
                                    : update({ radius: Number(e.target.value) })}
                            />
                        </div>}
                        <div className="props-section" style={{ border: "none" }}>
                            <label>Fill</label><input type="color" value={s.fill || "#6366f1"} onChange={e => update({ fill: e.target.value })} />
                            <label>Stroke Width</label><input type="number" min={0} max={20} step={0.5} value={s.strokeWidth || 2} onChange={e => update({ strokeWidth: Number(e.target.value) })} />
                            <label>Opacity</label><input type="range" min={0.1} max={1} step={0.1} value={s.opacity ?? 1} onChange={e => update({ opacity: Number(e.target.value) })} />
                        </div>

                        {multiSelectIds.length >= 2 && (
                            <div className="props-section" style={{ border: "none", background: "var(--accent-bg)", borderRadius: 4, padding: 8 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Multi-select: {multiSelectIds.length} outlines</div>
                                {multiSelectIds.map((id, i) => {
                                    const o = outlines.find(x => x.id === id);
                                    return o ? (
                                        <div key={id} style={{ fontSize: 12, color: "var(--text-dim)" }}>
                                            {i + 1}. {o.name || o.type || "outline"}
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}

                        {validationResults.warnings.length > 0 && (
                            <div className="props-section" style={{ border: "none", background: "#fee2e2", borderRadius: 4, padding: 8 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4, color: "#991b1b" }}>Validation Warnings</div>
                                {validationResults.warnings.map((w, i) => (
                                    <div key={i} style={{ fontSize: 12, marginBottom: 2, display: "flex", alignItems: "center", gap: 6, color: w.severity === "error" ? "#dc2626" : "#d97706" }}>
                                        <span>{w.severity === "error" ? "✕" : "⚠"}</span>
                                        <span>{w.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showMeasurements && s && (
                            <div className="props-section" style={{ border: "none", background: "var(--accent-bg)", borderRadius: 4, padding: 8 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Measurements</div>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <label style={{ fontWeight: 500 }}>Area:</label>
                                        <span>
                                            {(() => {
                                                const area = getOutlineArea(s);
                                                const { value, label } = metersToAreaUnit(area, unit);
                                                return `${value.toFixed(2)} ${label}`;
                                            })()}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <label style={{ fontWeight: 500 }}>Perimeter:</label>
                                        <span>
                                            {(() => {
                                                const perimeter = getOutlinePerimeter(s);
                                                const { value, label } = metersToUnit(perimeter, unit);
                                                return `${value.toFixed(2)} ${label}`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: 20 }}>Select an outline to edit properties</p>
                )}
            </div>
        </aside>
    );
}
