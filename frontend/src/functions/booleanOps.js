import * as turf from "@turf/turf";

function outlineToTurfFeature(outline) {
    if (!outline) return null;

    let coordinates = [];

    if (Array.isArray(outline.points) && outline.points.length >= 3) {
        coordinates = outline.points.map(([x, y]) => [x, y]);
        if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
            coordinates.push([...coordinates[0]]);
        }
    } else if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
        const halfW = outline.widthMeters / 2;
        const halfH = outline.heightMeters / 2;
        const degPerMeter = 1 / 111320;
        const cosLat = Math.cos(outline.lat * Math.PI / 180);
        coordinates = [
            [outline.lng - halfW * degPerMeter / cosLat, outline.lat - halfH * degPerMeter],
            [outline.lng + halfW * degPerMeter / cosLat, outline.lat - halfH * degPerMeter],
            [outline.lng + halfW * degPerMeter / cosLat, outline.lat + halfH * degPerMeter],
            [outline.lng - halfW * degPerMeter / cosLat, outline.lat + halfH * degPerMeter],
            [outline.lng - halfW * degPerMeter / cosLat, outline.lat - halfH * degPerMeter]
        ];
    } else if (outline.x != null && outline.y != null && outline.width && outline.height) {
        coordinates = [
            [outline.x, outline.y],
            [outline.x + outline.width, outline.y],
            [outline.x + outline.width, outline.y + outline.height],
            [outline.x, outline.y + outline.height],
            [outline.x, outline.y]
        ];
    }

    if (coordinates.length < 4) return null;

    return turf.polygon([coordinates], {
        name: outline.name || outline.type || "outline",
        fill: outline.fill || "#6366f1",
        stroke: outline.stroke || "#00d4ff",
        strokeWidth: outline.strokeWidth || 2,
    });
}

function featureToOutline(feature, sourceOutline) {
    if (!feature || !feature.geometry || feature.geometry.type !== "Polygon") return null;

    const coords = feature.geometry.coordinates[0];
    if (!Array.isArray(coords) || coords.length < 4) return null;

    const points = coords.slice(0, -1).map(([x, y]) => [x, y]);

    let minX = Infinity, minY = Infinity;
    points.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
    });

    const normalizedPoints = points.map(([x, y]) => [x - minX, y - minY]);

    return {
        type: "polygon",
        points: normalizedPoints,
        fill: sourceOutline?.fill || "#6366f1",
        stroke: sourceOutline?.stroke || "#00d4ff",
        strokeWidth: sourceOutline?.strokeWidth || 2,
        opacity: sourceOutline?.opacity ?? 1,
    };
}

export function booleanUnion(outlineA, outlineB) {
    try {
        const featureA = outlineToTurfFeature(outlineA);
        const featureB = outlineToTurfFeature(outlineB);
        if (!featureA || !featureB) return null;

        const union = turf.union(featureA, featureB);
        if (!union) return null;

        return featureToOutline(union, outlineA);
    } catch (e) {
        console.error("Boolean union failed:", e);
        return null;
    }
}

export function booleanSubtract(outlineA, outlineB) {
    try {
        const featureA = outlineToTurfFeature(outlineA);
        const featureB = outlineToTurfFeature(outlineB);
        if (!featureA || !featureB) return null;

        const diff = turf.difference(featureA, featureB);
        if (!diff) return outlineA;

        if (diff.geometry.type === "MultiPolygon") {
            const polygons = diff.geometry.coordinates.map(ring => turf.polygon([ring]));
            let largest = null;
            let maxArea = 0;
            polygons.forEach(poly => {
                const area = turf.area(poly);
                if (area > maxArea) {
                    maxArea = area;
                    largest = poly;
                }
            });
            if (largest) {
                return featureToOutline(largest, outlineA);
            }
            return outlineA;
        }

        return featureToOutline(diff, outlineA);
    } catch (e) {
        console.error("Boolean subtract failed:", e);
        return outlineA;
    }
}

export function booleanIntersect(outlineA, outlineB) {
    try {
        const featureA = outlineToTurfFeature(outlineA);
        const featureB = outlineToTurfFeature(outlineB);
        if (!featureA || !featureB) return null;

        const intersect = turf.intersect(featureA, featureB);
        if (!intersect) return null;

        return featureToOutline(intersect, outlineA);
    } catch (e) {
        console.error("Boolean intersect failed:", e);
        return null;
    }
}