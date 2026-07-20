import PropertyDetailsSidebar from "./PropertyDetailsSidebar/PropertyDetailsSidebar";


export default function DetailPanel({
    selectedPoint, canvasObjects,
    addCanvasObjects, deleteCanvasObjects,
    isPinned, onPinToggle, handleCloseSidebar, setSelectedPoint
}) {
    if (!selectedPoint) return null;

    return (
        <aside className="absolute top-0 right-0 h-full w-96 bg-background border-l z-40 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-200">
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
