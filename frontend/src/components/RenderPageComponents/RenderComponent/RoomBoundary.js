/**
 * Room boundary detection and object snapping utilities.
 * Pure functions — no React, no state.
 */

/**
 * Find the room containing a given screen position.
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array} rooms - Array of room objects with { x, y, width, height, id }
 * @returns {Object|null} The first room containing the point, or null
 */
export function findRoomAtPosition(x, y, rooms) {
    const TOLERANCE = 2;
    for (let i = rooms.length - 1; i >= 0; i--) {
        const room = rooms[i];
        const rx = room.x || 0;
        const ry = room.y || 0;
        const rw = room.width || 100;
        const rh = room.height || 100;
        if (
            x >= rx - TOLERANCE &&
            x <= rx + rw + TOLERANCE &&
            y >= ry - TOLERANCE &&
            y <= ry + rh + TOLERANCE
        ) {
            return room;
        }
    }
    return null;
}

/**
 * Snap an object's position so it stays within room boundaries.
 * @param {Object} object - { x, y, width, height }
 * @param {Object} room - { x, y, width, height, id }
 * @param {number} snapDistance - Minimum distance from room edge (default 10)
 * @returns {Object} Updated object with snapped position and room_id
 */
export function snapToRoomBoundaries(object, room, snapDistance = 10) {
    if (!room) return object;

    const objW = object.width || 40;
    const objH = object.height || 40;
    const halfW = objW / 2;
    const halfH = objH / 2;

    const minX = room.x + halfW + snapDistance;
    const maxX = room.x + room.width - halfW - snapDistance;
    const minY = room.y + halfH + snapDistance;
    const maxY = room.y + room.height - halfH - snapDistance;

    const clampedX = Math.max(minX, Math.min(object.x, maxX));
    const clampedY = Math.max(minY, Math.min(object.y, maxY));

    return {
        ...object,
        x: clampedX,
        y: clampedY,
        room_id: room.id,
    };
}
