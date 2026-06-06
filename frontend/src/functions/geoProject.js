const EARTH_CIRC = 40075016.686;

export function metersPerPixel(lat, zoom) {
    return (EARTH_CIRC * Math.cos((lat * Math.PI) / 180)) / (256 * Math.pow(2, zoom));
}

export function metersPerDegreeLng(lat) {
    return 111320 * Math.cos((lat * Math.PI) / 180);
}

export const METERS_PER_DEGREE_LAT = 111320;

export function groundDistanceMeters(lng1, lat1, lng2, lat2) {
    const toRad = value => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const clamped = Math.min(1, Math.max(0, a));
    return 6378137 * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

export function projectFormula(lng, lat, centerLat, centerLng, zoom, canvasW, canvasH) {
    const mpp = metersPerPixel(centerLat, zoom);
    const x = ((lng - centerLng) * metersPerDegreeLng(centerLat)) / mpp + canvasW / 2;
    const y = (-(lat - centerLat) * METERS_PER_DEGREE_LAT) / mpp + canvasH / 2;
    return { x, y };
}

export function unprojectFormula(x, y, centerLat, centerLng, zoom, canvasW, canvasH) {
    const mpp = metersPerPixel(centerLat, zoom);
    const lng = ((x - canvasW / 2) * mpp) / metersPerDegreeLng(centerLat) + centerLng;
    const lat = -((y - canvasH / 2) * mpp) / METERS_PER_DEGREE_LAT + centerLat;
    return { lng, lat };
}

export function makeProjection(map) {
    if (map) {
        const meterScaleAt = (lng, lat) => {
            const center = map.project([lng, lat]);
            const right = map.unproject([center.x + 1, center.y]);
            const down = map.unproject([center.x, center.y + 1]);
            const fallback = metersPerPixel(lat, map.getZoom());
            const metersPerPixelX = groundDistanceMeters(lng, lat, right.lng, right.lat) || fallback;
            const metersPerPixelY = groundDistanceMeters(lng, lat, down.lng, down.lat) || fallback;
            return {
                metersPerPixelX,
                metersPerPixelY,
                pixelsPerMeterX: 1 / metersPerPixelX,
                pixelsPerMeterY: 1 / metersPerPixelY,
            };
        };
        return {
            project: (lng, lat) => map.project([lng, lat]),
            unproject: (x, y) => { const ll = map.unproject([x, y]); return { lng: ll.lng, lat: ll.lat }; },
            getZoom: () => map.getZoom(),
            getCenter: () => { const c = map.getCenter(); return { lng: c.lng, lat: c.lat }; },
            meterScaleAt,
            metersPerPixelAt: (lat) => metersPerPixel(lat, map.getZoom()),
            metersToPx: (meters, lat) => meters / metersPerPixel(lat, map.getZoom()),
            pxToMeters: (px, lat) => px * metersPerPixel(lat, map.getZoom()),
            metersToPxX: (meters, lng, lat) => meters * meterScaleAt(lng, lat).pixelsPerMeterX,
            metersToPxY: (meters, lng, lat) => meters * meterScaleAt(lng, lat).pixelsPerMeterY,
            pxToMetersX: (px, lng, lat) => px * meterScaleAt(lng, lat).metersPerPixelX,
            pxToMetersY: (px, lng, lat) => px * meterScaleAt(lng, lat).metersPerPixelY,
        };
    }
    return null;
}
