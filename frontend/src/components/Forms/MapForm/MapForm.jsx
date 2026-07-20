import { useState } from "react";
import { useDispatch } from "react-redux";
import { useModal } from "../../../context/Modal";
import { thunkCreateMap, thunkUpdateMap } from "../../../redux/maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function MapForm({ mapId, initialData, onSuccess }) {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    
    const dispatch = useDispatch();
    const { closeModal } = useModal();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);

        const mapData = {
            name,
            description,
        };

        let res;
        if (mapId) {
            res = await dispatch(thunkUpdateMap(mapId, mapData));
        } else {
            res = await dispatch(thunkCreateMap(mapData));
        }

        setLoading(false);
        if (res.success) {
            if (onSuccess) onSuccess(res.data);
            closeModal();
        } else {
            setErr(res.detail || "An error occurred");
        }
    };

    return (
        <div className="p-6 w-full max-w-md bg-card text-card-foreground rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{mapId ? "Edit Map" : "Create New Map"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {err && <div className="text-destructive text-sm font-medium">{err}</div>}
                
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Map Name</Label>
                    <Input 
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dream House"
                        required 
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Details about this map..."
                        rows={4}
                    />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
