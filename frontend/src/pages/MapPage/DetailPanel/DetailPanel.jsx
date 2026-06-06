import PropertyDetailsSidebar from "./PropertyDetailsSidebar/PropertyDetailsSidebar";
import "./DetailPanel.css";

export default function DetailPanel({
    selectedPoint, canvasObjects,
    addCanvasObjects, deleteCanvasObjects,
    isPinned, onPinToggle, handleCloseSidebar, setSelectedPoint
}) {
    if (!selectedPoint) return null;

    return (
        <aside className="app-slider-right">
            <PropertyDetailsSidebar
                point={selectedPoint}
                onClose={handleCloseSidebar}
                onUpdate={addCanvasObjects}
                onDelete={(id) => { deleteCanvasObjects(id); setSelectedPoint(null); }}
                allPoints={Object.values(canvasObjects)}
                isPinned={isPinned}
                onPinToggle={onPinToggle}
            />
        </aside>
    )
}
