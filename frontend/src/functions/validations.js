export function validatePoint(obj) {
    const allowedKeys = [
        "pointId", "details",
        "propertyId", "created_at",
        "id", "group_id",
        "type", "pinned",
        "name", "updated_at",
        "lng", "zip",
        "lat", "address",
        "icon", "state",
        "radius", "county",
        "owner_id", "country",
        "city", "endLng",
        "endLat", "length",
        "end_lng", "end_lat",
        "location", "unit_id",
        "extra_info"
    ];
    for (const key of Object.keys(obj)) {
        if (!allowedKeys.includes(key)) {
            throw new Error(`Invalid property: ${key}`);
        }
    }
    if (!obj.pointId && !obj.propertyId && !obj.id) throw new Error("Missing id");
    return true;
}
