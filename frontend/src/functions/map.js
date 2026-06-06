export const EARTH_R = 6378137;

export function lngLatToMercator(lng, lat) {
    const x = lng * Math.PI / 180 * EARTH_R;
    const y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * EARTH_R;
    return { x, y };
}

export function mercatorToLngLat(x, y) {
    const lng = x / EARTH_R * 180 / Math.PI;
    const lat = (2 * Math.atan(Math.exp(y / EARTH_R)) - Math.PI / 2) * 180 / Math.PI;
    return { lng, lat };
}

export function mercatorDistance(lng1, lat1, lng2, lat2) {
    const a = lngLatToMercator(lng1, lat1);
    const b = lngLatToMercator(lng2, lat2);
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function getHandlePosition(centerLng, centerLat, radiusMeters) {
    const c = lngLatToMercator(centerLng, centerLat);
    return mercatorToLngLat(c.x + radiusMeters, c.y);
}

export const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

export function createRadiusData(centerLng, centerLat, radiusMeters, handleLng, handleLat, id, steps = 64) {
    const c = lngLatToMercator(centerLng, centerLat);
    const coords = [];
    for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const pt = mercatorToLngLat(
            c.x + radiusMeters * Math.cos(angle),
            c.y + radiusMeters * Math.sin(angle)
        );
        coords.push([pt.lng, pt.lat]);
    }
    return {
        type: "FeatureCollection",
        features: [
            { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: { id } },
            {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [[centerLng, centerLat], [handleLng, handleLat]]
                },
                properties: { id, part: "spoke" }
            }
        ]
    };
}

export function createLineData(aLng, aLat, bLng, bLat, id) {
    return {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [[aLng, aLat], [bLng, bLat]]
            },
            properties: { id }
        }]
    };
}
