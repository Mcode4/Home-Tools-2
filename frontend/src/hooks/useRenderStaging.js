import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import useStaging from "./useStaging";
import { thunkGetFloors, thunkCreateFloor, thunkEditFloor, thunkDeleteFloor } from "../redux/floors";
import { thunkGetRooms, thunkCreateRoom, thunkEditRoom, thunkDeleteRoom } from "../redux/rooms";

export default function useRenderStaging(propertyId) {
    const dispatch = useDispatch();
    const [dataLoaded, setDataLoaded] = useState(false);

    const onSave = useCallback(async ({ items, deleted, clearStaging }) => {
        const floorCreates = [];
        const floorUpdates = [];

        Object.values(items).forEach(obj => {
            const idStr = String(obj.id);
            if (idStr.startsWith("floor-") && !idStr.includes("room")) {
                const numIdStr = idStr.split("-")[1];
                if (numIdStr.length >= 12) floorCreates.push(obj);
                else floorUpdates.push({ id: Number(numIdStr), data: obj });
            }
        });

        await Promise.all([
            ...deleted.map(async idStr => {
                const [prefix, numStr] = idStr.split("-");
                const numId = Number(numStr);
                if (!isNaN(numId)) {
                    if (prefix === "floor") await dispatch(thunkDeleteFloor(numId));
                    else if (prefix === "room") await dispatch(thunkDeleteRoom(numId));
                }
            }),
            ...floorCreates.map(async f => dispatch(thunkCreateFloor({
                property_id: propertyId,
                name: f.name || "New Floor",
                level_number: f.level_number || 1,
                bedroom_count: f.bedroom_count || 0,
                bathroom_count: f.bathroom_count || 0,
                length: f.length || null, width: f.width || null,
                height: f.height || null, position: f.position || null,
            }))),
            ...floorUpdates.map(async ({ id, data }) => dispatch(thunkEditFloor(id, {
                property_id: propertyId, name: data.name,
                bedroom_count: data.bedroom_count || 0,
                bathroom_count: data.bathroom_count || 0,
            }))),
        ]);

        clearStaging();
        if (propertyId) dispatch(thunkGetFloors(propertyId));
    }, [dispatch, propertyId]);

    const staging = useStaging({ storageKey: `render_${propertyId || "new"}`, onSave, disableKeyboard: true });

    // Load floors from API on mount - merge with existing staged items, don't wipe
    useEffect(() => {
        if (!propertyId || dataLoaded) return;
        const load = async () => {
            const floorsRes = await dispatch(thunkGetFloors(propertyId));
            const floors = floorsRes?.data?.floors || [];

            // Only add floors that don't already exist in staged items
            const existingItems = staging.items || {};
            floors.forEach(f => {
                const floorKey = `floor-${f.id}`;
                if (!existingItems[floorKey]) {
                    staging.addItem(floorKey, { ...f, id: floorKey, type: "floor", level_number: f.level_number || 1, x: 50, y: 50, width: 700, height: 500, fill: "#2a2a3e", stroke: "#555" });
                }
            });
            setDataLoaded(true);
            staging.setLoaded(true);
            staging.setInitialized(false);
        };
        load();
    }, [propertyId, dataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    const addFloor = useCallback((name) => {
        const id = `floor-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        const maxLevel = Math.max(0, ...Object.values(staging.items).filter(s => s.type === "floor").map(f => f.level_number || 0));
        staging.addItem(id, {
            id, name: name || "New Floor", type: "floor", level_number: maxLevel + 1,
            x: 50, y: 50, width: 700, height: 500,
            fill: "#2a2a3e", stroke: "#555",
            bedroom_count: 0, bathroom_count: 0,
        });
    }, [staging]);

    return { ...staging, addFloor };
}
