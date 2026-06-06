import { useState, useCallback, useEffect } from "react";
import { findRoomAtPosition, snapToRoomBoundaries } from "../components/RenderPageComponents/RenderComponent/RoomBoundary";

/**
 * Placement mode state machine for furniture objects.
 * States: idle → preview (ghost following cursor) → placed → idle
 */
export default function useObjectsPlacement({ rooms = [] }) {
    const [mode, setMode] = useState("idle");
    const [catalogItem, setCatalogItem] = useState(null);
    const [ghostPosition, setGhostPosition] = useState(null);
    const [targetRoom, setTargetRoom] = useState(null);

    const startPlacement = useCallback((item) => {
        setCatalogItem(item);
        setMode("preview");
        setGhostPosition(null);
        setTargetRoom(null);
    }, []);

    const updateGhostPosition = useCallback((x, y) => {
        if (mode !== "preview") return;
        const room = findRoomAtPosition(x, y, rooms);
        if (room) {
            const snapped = snapToRoomBoundaries(
                { x, y, width: catalogItem?.width || 40, height: catalogItem?.height || 40 },
                room,
                10
            );
            setGhostPosition({ x: snapped.x, y: snapped.y });
            setTargetRoom(room);
        } else {
            setGhostPosition({ x, y });
            setTargetRoom(null);
        }
    }, [mode, rooms, catalogItem]);

    const confirmPlacement = useCallback(() => {
        if (mode !== "preview" || !catalogItem || !ghostPosition) return null;

        const snapped = targetRoom
            ? snapToRoomBoundaries(
                { x: ghostPosition.x, y: ghostPosition.y, width: catalogItem.width, height: catalogItem.height },
                targetRoom,
                10
            )
            : { x: ghostPosition.x, y: ghostPosition.y };

        const newObj = {
            id: `obj-${Date.now()}${Math.random().toString(36).substr(2, 4)}`,
            name: catalogItem.name,
            type: "object",
            category: catalogItem.category,
            x: snapped.x,
            y: snapped.y,
            width: catalogItem.width,
            height: catalogItem.height,
            height3d: catalogItem.height3d || 20,
            rotation: 0,
            floor_id: targetRoom?.floor_id || null,
            room_id: targetRoom?.id || null,
            fill: catalogItem.fill || "#888",
            modelUrl: catalogItem.modelUrl || null,
        };

        setMode("idle");
        setCatalogItem(null);
        setGhostPosition(null);
        setTargetRoom(null);

        return newObj;
    }, [mode, catalogItem, ghostPosition, targetRoom]);

    const cancelPlacement = useCallback(() => {
        setMode("idle");
        setCatalogItem(null);
        setGhostPosition(null);
        setTargetRoom(null);
    }, []);

    useEffect(() => {
        if (mode === "idle") return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") cancelPlacement();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mode, cancelPlacement]);

    return {
        mode,
        catalogItem,
        ghostPosition,
        targetRoom,
        startPlacement,
        updateGhostPosition,
        confirmPlacement,
        cancelPlacement,
        isActive: mode !== "idle",
    };
}
