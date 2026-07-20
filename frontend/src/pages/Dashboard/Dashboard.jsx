import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkGetAllMaps, thunkDeleteMap } from "../../redux/maps";
import { ModalButton } from "../../context/Modal";
import MapForm from "../../components/Forms/MapForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Map as MapIcon, Trash2, Edit } from "lucide-react";

export default function Dashboard() {
    const mapsState = useSelector(store => store.maps);
    const maps = mapsState?.data || [];
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(()=> {
        dispatch(thunkGetAllMaps());
    }, [dispatch]);

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm("Are you sure you want to delete this map? All associated data will be lost.")) {
            await dispatch(thunkDeleteMap(id));
        }
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Maps Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your workspaces and floorplans</p>
                    </div>
                    <ModalButton
                        modalComponent={<MapForm />}
                        itemText={
                            <Button className="flex items-center gap-2">
                                <Plus size={16} /> New Map
                            </Button>
                        } 
                    />
                </div>

                {/* Grid */}
                {maps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {maps.map(map => (
                            <Card 
                                key={map.id} 
                                className="group cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col"
                                onClick={() => navigate(`/editor/${map.id}`)}
                            >
                                <div className="h-40 bg-muted/50 flex items-center justify-center border-b group-hover:bg-muted/80 transition-colors">
                                    <MapIcon size={48} className="text-muted-foreground/30" />
                                </div>
                                <CardHeader>
                                    <CardTitle>{map.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {map.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <div className="flex-1"></div>
                                <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
                                    <div className="text-xs text-muted-foreground">
                                        Created: {new Date(map.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <ModalButton
                                                modalComponent={<MapForm mapId={map.id} initialData={map} />}
                                                itemText={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <Edit size={16} />
                                                    </Button>
                                                }
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => handleDelete(e, map.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg border-muted">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <MapIcon size={48} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">No maps yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Create your first map to start drawing floorplans, placing furniture, and rendering in 3D.
                        </p>
                        <ModalButton
                            modalComponent={<MapForm />}
                            itemText={
                                <Button className="flex items-center gap-2">
                                    <Plus size={16} /> Create First Map
                                </Button>
                            } 
                        />
                    </div>
                )}
            </div>
        </div>
    )
}