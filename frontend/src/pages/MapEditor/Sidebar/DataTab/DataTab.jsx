import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, GripVertical } from "lucide-react";
import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function DataTab({ 
    mapProperties, 
    mapPoints, 
    handlePointSelect, 
    deleteCanvasObjects,
    addCanvasObjects,
    mapStore,
    mapId,
    overlaysStore
}) {
    const [openMaps, setOpenMaps] = useState({ [mapId]: true });

    const toggleMapOpen = (mId) => {
        setOpenMaps(prev => ({ ...prev, [mId]: !prev[mId] }));
    };

    const mapGroups = useMemo(() => {
        const groups = {};
        
        // Base Map
        const baseMap = mapStore?.data?.find(m => m.id === Number(mapId));
        groups[mapId] = {
            id: Number(mapId),
            name: baseMap ? baseMap.name : "Main Map",
            items: []
        };

        // Overlays
        if (overlaysStore && overlaysStore.workspaceMapIds) {
            overlaysStore.workspaceMapIds.forEach(oId => {
                const overlayMap = overlaysStore.maps?.find(m => m.id === Number(oId));
                groups[oId] = {
                    id: Number(oId),
                    name: overlayMap ? overlayMap.name : `Layer ${oId}`,
                    items: []
                };
            });
        }

        // Distribute items
        const allItems = [...mapProperties, ...mapPoints];
        allItems.forEach(item => {
            const mId = item.map_id || Number(mapId);
            if (groups[mId]) {
                groups[mId].items.push(item);
            }
        });

        return Object.values(groups);
    }, [mapProperties, mapPoints, mapStore, mapId, overlaysStore]);

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId) return;

        const newMapId = Number(destination.droppableId);
        
        // Find the dragged object
        const allItems = [...mapProperties, ...mapPoints];
        const draggedObj = allItems.find(p => String(p.id) === draggableId);
        
        if (draggedObj) {
            const updatedObj = { ...draggedObj, map_id: newMapId };
            addCanvasObjects(updatedObj);
        }
    };

    const renderItem = (p, index) => {
        const isProperty = ["home", "apartment", "unit"].includes(p.type);
        
        return (
            <Draggable key={String(p.id)} draggableId={String(p.id)} index={index}>
                {(provided, snapshot) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group transition-colors border ${snapshot.isDragging ? 'bg-accent border-border shadow-md z-50' : 'border-transparent hover:border-border'}`}
                        onClick={() => handlePointSelect(p)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div 
                                {...provided.dragHandleProps}
                                className="opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="flex items-center justify-center w-6 h-6 shrink-0">
                                {isProperty ? (
                                    (p.icon && (p.icon.startsWith("http") || p.icon.startsWith("/") || p.icon.startsWith("data:"))) ? <img src={p.icon} alt="Icon" className="w-5 h-5 object-contain" /> :
                                    p.icon ? <span className="text-lg">{p.icon}</span> :
                                    p.type === "home" ? <img src="/icons/home-point.svg" alt="Home" className="dark:invert w-5 h-5" /> :
                                    p.type === "apartment" ? <img src="/icons/building-point.svg" alt="Apartment" className="dark:invert w-5 h-5" /> :
                                    p.type === "unit" ? <img src="/icons/unit-point.svg" alt="Unit" className="dark:invert w-5 h-5" /> :
                                    "📍"
                                ) : (
                                    p.type === "radius" ? "⭕" :
                                    p.type === "line" ? "📏" :
                                    (p.icon && (p.icon.startsWith("http") || p.icon.startsWith("/") || p.icon.startsWith("data:"))) ? <img src={p.icon} alt="Marker" className="w-5 h-5 object-contain" /> :
                                    (p.icon ? <span className="text-lg">{p.icon}</span> : "📍")
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <span className="truncate text-sm font-medium">
                                    {(p.name || (p.type === "marker" || p.type === "icon" ? "Icon" : `${isProperty ? 'Property' : 'Point'} ${p.id}`)).replace("(Unsaved)", "").trim()}
                                </span>
                                {(p.name?.includes("(Unsaved)") || p.source === "canvas" || p.source === "mod") && (
                                    <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0" title="Unsaved changes" />
                                )}
                            </div>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); deleteCanvasObjects(p.id); }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </Draggable>
        );
    };

    return (
        <div className="flex flex-col p-4 gap-6 h-full overflow-y-auto">
            <DragDropContext onDragEnd={onDragEnd}>
                {mapGroups.map((group) => {
                    const isOpen = openMaps[group.id] !== false;
                    return (
                        <div key={`map-group-${group.id}`} className="flex flex-col gap-2">
                            <button 
                                onClick={() => toggleMapOpen(group.id)}
                                className={`flex items-center justify-between font-semibold tracking-tight text-sm w-full hover:bg-accent/50 p-2 rounded-md transition-colors ${group.id === Number(mapId) ? "text-primary" : "text-foreground"}`}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="truncate max-w-[200px] text-left">{group.name}</span>
                                    {group.id === Number(mapId) && <span className="text-[10px] uppercase tracking-wider opacity-70">Base Map</span>}
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            
                            {isOpen && (
                                <Droppable droppableId={String(group.id)}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex flex-col gap-2 mt-2 min-h-[50px] p-2 rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-accent/50 border-dashed border-2 border-primary/50' : 'border-2 border-transparent'}`}
                                        >
                                            {group.items.length === 0 && !snapshot.isDraggingOver && (
                                                <div className="text-sm text-muted-foreground text-center py-4">No data</div>
                                            )}
                                            {group.items.map((item, index) => renderItem(item, index))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            )}
                        </div>
                    );
                })}
            </DragDropContext>
        </div>
    );
}
