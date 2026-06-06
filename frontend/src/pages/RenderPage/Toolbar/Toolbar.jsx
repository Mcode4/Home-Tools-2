export default function Toolbar({ selectedShape, updateShape, deleteShape, duplicateShape, showOffset, onOffset }) {
    if (!selectedShape) return null;

    return (
        <div className="render-floating-toolbar">
            <button className="tb-btn" onClick={() => updateShape({ ...selectedShape, rotation: (selectedShape.rotation || 0) - 15 })} title="Rotate Left">↺</button>
            <button className="tb-btn" onClick={() => updateShape({ ...selectedShape, rotation: (selectedShape.rotation || 0) + 15 })} title="Rotate Right">↻</button>
            <span className="tb-sep" />
            <button className="tb-btn" onClick={duplicateShape} title="Duplicate">⧉</button>
            <button className="tb-btn tb-danger" onClick={deleteShape} title="Delete">🗑</button>
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
        </div>
    );
}