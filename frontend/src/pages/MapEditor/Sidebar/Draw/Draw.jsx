import { Button } from "@/components/ui/button";

export default function DrawTab({ canvasSelect, savedTypesStore, selectCanvasAddon, setCanvasSelect }) {
    return (
        <div className="flex flex-col p-4 gap-6">
            <div className="flex flex-col gap-3">
                <h4 className="font-semibold tracking-tight text-foreground uppercase text-sm">Primary Tools</h4>
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant={canvasSelect.type === "marker" || canvasSelect.type === "icon" ? "default" : "outline"} 
                        className="flex items-center gap-2 justify-start"
                        onClick={() => selectCanvasAddon("/icons/geo-alt-fill.svg", "Marker", "marker")}
                    >
                        <img src="/icons/geo-alt-fill.svg" alt="Marker" className={`w-4 h-4 ${canvasSelect.type === "marker" || canvasSelect.type === "icon" ? "invert dark:invert-0" : "dark:invert"}`} />
                        <span>Marker</span>
                    </Button>
                    <Button 
                        variant={canvasSelect.type === "home" ? "default" : "outline"} 
                        className="flex items-center gap-2 justify-start"
                        onClick={() => selectCanvasAddon(null, "Home", "home")}
                    >
                        <img src="/icons/home-point.svg" alt="Home" className={`w-4 h-4 ${canvasSelect.type === "home" ? "invert dark:invert-0" : "dark:invert"}`} />
                        <span>Home</span>
                    </Button>
                    <Button 
                        variant={canvasSelect.type === "apartment" ? "default" : "outline"} 
                        className="flex items-center gap-2 justify-start"
                        onClick={() => selectCanvasAddon(null, "Apartment", "apartment")}
                    >
                        <img src="/icons/building-point.svg" alt="Apartment" className={`w-4 h-4 ${canvasSelect.type === "apartment" ? "invert dark:invert-0" : "dark:invert"}`} />
                        <span>Apt</span>
                    </Button>
                    <Button 
                        variant={canvasSelect.type === "unit" ? "default" : "outline"} 
                        className="flex items-center gap-2 justify-start"
                        onClick={() => selectCanvasAddon(null, "Unit", "unit")}
                    >
                        <img src="/icons/unit-point.svg" alt="Unit" className={`w-4 h-4 ${canvasSelect.type === "unit" ? "invert dark:invert-0" : "dark:invert"}`} />
                        <span>Unit</span>
                    </Button>

                    {savedTypesStore.data.map(type => (
                        <Button
                            key={`saved-type-${type.id}`}
                            variant={canvasSelect.savedTypeId === type.id ? "default" : "outline"}
                            className="flex items-center gap-2 justify-start"
                            onClick={() => setCanvasSelect({
                                type: "icon",
                                savedTypeId: type.id,
                                name: type.name,
                                icon: type.type
                            })}
                        >
                            {type.type.length > 5 ? (
                                <img src={type.type} alt={type.name} className={`w-4 h-4 ${canvasSelect.savedTypeId === type.id ? "invert dark:invert-0" : "dark:invert"}`} />
                            ) : (
                                <span className="w-4 h-4 flex items-center justify-center">{type.type}</span>
                            )}
                            <span className="truncate">{type.name}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <h4 className="font-semibold tracking-tight text-foreground uppercase text-sm">Measures</h4>
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant={canvasSelect.type === "radius" ? "default" : "outline"} 
                        className="flex items-center gap-2 justify-start"
                        onClick={() => selectCanvasAddon(null, "Radius", "radius")}
                    >
                        <span className="text-base">⭕</span>
                        <span>Radius</span>
                    </Button>
                    <Button 
                        variant={canvasSelect.type === "line" ? "default" : "outline"} 
                        className="flex items-center gap-2 justify-start"
                        onClick={() => selectCanvasAddon(null, "Line", "line")}
                    >
                        <span className="text-base">📏</span>
                        <span>Line</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
