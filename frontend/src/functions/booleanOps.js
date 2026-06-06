import * as turf from "@turf/turf";
import { groundDistanceMeters } from "./geoProject";

function outlineToTurfFeature(outline) {
    if (!outline) return null;

    let coordinates = [];
    let coordinateMode = "screen";

    if (Array.isArray(outline.pointsGeo) && outline.pointsGeo.length >= 3) {
        coordinates = outline.pointsGeo.map(([lat, lng]) => [lng, lat]);
        coordinateMode = "geo";
    } else if (isLikelyGeoPoints(outline.points)) {
        coordinates = outline.points.map(([lat, lng]) => [lng, lat]);
        coordinateMode = "geo";
    } else if (Array.isArray(outline.points) && outline.points.length >= 3) {
        coordinates = outline.points.map(([x, y]) => [x, y]);
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
        coordinateMode = "geo";
    } else if (outline.x != null && outline.y != null && outline.width && outline.height) {
        coordinates = [
            [outline.x, outline.y],
            [outline.x + outline.width, outline.y],
            [outline.x + outline.width, outline.y + outline.height],
            [outline.x, outline.y + outline.height],
            [outline.x, outline.y]
        ];
    }

    if (coordinates.length < 3) return null;
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
        coordinates.push([...coordinates[0]]);
    }
    if (coordinates.length < 4) return null;

    return {
        feature: turf.polygon([coordinates], {
            name: outline.name || outline.type || "outline",
            fill: outline.fill || "#6366f1",
            stroke: outline.stroke || "#00d4ff",
            strokeWidth: outline.strokeWidth || 2,
        }),
        coordinateMode,
    };
}

function isLikelyGeoPoints(points) {
    return Array.isArray(points)
        && points.length >= 3
        && points.every(point => (
            Array.isArray(point)
            && point.length >= 2
            && Number.isFinite(Number(point[0]))
            && Number.isFinite(Number(point[1]))
            && Math.abs(Number(point[0])) <= 90
            && Math.abs(Number(point[1])) <= 180
        ))
        && points.some(point => Number(point[0]) < 0 || Number(point[1]) < 0);
}

function largestPolygon(feature) {
    if (!feature || !feature.geometry) return null;
    if (feature.geometry.type === "Polygon") return feature;
    if (feature.geometry.type !== "MultiPolygon") return null;
    let largest = null;
    let maxArea = 0;
    feature.geometry.coordinates.forEach(coords => {
        const candidate = turf.polygon(coords);
        const area = turf.area(candidate);
        if (area > maxArea) {
            largest = candidate;
            maxArea = area;
        }
    });
    return largest;
}

function featureToOutline(feature, sourceOutline, coordinateMode) {
    const polygon = largestPolygon(feature);
    if (!polygon || !polygon.geometry || polygon.geometry.type !== "Polygon") return null;

    const coords = polygon.geometry.coordinates[0];
    if (!Array.isArray(coords) || coords.length < 4) return null;

    const points = coords.slice(0, -1).map(([x, y]) => [x, y]);

    if (coordinateMode === "geo") {
        const geoPoints = points.map(([lng, lat]) => [lat, lng]);
        const centroid = turf.centroid(polygon).geometry.coordinates;
        const bbox = turf.bbox(polygon);
        return {
            type: "polygon",
            outlineType: "polygon",
            points: geoPoints,
            pointsGeo: geoPoints.map(point => [...point]),
            lat: centroid[1],
            lng: centroid[0],
            widthMeters: groundDistanceMeters(bbox[0], centroid[1], bbox[2], centroid[1]),
            heightMeters: groundDistanceMeters(centroid[0], bbox[1], centroid[0], bbox[3]),
            fill: sourceOutline?.fill || "#6366f1",
            stroke: sourceOutline?.stroke || "#00d4ff",
            strokeWidth: sourceOutline?.strokeWidth || 2,
            opacity: sourceOutline?.opacity ?? 1,
            level: sourceOutline?.level || 1,
        };
    }

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
        const a = outlineToTurfFeature(outlineA);
        const b = outlineToTurfFeature(outlineB);
        if (!a || !b) return null;

        const union = turf.union(turf.featureCollection([a.feature, b.feature]));
        if (!union) return null;

        return featureToOutline(union, outlineA, a.coordinateMode);
    } catch (e) {
        console.error("Boolean union failed:", e);
        return null;
    }
}

export function booleanSubtract(outlineA, outlineB) {
    try {
        const a = outlineToTurfFeature(outlineA);
        const b = outlineToTurfFeature(outlineB);
        if (!a || !b) return null;

        const diff = turf.difference(turf.featureCollection([a.feature, b.feature]));
        if (!diff) return outlineA;

        return featureToOutline(diff, outlineA, a.coordinateMode);
    } catch (e) {
        console.error("Boolean subtract failed:", e);
        return outlineA;
    }
}

export function booleanIntersect(outlineA, outlineB) {
    try {
        const a = outlineToTurfFeature(outlineA);
        const b = outlineToTurfFeature(outlineB);
        if (!a || !b) return null;

        const intersect = turf.intersect(turf.featureCollection([a.feature, b.feature]));
        if (!intersect) return null;

        return featureToOutline(intersect, outlineA, a.coordinateMode);
    } catch (e) {
        console.error("Boolean intersect failed:", e);
        return null;
    }
}
