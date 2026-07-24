import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { thunkAddWorkspace, thunkRemoveWorkspace, thunkToggleVisibility } from "../../../../redux/overlays";
import { Eye, EyeOff, Layers, Map as MapIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LayersTab() {
    const { mapId } = useParams();
    const dispatch = useDispatch();
    
    const mapStore = useSelector(state => state.maps);
    const overlaysStore = useSelector(state => state.overlays);
    
    const workspaceMapIds = overlaysStore.workspaceMapIds || [];
    const visibleMapIds = overlaysStore.visibleMapIds || [];
    
    const allMaps = mapStore.data || [];
    const currentMap = allMaps.find(m => String(m.id) === String(mapId));
    
    // Maps available to add to workspace (not the current map, and not already in workspace)
    const availableMaps = allMaps.filter(m => String(m.id) !== String(mapId) && !workspaceMapIds.includes(m.id));
    
    // Maps currently in the workspace (not the current map)
    const workspaceMaps = allMaps.filter(m => workspaceMapIds.includes(m.id));

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Map Workspace</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* CURRENT WORKSPACE SECTION */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Workspace</h3>
                    <div className="space-y-2">
                        {/* The base map */}
                        {currentMap && (
                            <div className="flex items-center justify-between p-3 rounded-md border border-primary/50 bg-primary/5">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MapIcon className="w-4 h-4 flex-shrink-0 text-primary" />
                                    <span className="text-sm font-medium truncate">{currentMap.name} <span className="text-xs text-muted-foreground ml-1">(Current)</span></span>
                                </div>
                            </div>
                        )}
                        
                        {/* The workspace overlays */}
                        {workspaceMaps.map(m => {
                            const isVisible = visibleMapIds.includes(m.id);
                            return (
                                <div 
                                    key={`ws-${m.id}`} 
                                    className={`flex items-center justify-between p-3 rounded-md border ${isVisible ? 'border-primary/30 bg-card' : 'border-border bg-muted/30'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MapIcon className={`w-4 h-4 flex-shrink-0 ${isVisible ? 'text-foreground' : 'text-muted-foreground'}`} />
                                        <span className={`text-sm truncate ${isVisible ? 'font-medium' : 'text-muted-foreground'}`}>{m.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => dispatch(thunkToggleVisibility(m.id))}
                                            title={isVisible ? "Hide Overlay" : "Show Overlay"}
                                        >
                                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => dispatch(thunkRemoveWorkspace(m.id))}
                                            title="Remove from Workspace"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                        
                        {workspaceMaps.length === 0 && (
                            <div className="text-xs text-muted-foreground italic pl-1">
                                No additional layers in workspace.
                            </div>
                        )}
                    </div>
                </div>

                {/* AVAILABLE LAYERS SECTION */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Layers</h3>
                    
                    {availableMaps.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic text-center py-4 border rounded-md border-dashed">
                            No other maps available.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableMaps.map(m => (
                                <div 
                                    key={`avail-${m.id}`} 
                                    className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-accent/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MapIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground truncate">{m.name}</span>
                                    </div>
                                    
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8 flex-shrink-0 ml-2 text-xs"
                                        onClick={() => dispatch(thunkAddWorkspace(m.id))}
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
