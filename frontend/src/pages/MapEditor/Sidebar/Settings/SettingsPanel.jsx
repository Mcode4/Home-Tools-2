import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { thunkUpdateSettings } from "../../../../redux/settings";

export default function SettingsPanel({ onClose }) {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);

    const handleUpdate = (updates) => {
        dispatch(thunkUpdateSettings(updates));
    };

    return (
        <div className="flex flex-col p-4 gap-6">
            <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold tracking-tight text-foreground">Editor Settings</h4>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    X
                </Button>
            </div>

            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visual Theme</h4>
                <div className="flex flex-col gap-2">
                    <Button
                        variant={settings.theme === "light" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "light" })}
                    >
                        ☀️ Light
                    </Button>
                    <Button
                        variant={settings.theme === "dark" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "dark" })}
                    >
                        🌙 Dark
                    </Button>
                    <Button
                        variant={settings.theme === "system" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "system" })}
                    >
                        ⚙️ System
                    </Button>
                    <Button
                        variant={settings.theme === "blueprint" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdate({ theme: "blueprint" })}
                    >
                        📐 Blueprint
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Map Style</h4>
                <div className="flex flex-col gap-2">
                    <div 
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-accent transition-colors ${settings.map_layer === "osm-layer" ? "bg-accent border border-primary/20" : "border border-transparent"}`}
                        onClick={() => handleUpdate({ map_layer: "osm-layer" })}
                    >
                        <span className="text-xl">🗺️</span>
                        <span className="font-medium text-sm">Street Map (2D)</span>
                    </div>
                    <div 
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-accent transition-colors ${settings.map_layer === "satellite-layer" ? "bg-accent border border-primary/20" : "border border-transparent"}`}
                        onClick={() => handleUpdate({ map_layer: "satellite-layer" })}
                    >
                        <span className="text-xl">🛰️</span>
                        <span className="font-medium text-sm">Satellite (3D Views)</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Marker Scaling</h4>
                <div className="flex flex-col gap-2">
                    <Label className="text-xs">Icon Size ({settings.icon_size}px)</Label>
                    <input
                        type="range" min="16" max="64"
                        value={settings.icon_size}
                        onChange={(e) => handleUpdate({ icon_size: parseInt(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="text-xs">Label Text Size ({settings.text_size}px)</Label>
                    <input
                        type="range" min="8" max="24"
                        value={settings.text_size}
                        onChange={(e) => handleUpdate({ text_size: parseInt(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </div>
            </div>
        </div>
    );
}
