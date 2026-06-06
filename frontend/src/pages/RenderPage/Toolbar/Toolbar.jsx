export default function Toolbar({
    selectedShape, updateShape, deleteShape, duplicateShape,
    showOffset, onOffset,
    vertexMode, onToggleVertexMode, onAddVertex, onRemoveVertex, onChamfer, onFillet,
    multiSelectIds, onBooleanOp
}) {
    if (!selectedShape && multiSelectIds.length === 0) return null;

    const isPolygon = selectedShape && (selectedShape.type === "polygon" || Array.isArray(selectedShape.points));
    const vertexCount = isPolygon && Array.isArray(selectedShape.points) ? selectedShape.points.length : 0;
    const hasMultiSelect = multiSelectIds.length >= 2;

    return (
        <div className="render-floating-toolbar">
            <button className="tb-btn" onClick={() => updateShape({ ...selectedShape, rotation: (selectedShape.rotation || 0) - 15 })} title="Rotate Left">↺</button>
            <button className="tb-btn" onClick={() => updateShape({ ...selectedShape, rotation: (selectedShape.rotation || 0) + 15 })} title="Rotate Right">↻</button>
            <span className="tb-sep" />
            <button className="tb-btn" onClick={duplicateShape} title="Duplicate">⧉</button>
            <button className="tb-btn tb-danger" onClick={deleteShape} title="Delete">🗑</button>

            {hasMultiSelect && (
                <>
                    <span className="tb-sep" />
                    <span style={{ fontSize: 11, color: "var(--text-dim)", padding: "0 4px" }}>{multiSelectIds.length} selected</span>
                    <button className="tb-btn" onClick={() => onBooleanOp?.("union")} title="Union">⊕</button>
                    <button className="tb-btn" onClick={() => onBooleanOp?.("subtract")} title="Subtract">⊖</button>
                    <button className="tb-btn" onClick={() => onBooleanOp?.("intersect")} title="Intersect">⊗</button>
                </>
            )}

            {isPolygon && vertexMode && (
                <>
                    <span className="tb-sep" />
                    <span style={{ fontSize: 11, color: "var(--accent)", padding: "0 4px" }}>Vertices: {vertexCount}</span>
                    <button className="tb-btn" onClick={onAddVertex} title="Add Vertex (click edge)">＋</button>
                    <button className="tb-btn" onClick={onRemoveVertex} disabled={vertexCount <= 3} title="Remove Vertex">－</button>
                    <button className="tb-btn" onClick={onChamfer} title="Chamfer">⌐</button>
                    <button className="tb-btn" onClick={onFillet} title="Fillet">⌒</button>
                </>
            )}

            {showOffset && (
                <>
                    <span className="tb-sep" />
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input
                            type="number"
                            className="input"
                            style={{ width: 60, height: 28, fontSize: 12, padding: "0 4px" }}
                            value={0}
                            onChange={e => e.target.value}
                            step={0.1}
                            min={-100}
                            max={100}
                            placeholder="0.0"
                            title="Offset distance in meters"
                        />
                        <button className="tb-btn" onClick={() => onOffset?.(Math.abs(Number(document.querySelector('.render-floating-toolbar input').value) || 0))} title="Expand">⊞</button>
                        <button className="tb-btn" onClick={() => onOffset?.(-Math.abs(Number(document.querySelector('.render-floating-toolbar input').value) || 0))} title="Contract">⊟</button>
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