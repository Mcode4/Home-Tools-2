import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { thunkToggleOverlay } from "../../../../redux/overlays";
import { Eye, EyeOff, Layers, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LayersTab() {
    const { mapId } = useParams();
    const dispatch = useDispatch();
    
    const mapStore = useSelector(state => state.maps);
    const overlaysStore = useSelector(state => state.overlays);
    
    const activeOverlays = overlaysStore.activeMapIds || [];
    
    // Filter out the current active map
    const availableMaps = (mapStore.data || []).filter(m => String(m.id) !== String(mapId));

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Map Layers</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                    Toggle other maps to view their data as an overlay on your current workspace.
                </div>
                
                {availableMaps.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic text-center py-4">
                        No other maps available.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {availableMaps.map(m => {
                            const isActive = activeOverlays.includes(m.id);
                            
                            return (
                                <div 
                                    key={m.id} 
                                    className={`flex items-center justify-between p-3 rounded-md border ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MapIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm font-medium truncate">{m.name}</span>
                                    </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8 flex-shrink-0 ml-2"
                                        onClick={() => dispatch(thunkToggleOverlay(m.id))}
                                        title={isActive ? "Hide Overlay" : "Show Overlay"}
                                    >
                                        {isActive ? (
                                            <Eye className="w-4 h-4 text-primary" />
                                        ) : (
                                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
