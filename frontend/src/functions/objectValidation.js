export function validateObjects(objects, rooms) {
    const warnings = [];
    if (!objects || objects.length === 0) return { isValid: true, warnings };

    const rectForObject = (obj) => {
        if (!Number.isFinite(Number(obj.x)) || !Number.isFinite(Number(obj.y))) return null;
        const width = obj.width || 40;
        const height = obj.height || 40;
        const cx = Number(obj.x);
        const cy = Number(obj.y);
        return {
            left: cx - width / 2,
            right: cx + width / 2,
            top: cy - height / 2,
            bottom: cy + height / 2,
            width,
            height,
        };
    };

    // Check object overlap
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];
            const ar = rectForObject(a);
            const br = rectForObject(b);
            if (!ar || !br) continue;
            const overlap = !(ar.right <= br.left || br.right <= ar.left || ar.bottom <= br.top || br.bottom <= ar.top);
            if (overlap) {
                warnings.push({
                    type: "overlap",
                    objectId: [a.id, b.id],
                    message: `"${a.name}" and "${b.name}" overlap`,
                    severity: "warning"
                });
            }
        }
    }

    // Check objects outside room boundaries
    if (rooms && rooms.length > 0) {
        objects.forEach(obj => {
            const room = rooms.find(r => r.id === obj.room_id);
            if (room) {
                const rect = rectForObject(obj);
                if (!rect) return;
                const outside = rect.left < room.x - 5 || rect.right > room.x + room.width + 5 ||
                               rect.top < room.y - 5 || rect.bottom > room.y + room.height + 5;
                if (outside) {
                    warnings.push({
                        type: "boundary",
                        objectId: obj.id,
                        message: `"${obj.name}" is partially outside room "${room.name}"`,
                        severity: "warning"
                    });
                }
            }
        });

        rooms.forEach(room => {
            const roomObjects = objects.filter(obj => obj.room_id === room.id);
            if (!roomObjects.length) return;
            const roomArea = Math.max(1, (room.width || 0) * (room.height || 0));
            let objectArea = 0;
            let oversized = false;
            roomObjects.forEach(obj => {
                const rect = rectForObject(obj);
                if (!rect) return;
                objectArea += rect.width * rect.height;
                if (rect.width > (room.width || 0) || rect.height > (room.height || 0)) oversized = true;
            });
            if (oversized) {
                warnings.push({
                    type: "room-fit",
                    roomId: room.id,
                    message: `"${room.name || "Room"}" is too small for at least one placed object`,
                    severity: "warning"
                });
            } else if (objectArea / roomArea > 0.85) {
                warnings.push({
                    type: "room-crowding",
                    roomId: room.id,
                    message: `"${room.name || "Room"}" is crowded by placed objects`,
                    severity: "info"
                });
            }
        });

        objects.forEach(obj => {
            if (obj.room_id && !rooms.some(room => room.id === obj.room_id)) {
                warnings.push({
                    type: "missing-room",
                    objectId: obj.id,
                    message: `"${obj.name || "Object"}" is assigned to a missing room`,
                    severity: "warning"
                });
            }
        });
    }

    // Check minimum spacing
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];
            const ar = rectForObject(a);
            const br = rectForObject(b);
            if (!ar || !br) continue;
            const minSpacing = 20;
            const dx = Math.max(0, Math.max(ar.left - br.right, br.left - ar.right));
            const dy = Math.max(0, Math.max(ar.top - br.bottom, br.top - ar.bottom));
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minSpacing && dist > 0) {
                warnings.push({
                    type: "spacing",
                    objectId: [a.id, b.id],
                    message: `"${a.name}" and "${b.name}" are too close (${Math.round(dist)}px)`,
                    severity: "info"
                });
            }
        }
    }

    return { isValid: warnings.filter(w => w.severity === "error").length === 0, warnings };
}
