import * as turf from "@turf/turf";

export function validateObjects(objects, rooms) {
    const warnings = [];
    if (!objects || objects.length === 0) return { isValid: true, warnings };

    // Check object overlap
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];
            const overlap = !(a.x + (a.width || 40) <= b.x || b.x + (b.width || 40) <= a.x ||
                            a.y + (a.height || 40) <= b.y || b.y + (b.height || 40) <= a.y);
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
                const outside = obj.x < room.x - 5 || obj.x + (obj.width || 40) > room.x + room.width + 5 ||
                               obj.y < room.y - 5 || obj.y + (obj.height || 40) > room.y + room.height + 5;
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
    }

    // Check minimum spacing
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];
            const minSpacing = 20;
            const dx = Math.max(0, Math.max(a.x - (b.x + (b.width || 40)), b.x - (a.x + (a.width || 40))));
            const dy = Math.max(0, Math.max(a.y - (b.y + (b.height || 40)), b.y - (a.y + (a.height || 40))));
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