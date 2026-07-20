import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function DataTab({ mapProperties, mapPoints, handlePointSelect, deleteCanvasObjects }) {
    const [propsOpen, setPropsOpen] = useState(true);
    const [pointsOpen, setPointsOpen] = useState(true);

    return (
        <div className="flex flex-col p-4 gap-6">
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => setPropsOpen(!propsOpen)}
                    className="flex items-center justify-between font-semibold tracking-tight text-foreground uppercase text-sm w-full hover:bg-accent/50 p-2 rounded-md transition-colors"
                >
                    <span>Properties</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${propsOpen ? "rotate-180" : ""}`} />
                </button>
                
                {propsOpen && (
                <div className="flex flex-col gap-2 mt-2">
                    {mapProperties.length === 0 && <div className="text-sm text-muted-foreground p-2">No properties added yet.</div>}
                    {mapProperties.map((p, i) => (
                        <div 
                            key={`map-prop-${p.id}`} 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group transition-colors border border-transparent hover:border-border"
                            onClick={() => handlePointSelect(p)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                                    {(p.icon && (p.icon.startsWith("http") || p.icon.startsWith("/") || p.icon.startsWith("data:"))) ? <img src={p.icon} alt="Icon" className="w-5 h-5 object-contain" /> :
                                     p.icon ? <span className="text-lg">{p.icon}</span> :
                                     p.type === "home" ? <img src="/icons/home-point.svg" alt="Home" className="dark:invert w-5 h-5" /> :
                                     p.type === "apartment" ? <img src="/icons/building-point.svg" alt="Apartment" className="dark:invert w-5 h-5" /> :
                                     p.type === "unit" ? <img src="/icons/unit-point.svg" alt="Unit" className="dark:invert w-5 h-5" /> :
                                     "📍"}
                                </div>
                                
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <span className="truncate text-sm font-medium">
                                        {p.name.replace("(Unsaved)", "").trim() || `Property ${p.id}`}
                                    </span>
                                    {(p.name.includes("(Unsaved)") || p.source === "canvas") && (
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
                    ))}
                </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => setPointsOpen(!pointsOpen)}
                    className="flex items-center justify-between font-semibold tracking-tight text-foreground uppercase text-sm w-full hover:bg-accent/50 p-2 rounded-md transition-colors"
                >
                    <span>Points</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${pointsOpen ? "rotate-180" : ""}`} />
                </button>
                
                {pointsOpen && (
                <div className="flex flex-col gap-2 mt-2">
                    {mapPoints.length === 0 && <div className="text-sm text-muted-foreground p-2">No points added yet.</div>}
                    {mapPoints.map((p, i) => (
                        <div 
                            key={`map-point-${p.id}`} 
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group transition-colors border border-transparent hover:border-border"
                            onClick={() => handlePointSelect(p)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                                    {p.type === "radius" ? "⭕" :
                                     p.type === "line" ? "📏" :
                                     (p.icon && (p.icon.startsWith("http") || p.icon.startsWith("/") || p.icon.startsWith("data:"))) ? <img src={p.icon} alt="Marker" className="w-5 h-5 object-contain" /> :
                                     (p.icon ? <span className="text-lg">{p.icon}</span> : "📍")}
                                </div>
                                
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <span className="truncate text-sm font-medium">
                                        {(p.name || (p.type === "marker" || p.type === "icon" ? "Icon" : `Point ${p.id}`)).replace("(Unsaved)", "").trim()}
                                    </span>
                                    {(p.name?.includes("(Unsaved)") || p.source === "canvas") && (
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
                    ))}
                </div>
                )}
            </div>
        </div>
    )
}
