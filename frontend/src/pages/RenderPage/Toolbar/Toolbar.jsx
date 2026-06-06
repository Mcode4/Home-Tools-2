export default function Toolbar({
    selectedShape, updateShape, deleteShape, duplicateShape,
    showOffset, onToggleOffset, onOffset, offsetDistance = 1, onOffsetDistanceChange,
    vertexMode, selectedVertexIndex = -1, onToggleVertexMode, onAddVertex, onRemoveVertex, onChamfer, onFillet,
    multiSelectIds = [], onBooleanOp
}) {
    if (!selectedShape && multiSelectIds.length === 0) return null;

    const isPolygon = selectedShape && (selectedShape.type === "polygon" || Array.isArray(selectedShape.points));
    const vertexCount = isPolygon && Array.isArray(selectedShape.points) ? selectedShape.points.length : 0;
    const hasMultiSelect = multiSelectIds.length >= 2;
    const hasSelectedShape = !!selectedShape;
    const hasSelectedVertex = selectedVertexIndex >= 0;
    const offsetValue = Math.min(100, Math.max(0, Math.abs(Number(offsetDistance) || 0)));

    return (
        <div className="render-floating-toolbar">
            {hasSelectedShape && !hasMultiSelect && (
                <>
                    <button className="tb-btn" onClick={() => updateShape({ ...selectedShape, rotation: (selectedShape.rotation || 0) - 15 })} title="Rotate Left">↺</button>
                    <button className="tb-btn" onClick={() => updateShape({ ...selectedShape, rotation: (selectedShape.rotation || 0) + 15 })} title="Rotate Right">↻</button>
                    <span className="tb-sep" />
                    <button className="tb-btn" onClick={duplicateShape} title="Duplicate">⧉</button>
                    <button className="tb-btn tb-danger" onClick={deleteShape} title="Delete">🗑</button>
                </>
            )}

            {hasMultiSelect && (
                <>
                    <span className="tb-sep" />
                    <span style={{ fontSize: 11, color: "var(--text-dim)", padding: "0 4px" }}>{multiSelectIds.length} selected</span>
                    <button className="tb-btn" onClick={() => onBooleanOp?.("union")} title="Union">⊕</button>
                    <button className="tb-btn" onClick={() => onBooleanOp?.("subtract")} title="Subtract">⊖</button>
                    <button className="tb-btn" onClick={() => onBooleanOp?.("intersect")} title="Intersect">⊗</button>
                </>
            )}

            {hasSelectedShape && !hasMultiSelect && (
                <>
                    <span className="tb-sep" />
                    <button className={`tb-btn${showOffset ? " tb-btn-active" : ""}`} onClick={onToggleOffset} title="Offset">⊞</button>
                </>
            )}

            {isPolygon && vertexMode && (
                <>
                    <span className="tb-sep" />
                    <span style={{ fontSize: 11, color: "var(--accent)", padding: "0 4px" }}>Vertices: {vertexCount}</span>
                    <button className="tb-btn" onClick={onAddVertex} title="Add Vertex (click edge)">＋</button>
                    <button className="tb-btn" onClick={onRemoveVertex} disabled={!hasSelectedVertex || vertexCount <= 3} title="Remove Vertex">－</button>
                    <button className="tb-btn" onClick={onChamfer} disabled={!hasSelectedVertex} title="Chamfer">⌐</button>
                    <button className="tb-btn" onClick={onFillet} disabled={!hasSelectedVertex} title="Fillet">⌒</button>
                </>
            )}

            {showOffset && (
                <>
                    <span className="tb-sep" />
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input
                            type="number"
                            className="toolbar-number-input"
                            value={offsetDistance}
                            onChange={e => onOffsetDistanceChange?.(e.target.value)}
                            step={0.1}
                            min={0}
                            max={100}
                            placeholder="1.0"
                            title="Offset distance in meters"
                        />
                        <button className="tb-btn" disabled={!offsetValue} onClick={() => onOffset?.(offsetValue)} title="Expand">⊞</button>
                        <button className="tb-btn" disabled={!offsetValue} onClick={() => onOffset?.(-offsetValue)} title="Contract">⊟</button>
                    </div>
                </>
            )}

            {isPolygon && !hasMultiSelect && !showOffset && !vertexMode && (
                <>
                    <span className="tb-sep" />
                    <button className="tb-btn" onClick={onToggleVertexMode} title="Vertex Mode">✎</button>
                </>
            )}
        </div>
    );
}
