import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom"
import { thunkGetAllProperties } from "../../redux/properties";
import RenderComponent from "../../components/RenderPageComponents/RenderComponent";
import RenderMapBackground from "../../components/RenderPageComponents/RenderMapBackground/RenderMapBackground";
import { trackEvent } from "../../functions/analytics";
import AssetsPanel from "./AssetsPanel/AssetsPanel";
import PropertiesPanel from "./PropertiesPanel/PropertiesPanel";
import Toolbar from "./Toolbar/Toolbar";
import StageBar from "./StageBar";
import MapToggle from "./MapToggle/MapToggle";
import useRenderStaging from "../../hooks/useRenderStaging";
import useOutlineHistory from "../../hooks/useOutlineHistory";
import useObjectsHistory from "../../hooks/useObjectsHistory";
import { makeProjection, groundDistanceMeters } from "../../functions/geoProject";
import { generateTemplate } from "../../functions/outlineTemplates";
import { generateRoomTemplate } from "../../functions/roomTemplates";
import { booleanUnion, booleanSubtract, booleanIntersect } from "../../functions/booleanOps";
import { validateOutlines } from "../../functions/outlineValidation";
import { getOutlineArea, getOutlinePerimeter } from "../../functions/outlineValidation";
import * as turf from "@turf/turf";
import "./RenderPage.css"

const ROOM_TYPE_COLORS = {
    bedroom: "#6366f1",
    bathroom: "#06b6d4",
    kitchen: "#10b981",
    living_room: "#f59e0b",
    dining_room: "#ef4444",
    office: "#8b5cf6",
    garage: "#6b7280",
    closet: "#ec4899",
    hallway: "#14b8a6",
    other: "#6b7280",
};

const DEFAULT_WALL_PADDING = 8;
const DEFAULT_DOOR_WIDTH = 34;
const DEFAULT_WINDOW_WIDTH = 46;

function getShapePixelDimensions(shape) {
    const radius = shape.radius ?? (shape.sides || shape.type === "circle" ? 50 : null);
    if (shape.type === "circle" || shape.sides) {
        return { width: radius * 2, height: radius * 2, radius };
    }
    return { width: shape.width || 120, height: shape.height || 80, radius: null };
}

const clampSplit = (value, min, max) => Math.max(min, Math.min(value, max));

function linesIntersect(a, b) {
    const det = (a.x2 - a.x1) * (b.y2 - b.y1) - (a.y2 - a.y1) * (b.x2 - b.x1);
    if (Math.abs(det) < 0.0001) return false;
    const t = ((b.x1 - a.x1) * (b.y2 - b.y1) - (b.y1 - a.y1) * (b.x2 - b.x1)) / det;
    const u = ((b.x1 - a.x1) * (a.y2 - a.y1) - (b.y1 - a.y1) * (a.x2 - a.x1)) / det;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function lineIntersectsRoom(line, room) {
    const rect = {
        left: room.x,
        top: room.y,
        right: room.x + room.width,
        bottom: room.y + room.height,
    };
    const pointInside = (x, y) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    if (pointInside(line.x1, line.y1) || pointInside(line.x2, line.y2)) return true;
    const edges = [
        { x1: rect.left, y1: rect.top, x2: rect.right, y2: rect.top },
        { x1: rect.right, y1: rect.top, x2: rect.right, y2: rect.bottom },
        { x1: rect.right, y1: rect.bottom, x2: rect.left, y2: rect.bottom },
        { x1: rect.left, y1: rect.bottom, x2: rect.left, y2: rect.top },
    ];
    return edges.some(edge => linesIntersect(line, edge));
}

function roomsTouchingDivider(divider, rooms) {
    return rooms.filter(room => lineIntersectsRoom(divider, room));
}

function lineIntersectionPoint(a, b) {
    const det = (a.x2 - a.x1) * (b.y2 - b.y1) - (a.y2 - a.y1) * (b.x2 - b.x1);
    if (Math.abs(det) < 0.0001) return null;
    const t = ((b.x1 - a.x1) * (b.y2 - b.y1) - (b.y1 - a.y1) * (b.x2 - b.x1)) / det;
    const u = ((b.x1 - a.x1) * (a.y2 - a.y1) - (b.y1 - a.y1) * (a.x2 - a.x1)) / det;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return {
        x: a.x1 + t * (a.x2 - a.x1),
        y: a.y1 + t * (a.y2 - a.y1),
    };
}

function pointDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function clonePoints(points) {
    return Array.isArray(points) ? points.map(point => Array.isArray(point) ? [...point] : point) : undefined;
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

function getGeoCentroid(points) {
    if (!Array.isArray(points) || !points.length) return null;
    const total = points.reduce((acc, point) => ({
        lat: acc.lat + Number(point[0]),
        lng: acc.lng + Number(point[1]),
    }), { lat: 0, lng: 0 });
    return { lat: total.lat / points.length, lng: total.lng / points.length };
}

function closeLngLatRing(coords) {
    if (!Array.isArray(coords) || coords.length < 3) return null;
    const ring = coords.map(([lng, lat]) => [Number(lng), Number(lat)])
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
    if (ring.length < 3) return null;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
    return ring;
}

function outlineMetricBoxRing(outline) {
    if (outline?.lat == null || outline?.lng == null || !outline?.widthMeters || !outline?.heightMeters) return null;
    const lat = Number(outline.lat);
    const lng = Number(outline.lng);
    const halfW = Number(outline.widthMeters) / 2;
    const halfH = Number(outline.heightMeters) / 2;
    const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.000001);
    const dLng = halfW / (111320 * cosLat);
    const dLat = halfH / 111320;
    return closeLngLatRing([
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
    ]);
}

function outlineToLngLatRing(outline, projection) {
    if (!outline) return null;
    if (Array.isArray(outline.pointsGeo) && outline.pointsGeo.length >= 3) {
        return closeLngLatRing(outline.pointsGeo.map(([lat, lng]) => [lng, lat]));
    }
    if (isLikelyGeoPoints(outline.points)) {
        return closeLngLatRing(outline.points.map(([lat, lng]) => [lng, lat]));
    }
    const metricRing = outlineMetricBoxRing(outline);
    if (metricRing) return metricRing;
    if (projection && Array.isArray(outline.points) && outline.points.length >= 3) {
        const originX = outline.x ?? 0;
        const originY = outline.y ?? 0;
        return closeLngLatRing(outline.points.map(([px, py]) => {
            const p = projection.unproject(originX + px, originY + py);
            return [p.lng, p.lat];
        }));
    }
    if (projection && outline.x != null && outline.y != null && outline.width && outline.height) {
        return closeLngLatRing([
            projection.unproject(outline.x, outline.y),
            projection.unproject(outline.x + outline.width, outline.y),
            projection.unproject(outline.x + outline.width, outline.y + outline.height),
            projection.unproject(outline.x, outline.y + outline.height),
        ].map(point => [point.lng, point.lat]));
    }
    return null;
}

function polygonFeatureToOutline(feature, sourceOutline = {}) {
    if (!feature?.geometry) return null;
    let polygon = feature;
    if (feature.geometry.type === "MultiPolygon") {
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
        polygon = largest;
    }
    if (!polygon?.geometry || polygon.geometry.type !== "Polygon") return null;
    const ring = polygon.geometry.coordinates?.[0];
    if (!Array.isArray(ring) || ring.length < 4) return null;
    const openRing = ring.slice(0, -1);
    const points = openRing.map(([lng, lat]) => [lat, lng]);
    const centroid = turf.centroid(polygon).geometry.coordinates;
    const bbox = turf.bbox(polygon);
    const centerLat = centroid[1];
    const centerLng = centroid[0];
    return {
        type: "polygon",
        outlineType: "polygon",
        name: sourceOutline.name ? `${sourceOutline.name} Offset` : "Offset Outline",
        points,
        pointsGeo: clonePoints(points),
        lat: centerLat,
        lng: centerLng,
        widthMeters: groundDistanceMeters(bbox[0], centerLat, bbox[2], centerLat),
        heightMeters: groundDistanceMeters(centerLng, bbox[1], centerLng, bbox[3]),
        fill: sourceOutline.fill || "#6366f1",
        stroke: sourceOutline.stroke || "#00d4ff",
        strokeWidth: sourceOutline.strokeWidth || 2,
        opacity: sourceOutline.opacity ?? 1,
        level: sourceOutline.level || 1,
    };
}

function getScreenPointBounds(points) {
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}

function outlineToScreenPoints(outline, projection) {
    if (!outline || !projection) return [];
    const geoPoints = Array.isArray(outline.pointsGeo) && outline.pointsGeo.length >= 3
        ? outline.pointsGeo
        : (isLikelyGeoPoints(outline.points) ? outline.points : null);

    if (geoPoints) {
        return geoPoints.map(([lat, lng]) => {
            const point = projection.project(lng, lat);
            return { x: point.x, y: point.y };
        });
    }

    if (Array.isArray(outline.points) && outline.points.length >= 3) {
        const originX = outline.x ?? 0;
        const originY = outline.y ?? 0;
        return outline.points.map(([x, y]) => ({ x: originX + x, y: originY + y }));
    }

    return [];
}

function outlineToScreenBounds(outline, projection) {
    const points = outlineToScreenPoints(outline, projection);
    if (points.length >= 3) {
        const bounds = getScreenPointBounds(points);
        return {
            x: bounds.minX,
            y: bounds.minY,
            width: Math.max(bounds.maxX - bounds.minX, 1),
            height: Math.max(bounds.maxY - bounds.minY, 1),
        };
    }

    if (outline?.lat != null && outline?.lng != null && projection) {
        const center = projection.project(outline.lng, outline.lat);
        const width = Math.max(1, projection.metersToPxX(outline.widthMeters || 100, outline.lng, outline.lat));
        const height = Math.max(1, projection.metersToPxY(outline.heightMeters || 100, outline.lng, outline.lat));
        return { x: center.x - width / 2, y: center.y - height / 2, width, height };
    }

    return {
        x: outline?.x ?? 0,
        y: outline?.y ?? 0,
        width: outline?.width || 100,
        height: outline?.height || 100,
    };
}

function outlineFromScreenPoints(outline, screenPoints, projection) {
    if (!outline || !projection || !Array.isArray(screenPoints) || screenPoints.length < 3) return outline;
    const pointsGeo = screenPoints.map(point => {
        const geo = projection.unproject(point.x, point.y);
        return [geo.lat, geo.lng];
    });
    const bounds = getScreenPointBounds(screenPoints);
    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const center = projection.unproject(bounds.minX + width / 2, bounds.minY + height / 2);
    const left = projection.unproject(bounds.minX, bounds.minY + height / 2);
    const right = projection.unproject(bounds.maxX, bounds.minY + height / 2);
    const top = projection.unproject(bounds.minX + width / 2, bounds.minY);
    const bottom = projection.unproject(bounds.minX + width / 2, bounds.maxY);

    const next = {
        ...outline,
        type: "polygon",
        outlineType: "polygon",
        points: pointsGeo,
        pointsGeo: clonePoints(pointsGeo),
        lat: center.lat,
        lng: center.lng,
        widthMeters: groundDistanceMeters(left.lng, left.lat, right.lng, right.lat),
        heightMeters: groundDistanceMeters(top.lng, top.lat, bottom.lng, bottom.lat),
    };
    delete next.x;
    delete next.y;
    delete next.width;
    delete next.height;
    return next;
}

function offsetPointToward(from, to, distance) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (!len) return { ...from };
    const d = Math.min(distance, len / 2);
    return {
        x: from.x + (dx / len) * d,
        y: from.y + (dy / len) * d,
    };
}

function quadraticPoint(a, control, b, t) {
    const mt = 1 - t;
    return {
        x: mt * mt * a.x + 2 * mt * t * control.x + t * t * b.x,
        y: mt * mt * a.y + 2 * mt * t * control.y + t * t * b.y,
    };
}

function isSectionRoom(item) {
    return item?.type === "room" && !!item.floor_id;
}

function isVisibleSectionRoom(item) {
    return isSectionRoom(item) && item.sectionRole !== "base";
}

function createBaseRoomFromOutline(outline) {
    const baseRoom = {
        id: `room-base-${outline.id}`,
        name: "Base Layout",
        type: "room",
        sectionRole: "base",
        outlineType: outline.outlineType || outline.type || "rectangle",
        sourceOutlineId: outline.id,
        roomType: "other",
        floor_id: outline.id,
        fill: "rgba(99, 102, 241, 0.4)",
        stroke: "#6366f1",
        strokeWidth: 1.5,
    };

    if (outline.sides) baseRoom.sides = outline.sides;
    if (outline.radius != null) baseRoom.radius = outline.radius;
    if (outline.radiusMeters != null) baseRoom.radiusMeters = outline.radiusMeters;
    if (outline.rotation) baseRoom.rotation = outline.rotation;
    if (Array.isArray(outline.points)) baseRoom.points = clonePoints(outline.points);
    if (Array.isArray(outline.pointsGeo)) baseRoom.pointsGeo = clonePoints(outline.pointsGeo);

    if (outline.lat != null && outline.lng != null) {
        baseRoom.lat = outline.lat;
        baseRoom.lng = outline.lng;
        if (outline.widthMeters != null) baseRoom.widthMeters = outline.widthMeters;
        if (outline.heightMeters != null) baseRoom.heightMeters = outline.heightMeters;
        if (outline.width != null) baseRoom.width = outline.width;
        if (outline.height != null) baseRoom.height = outline.height;
    } else {
        baseRoom.x = outline.x ?? 0;
        baseRoom.y = outline.y ?? 0;
        baseRoom.width = outline.width ?? 100;
        baseRoom.height = outline.height ?? 100;
    }

    return baseRoom;
}

function geoForDividerLine(proj, line) {
    if (!proj) return {};
    const start = proj.unproject(line.x1, line.y1);
    const end = proj.unproject(line.x2, line.y2);
    return {
        pointsGeo: [
            [start.lat, start.lng],
            [end.lat, end.lng],
        ],
    };
}

function geoForScreenRect(proj, x, y, width, height) {
    if (!proj) return {};
    const center = proj.unproject(x + width / 2, y + height / 2);
    const left = proj.unproject(x, y + height / 2);
    const right = proj.unproject(x + width, y + height / 2);
    const top = proj.unproject(x + width / 2, y);
    const bottom = proj.unproject(x + width / 2, y + height);
    return {
        lat: center.lat,
        lng: center.lng,
        widthMeters: groundDistanceMeters(left.lng, left.lat, right.lng, right.lat),
        heightMeters: groundDistanceMeters(top.lng, top.lat, bottom.lng, bottom.lat),
    };
}

function getDividerAxis(divider) {
    const dx = Math.abs((divider.x2 ?? 0) - (divider.x1 ?? 0));
    const dy = Math.abs((divider.y2 ?? 0) - (divider.y1 ?? 0));
    if (dx > dy * 1.5) return "horizontal";
    if (dy > dx * 1.5) return "vertical";
    return "free";
}

function screenRoom(room, proj) {
    if (room.lat != null && room.lng != null && proj) {
        const center = proj.project(room.lng, room.lat);
        const mw = room.widthMeters || (room.width ? proj.pxToMetersX(room.width, room.lng, room.lat) : 100);
        const mh = room.heightMeters || (room.height ? proj.pxToMetersY(room.height, room.lng, room.lat) : 100);
        const width = Math.max(10, Math.round(proj.metersToPxX(mw, room.lng, room.lat)));
        const height = Math.max(10, Math.round(proj.metersToPxY(mh, room.lng, room.lat)));
        return {
            ...room,
            x: Math.round(center.x - width / 2),
            y: Math.round(center.y - height / 2),
            width,
            height,
        };
    }
    return {
        ...room,
        x: room.x ?? 0,
        y: room.y ?? 0,
        width: room.width || 100,
        height: room.height || 100,
    };
}

function screenDivider(divider, proj) {
    if (proj && Array.isArray(divider.pointsGeo) && divider.pointsGeo.length >= 2) {
        const start = divider.pointsGeo[0];
        const end = divider.pointsGeo[1];
        const p1 = proj.project(start[1], start[0]);
        const p2 = proj.project(end[1], end[0]);
        return { ...divider, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    return divider;
}

function wallPaddingFromSettings(settings = {}) {
    return Math.max(1, Math.min(80, Number(settings.wallPadding) || DEFAULT_WALL_PADDING));
}

function openingWidthFromSettings(settings = {}, openingType) {
    const fallback = openingType === "window" ? DEFAULT_WINDOW_WIDTH : DEFAULT_DOOR_WIDTH;
    const key = openingType === "window" ? "windowWidth" : "doorWidth";
    return Math.max(12, Math.min(180, Number(settings[key]) || fallback));
}

function detectRoomEdge(clickX, clickY, room, threshold = 15) {
    if (!room) return null;
    const { x, y, width, height } = room;
    const distTop = Math.abs(clickY - y);
    const distBottom = Math.abs(clickY - (y + height));
    const distLeft = Math.abs(clickX - x);
    const distRight = Math.abs(clickX - (x + width));
    const minDist = Math.min(distTop, distBottom, distLeft, distRight);
    if (minDist > threshold) return null;
    if (minDist === distTop) return "top";
    if (minDist === distBottom) return "bottom";
    if (minDist === distLeft) return "left";
    if (minDist === distRight) return "right";
    return null;
}

function wallSideRect(room, edge, thickness) {
    const t = Math.max(1, Math.min(thickness, Math.max(room.width, room.height)));
    if (edge === "top") return { x: room.x, y: room.y, width: room.width, height: Math.min(t, room.height) };
    if (edge === "bottom") return { x: room.x, y: room.y + room.height - Math.min(t, room.height), width: room.width, height: Math.min(t, room.height) };
    if (edge === "left") return { x: room.x, y: room.y, width: Math.min(t, room.width), height: room.height };
    if (edge === "right") return { x: room.x + room.width - Math.min(t, room.width), y: room.y, width: Math.min(t, room.width), height: room.height };
    return null;
}

function makeWallPadItem({ id, wallType, floorId, parentId, point, room, settings }) {
    if (!room) return null;
    const thickness = wallPaddingFromSettings(settings);
    if (wallType === "wall_square") {
        return {
            id,
            name: "Full Wall",
            type: "wall",
            wallType,
            edge: "all",
            wallThickness: thickness,
            floor_id: floorId,
            parent_id: parentId,
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
            fill: "#52525b",
            stroke: "#111827",
            strokeWidth: 1,
        };
    }

    const edge = point ? detectRoomEdge(point.x, point.y, room, Math.max(15, thickness * 2)) : null;
    if (!edge) return null;
    return {
        id,
        name: "Section Wall",
        type: "wall",
        wallType,
        edge,
        wallThickness: thickness,
        floor_id: floorId,
        parent_id: parentId,
        ...wallSideRect(room, edge, thickness),
        fill: "#d4d4d8",
        stroke: "#111827",
        strokeWidth: 1,
    };
}

function makeOpeningItem({ id, openingType, floorId, parentId, point, room, settings }) {
    if (!room || !point) return null;
    const thickness = Math.max(4, wallPaddingFromSettings(settings) + 2);
    const edge = detectRoomEdge(point.x, point.y, room, Math.max(15, thickness * 2));
    if (!edge) return null;
    const length = openingWidthFromSettings(settings, openingType);
    const margin = 4;
    let rect;
    if (edge === "top" || edge === "bottom") {
        const width = Math.max(8, Math.min(length, room.width - margin * 2));
        const x = Math.max(room.x + margin, Math.min(point.x - width / 2, room.x + room.width - width - margin));
        rect = { x, y: edge === "top" ? room.y : room.y + room.height - thickness, width, height: thickness };
    } else {
        const height = Math.max(8, Math.min(length, room.height - margin * 2));
        const y = Math.max(room.y + margin, Math.min(point.y - height / 2, room.y + room.height - height - margin));
        rect = { x: edge === "left" ? room.x : room.x + room.width - thickness, y, width: thickness, height };
    }
    return {
        id,
        name: openingType === "window" ? "Window" : "Door",
        type: "opening",
        openingType,
        edge,
        floor_id: floorId,
        parent_id: parentId,
        ...rect,
        fill: openingType === "window" ? "#38bdf8" : "#f8fafc",
        stroke: openingType === "window" ? "#0ea5e9" : "#475569",
        strokeWidth: 1,
    };
}

function roomContainsPoint(room, point, tolerance = 2) {
    return point.x >= room.x - tolerance
        && point.x <= room.x + room.width + tolerance
        && point.y >= room.y - tolerance
        && point.y <= room.y + room.height + tolerance;
}

function roomsForSingleDividerMerge(divider, rooms, point) {
    const axis = getDividerAxis(divider);
    const touching = roomsTouchingDivider(divider, rooms);
    if (touching.length < 2) return [];

    if (axis === "horizontal") {
        const splitY = ((divider.y1 ?? 0) + (divider.y2 ?? 0)) / 2;
        const x = point?.x ?? (((divider.x1 ?? 0) + (divider.x2 ?? 0)) / 2);
        const candidates = touching.filter(room => x >= room.x - 2 && x <= room.x + room.width + 2);
        const above = candidates
            .filter(room => room.y + room.height / 2 <= splitY)
            .sort((a, b) => (b.y + b.height) - (a.y + a.height))[0];
        const below = candidates
            .filter(room => room.y + room.height / 2 > splitY)
            .sort((a, b) => a.y - b.y)[0];
        return [above, below].filter(Boolean);
    }

    if (axis === "vertical") {
        const splitX = ((divider.x1 ?? 0) + (divider.x2 ?? 0)) / 2;
        const y = point?.y ?? (((divider.y1 ?? 0) + (divider.y2 ?? 0)) / 2);
        const candidates = touching.filter(room => y >= room.y - 2 && y <= room.y + room.height + 2);
        const left = candidates
            .filter(room => room.x + room.width / 2 <= splitX)
            .sort((a, b) => (b.x + b.width) - (a.x + a.width))[0];
        const right = candidates
            .filter(room => room.x + room.width / 2 > splitX)
            .sort((a, b) => a.x - b.x)[0];
        return [left, right].filter(Boolean);
    }

    return touching.slice(0, 2);
}

function crossingDividerAtPoint(divider, dividers, point, threshold = 14) {
    if (!point) return null;
    const axis = getDividerAxis(divider);
    if (axis === "free") return null;
    for (const other of dividers) {
        if (other.id === divider.id || getDividerAxis(other) === axis) continue;
        const intersection = lineIntersectionPoint(divider, other);
        if (intersection && pointDistance(point, intersection) <= threshold) {
            return { divider: other, point: intersection };
        }
    }
    return null;
}

function roomsForCrossMerge(crossPoint, rooms) {
    return rooms.filter(room => roomContainsPoint(room, crossPoint, 2));
}

export default function RenderPage() {
    const propertyStore = useSelector(store => store.properties);
    const { pathname } = useLocation();
    const id = Number(pathname.split("/")[2]);
    const [property, setProperty] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        items: stagedItems, setItems: setStagedItems,
        addItem, removeItem,
        history, historyIndex,
        saving, handleSaveAll,
        undo, redo, addFloor,
    } = useRenderStaging(id);

    const outlineHistory = useOutlineHistory(id);
    const { outlines, setOutlines } = outlineHistory;

    const objectsHistory = useObjectsHistory(id);
    const { objects, setObjects, canUndo: canUndoObjects, canRedo: canRedoObjects, undo: undoObjects, redo: redoObjects, saveObjects } = objectsHistory;

    const [selectedObjectId, setSelectedObjectId] = useState(null);

    const [stage, setStage] = useState("outline");

    const wrappedSaveAll = useCallback(async (e) => {
        await handleSaveAll(e);
        if (id && outlines.length > 0) {
            await outlineHistory.saveOutlines(id);
        }
        if (id && objects.length > 0) {
            await saveObjects(id);
        }
        if (id) {
            const sectionItems = Object.values(stagedItems).filter(item =>
                item.type === "divider_line" || item.type === "wall" || item.type === "opening"
            );
            if (sectionItems.length > 0 || Object.keys(stagedItems).length > 0) {
                try {
                    const token = localStorage.getItem("token");
                    await fetch(`/api/renders/${id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            has_sections: sectionItems.length > 0,
                            sections_data: Object.values(stagedItems),
                        }),
                    });
                } catch (err) {
                    console.error("Failed to save sections data:", err);
                }
            }
        }
    }, [handleSaveAll, id, outlines, objects, outlineHistory, saveObjects, stagedItems]);

    const stageUndo = stage === "outline" ? outlineHistory.undo : stage === "objects" ? undoObjects : undo;
    const stageRedo = stage === "outline" ? outlineHistory.redo : stage === "objects" ? redoObjects : redo;
    const canUndo = stage === "outline" ? outlineHistory.canUndo : stage === "objects" ? canUndoObjects : historyIndex > 0;
    const canRedo = stage === "outline" ? outlineHistory.canRedo : stage === "objects" ? canRedoObjects : historyIndex < history.length - 1;

    const [pendingPlacement, setPendingPlacement] = useState(null);
    useEffect(() => {
        if (stage === "outline") baseRoomsCreatedRef.current = false;
    }, [stage]);
    useEffect(() => {
        const init = async () => {
            try { await dispatch(thunkGetAllProperties()); } catch (e) { console.error(e); }
            setInitialized(true);
            setLoaded(true);
        };
        init();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!initialized) return;
        const prop = propertyStore.data?.find(p => p.id === id);
        if (prop) setProperty(prop);
    }, [initialized, propertyStore?.data, id]);

    useEffect(() => {
        if (!id || !loaded) return;
        const loadOutlines = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/renders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const render = data?.data?.render;
                if (render?.outlines_data?.length) {
                    setOutlines(prev => prev.length > 0 ? prev : render.outlines_data);
                }
            } catch (e) { console.error("Failed to load outlines:", e); }
        };
        loadOutlines();
    }, [id, loaded, setOutlines]);

    useEffect(() => {
        if (!id || !loaded) return;
        const loadObjects = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/renders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const render = data?.data?.render;
                if (render?.objects_data?.length) {
                    setObjects(prev => prev.length > 0 ? prev : render.objects_data);
                }
            } catch (e) { console.error("Failed to load objects:", e); }
        };
        loadObjects();
    }, [id, loaded, setObjects]);

    const [activeFloorId, setActiveFloorId] = useState(null);
    const [selectedShapeId, setSelectedShapeId] = useState(null);
    const [multiSelectIds, setMultiSelectIds] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [mapLayer, setMapLayer] = useState("satellite");
    const [mapDistance, setMapDistance] = useState(200);
    const [showOffset, setShowOffset] = useState(false);
    const [offsetDistance, setOffsetDistance] = useState(1);
    const [vertexMode, setVertexMode] = useState(false);
    const [selectedVertexIndex, setSelectedVertexIndex] = useState(-1);
    const [validationResults, setValidationResults] = useState({ isValid: true, warnings: [], measurements: [] });
    const [sectionWarnings, setSectionWarnings] = useState([]);
    const mapRef = useRef(null);
    const [mapVersion, setMapVersion] = useState(0);
    const onMapViewChange = useCallback(() => setMapVersion(v => v + 1), []);
    const baseRoomsCreatedRef = useRef(false);

    const screenToGeo = useCallback((px, py, w, h) => {
        const proj = makeProjection(mapRef.current);
        if (!proj || !property) return null;
        const center = proj.unproject(px + w / 2, py + h / 2);
        const left = proj.unproject(px, py + h / 2);
        const right = proj.unproject(px + w, py + h / 2);
        const top = proj.unproject(px + w / 2, py);
        const bottom = proj.unproject(px + w / 2, py + h);
        const widthMeters = groundDistanceMeters(left.lng, left.lat, right.lng, right.lat);
        const heightMeters = groundDistanceMeters(top.lng, top.lat, bottom.lng, bottom.lat);
        return {
            lat: center.lat, lng: center.lng,
            widthMeters,
            heightMeters,
            metersPerPixel: Math.min(widthMeters / (w || 1), heightMeters / (h || 1)),
        };
    }, [property]);

    const selectedCount = multiSelectIds.length > 0 ? multiSelectIds.length : (selectedShapeId ? 1 : 0);

    const handleCanvasSelect = useCallback((id, ctrlKey) => {
        setSelectedVertexIndex(-1);
        if (ctrlKey) {
            setMultiSelectIds(prev => {
                const base = prev.length > 0 ? prev : (selectedShapeId && selectedShapeId !== id ? [selectedShapeId] : []);
                return base.includes(id) ? base.filter(x => x !== id) : [...base, id];
            });
            setSelectedShapeId(prev => prev === id ? null : id);
        } else {
            setMultiSelectIds([]);
            setSelectedShapeId(id);
        }
    }, [selectedShapeId]);

    const handleBooleanOp = useCallback((opType) => {
        if (multiSelectIds.length < 2) return;
        const outlinesById = new Map(outlines.map(o => [o.id, o]));
        const outlinesA = multiSelectIds.map(id => outlinesById.get(id)).filter(Boolean);
        if (outlinesA.length < 2) return;
        let result = outlinesA[0];
        for (let i = 1; i < outlinesA.length; i++) {
            if (opType === "union") result = booleanUnion(result, outlinesA[i]);
            else if (opType === "subtract") result = booleanSubtract(result, outlinesA[i]);
            else if (opType === "intersect") result = booleanIntersect(result, outlinesA[i]);
            if (!result) break;
        }
        if (result) {
            const newId = `shape-${Date.now()}`;
            const resultNames = {
                union: "Union Outline",
                subtract: "Subtracted Outline",
                intersect: "Intersected Outline",
            };
            result.id = newId;
            result.name = result.name || resultNames[opType] || "Combined Outline";
            result.level = result.level || outlinesA[0]?.level || 1;
            setOutlines(prev => [...prev.filter(o => !multiSelectIds.includes(o.id)), result]);
            setMultiSelectIds([]);
            setSelectedShapeId(newId);
        }
    }, [multiSelectIds, outlines, setOutlines]);

    const handleToggleVertexMode = useCallback(() => {
        setVertexMode(prev => {
            const next = !prev;
            setSelectedVertexIndex(-1);
            return next;
        });
    }, []);

    const addShape = useCallback((shapeData) => {
        const id = `shape-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        if (stage === "outline" && mapRef.current) {
            const pointsGeo = Array.isArray(shapeData.pointsGeo)
                ? clonePoints(shapeData.pointsGeo)
                : (isLikelyGeoPoints(shapeData.points) ? clonePoints(shapeData.points) : null);
            if (pointsGeo?.length) {
                const centroid = getGeoCentroid(pointsGeo);
                const newItem = {
                    ...shapeData,
                    id,
                    type: shapeData.type || "polygon",
                    outlineType: shapeData.outlineType || shapeData.type || "polygon",
                    points: pointsGeo,
                    pointsGeo,
                    lat: shapeData.lat ?? centroid?.lat,
                    lng: shapeData.lng ?? centroid?.lng,
                    fill: shapeData.fill || "#6366f1",
                    stroke: shapeData.stroke || "#00d4ff",
                    strokeWidth: shapeData.strokeWidth || 2,
                };
                delete newItem.x; delete newItem.y; delete newItem.width; delete newItem.height; delete newItem.radius;
                setOutlines(prev => [...prev, newItem]);
                setSelectedShapeId(id);
                return;
            }

            if (shapeData.lat != null && shapeData.lng != null) {
                const newItem = {
                    ...shapeData,
                    id,
                    fill: shapeData.fill || "#6366f1",
                    stroke: shapeData.stroke || "#00d4ff",
                    strokeWidth: shapeData.strokeWidth || 2,
                };
                delete newItem.x; delete newItem.y; delete newItem.width; delete newItem.height; delete newItem.radius;
                setOutlines(prev => [...prev, newItem]);
                setSelectedShapeId(id);
                return;
            }

            const anchorX = shapeData.x ?? 300;
            const anchorY = shapeData.y ?? 200;
            const dims = getShapePixelDimensions(shapeData);
            const geo = screenToGeo(anchorX, anchorY, dims.width, dims.height);
            if (geo) {
                const newItem = {
                    ...shapeData, id,
                    lat: geo.lat, lng: geo.lng,
                    widthMeters: geo.widthMeters,
                    heightMeters: geo.heightMeters,
                };
                if (dims.radius != null) newItem.radiusMeters = dims.radius * geo.metersPerPixel;
                delete newItem.x; delete newItem.y; delete newItem.width; delete newItem.height; delete newItem.radius;
                if (Array.isArray(shapeData.points)) {
                    const proj = makeProjection(mapRef.current);
                    newItem.points = shapeData.points.map(([nx, ny]) => {
                        const p = proj.unproject(anchorX + nx, anchorY + ny);
                        return [p.lat, p.lng];
                    });
                    newItem.pointsGeo = clonePoints(newItem.points);
                }
                setOutlines(prev => [...prev, newItem]);
                setSelectedShapeId(id);
                return;
            }
        }
        const newItem = { ...shapeData, id, x: shapeData.x ?? 300, y: shapeData.y ?? 200 };
        if (stage === "outline") {
            setOutlines(prev => [...prev, newItem]);
        } else {
            setStagedItems(prev => ({ ...prev, [id]: newItem }));
        }
        setSelectedShapeId(id);
    }, [setStagedItems, stage, setOutlines, screenToGeo]);

    const updateShape = useCallback((updated) => {
        if (stage === "outline") {
            setOutlines(prev => prev.map(o => o.id === updated.id ? updated : o));
        } else {
            setStagedItems(prev => ({ ...prev, [updated.id]: updated }));
        }
    }, [setStagedItems, stage, setOutlines]);

    const commitScreenPointsForOutline = useCallback((outline, screenPoints) => {
        const proj = makeProjection(mapRef.current);
        if (!outline || !proj) return;
        updateShape(outlineFromScreenPoints(outline, screenPoints, proj));
    }, [updateShape]);

    const handleMoveVertex = useCallback((index, point) => {
        if (!selectedShapeId || !point) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        const proj = makeProjection(mapRef.current);
        if (!outline || !proj) return;
        const points = outlineToScreenPoints(outline, proj);
        if (index < 0 || index >= points.length) return;
        points[index] = { x: point.x, y: point.y };
        updateShape(outlineFromScreenPoints(outline, points, proj));
    }, [selectedShapeId, outlines, updateShape]);

    const handleAddVertex = useCallback(() => {
        if (!selectedShapeId) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        const proj = makeProjection(mapRef.current);
        if (!outline || !proj) return;
        const points = outlineToScreenPoints(outline, proj);
        if (points.length < 3) return;

        let edgeIndex = selectedVertexIndex >= 0 ? selectedVertexIndex : 0;
        if (selectedVertexIndex < 0) {
            let longest = -1;
            for (let i = 0; i < points.length; i++) {
                const a = points[i];
                const b = points[(i + 1) % points.length];
                const length = Math.hypot(b.x - a.x, b.y - a.y);
                if (length > longest) {
                    longest = length;
                    edgeIndex = i;
                }
            }
        }

        const a = points[edgeIndex];
        const b = points[(edgeIndex + 1) % points.length];
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const nextPoints = [...points];
        const insertIndex = edgeIndex + 1;
        nextPoints.splice(insertIndex, 0, midpoint);
        commitScreenPointsForOutline(outline, nextPoints);
        setSelectedVertexIndex(insertIndex);
    }, [selectedShapeId, selectedVertexIndex, outlines, commitScreenPointsForOutline]);

    const handleRemoveVertex = useCallback(() => {
        if (!selectedShapeId || selectedVertexIndex < 0) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        const proj = makeProjection(mapRef.current);
        if (!outline || !proj) return;
        const points = outlineToScreenPoints(outline, proj);
        if (points.length <= 3) return;

        const nextPoints = points.filter((_, i) => i !== selectedVertexIndex);
        commitScreenPointsForOutline(outline, nextPoints);
        setSelectedVertexIndex(Math.min(selectedVertexIndex, nextPoints.length - 1));
    }, [selectedShapeId, selectedVertexIndex, outlines, commitScreenPointsForOutline]);

    const handleChamfer = useCallback(() => {
        if (!selectedShapeId || selectedVertexIndex < 0) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        const proj = makeProjection(mapRef.current);
        if (!outline || !proj) return;
        const points = outlineToScreenPoints(outline, proj);
        if (points.length < 3) return;

        const idx = selectedVertexIndex;
        const prevIdx = (idx - 1 + points.length) % points.length;
        const nextIdx = (idx + 1) % points.length;
        const v = points[idx];
        const vPrev = points[prevIdx];
        const vNext = points[nextIdx];
        const len1 = Math.hypot(v.x - vPrev.x, v.y - vPrev.y);
        const len2 = Math.hypot(vNext.x - v.x, vNext.y - v.y);
        if (!len1 || !len2) return;

        const distance = Math.max(6, Math.min(18, len1 / 3, len2 / 3));
        const chamfer1 = offsetPointToward(v, vPrev, distance);
        const chamfer2 = offsetPointToward(v, vNext, distance);
        const nextPoints = [...points];
        nextPoints.splice(idx, 1, chamfer1, chamfer2);
        commitScreenPointsForOutline(outline, nextPoints);
        setSelectedVertexIndex(idx + 1);
    }, [selectedShapeId, selectedVertexIndex, outlines, commitScreenPointsForOutline]);

    const handleFillet = useCallback(() => {
        if (!selectedShapeId || selectedVertexIndex < 0) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        const proj = makeProjection(mapRef.current);
        if (!outline || !proj) return;
        const points = outlineToScreenPoints(outline, proj);
        if (points.length < 3) return;

        const idx = selectedVertexIndex;
        const prevIdx = (idx - 1 + points.length) % points.length;
        const nextIdx = (idx + 1) % points.length;
        const v = points[idx];
        const vPrev = points[prevIdx];
        const vNext = points[nextIdx];
        const len1 = Math.hypot(v.x - vPrev.x, v.y - vPrev.y);
        const len2 = Math.hypot(vNext.x - v.x, vNext.y - v.y);
        if (!len1 || !len2) return;

        const distance = Math.max(8, Math.min(24, len1 / 3, len2 / 3));
        const start = offsetPointToward(v, vPrev, distance);
        const end = offsetPointToward(v, vNext, distance);
        const curve = [0, 0.25, 0.5, 0.75, 1].map(t => quadraticPoint(start, v, end, t));
        const nextPoints = [...points];
        nextPoints.splice(idx, 1, ...curve);
        commitScreenPointsForOutline(outline, nextPoints);
        setSelectedVertexIndex(idx + Math.floor(curve.length / 2));
    }, [selectedShapeId, selectedVertexIndex, outlines, commitScreenPointsForOutline]);

    const onBooleanOp = handleBooleanOp;

    const onShowOffset = useCallback(() => {
        setShowOffset(prev => !prev);
    }, []);

    const createOffsetOutline = useCallback((outline, distanceMeters) => {
        if (!outline || !mapRef.current) return null;
        const proj = makeProjection(mapRef.current);
        if (!proj) return null;
        const distance = Math.max(-100, Math.min(100, Number(distanceMeters) || 0));
        if (!distance) return null;

        try {
            const ring = outlineToLngLatRing(outline, proj);
            if (!ring) return null;
            const polygon = turf.polygon([ring]);
            const buffered = turf.buffer(polygon, distance, { units: "meters" });
            return polygonFeatureToOutline(buffered, outline);
        } catch (e) {
            console.error("Offset failed:", e);
            return null;
        }
    }, [mapRef]);

    const handleOffset = useCallback((distanceMeters) => {
        if (!selectedShapeId) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        const newOutline = createOffsetOutline(outline, distanceMeters);
        if (newOutline) addShape(newOutline);
    }, [selectedShapeId, outlines, createOffsetOutline, addShape]);

    const getDefaultPlacementPoint = useCallback(() => {
        const canvas = mapRef.current?.getCanvas?.();
        return {
            x: (canvas?.clientWidth || canvas?.width || 800) / 2,
            y: (canvas?.clientHeight || canvas?.height || 600) / 2,
        };
    }, []);

    const createTemplateShapeData = useCallback((templateId, point = null) => {
        const template = generateTemplate(templateId);
        const anchorCenter = point || getDefaultPlacementPoint();
        const proj = makeProjection(mapRef.current);
        let pxPerMeterX = 4;
        let pxPerMeterY = 4;

        if (proj) {
            const centerGeo = proj.unproject(anchorCenter.x, anchorCenter.y);
            const scale = proj.meterScaleAt(centerGeo.lng, centerGeo.lat);
            pxPerMeterX = scale.pixelsPerMeterX;
            pxPerMeterY = scale.pixelsPerMeterY;
        }

        const width = Math.max(template.width * pxPerMeterX, 8);
        const height = Math.max(template.height * pxPerMeterY, 8);
        return {
            type: "polygon",
            outlineType: "polygon",
            name: template.name,
            x: anchorCenter.x - width / 2,
            y: anchorCenter.y - height / 2,
            width,
            height,
            points: template.points.map(([mx, my]) => [mx * pxPerMeterX, my * pxPerMeterY]),
            fill: "#6366f1",
            stroke: "#00d4ff",
            strokeWidth: 2,
        };
    }, [getDefaultPlacementPoint]);

    useEffect(() => {
        if (stage !== "sections") return;
        const levelOutlines = outlines.filter(o => (o.level || 1) === selectedLevel);
        const activeStillVisible = levelOutlines.some(o => o.id === activeFloorId);
        if (!activeStillVisible) setActiveFloorId(levelOutlines[0]?.id || null);
    }, [stage, outlines, selectedLevel, activeFloorId]);

    useEffect(() => {
        if (stage !== "sections" || !outlines.length) return;
        if (baseRoomsCreatedRef.current) return;
        outlines.forEach(outline => {
            const baseId = `room-base-${outline.id}`;
            const floorItems = Object.values(stagedItems).filter(e => e.floor_id === outline.id);
            const existingBase = stagedItems[baseId];
            const hasSectionRoom = floorItems.some(isSectionRoom);

            if (!hasSectionRoom) {
                addItem(baseId, createBaseRoomFromOutline(outline));
            } else if (existingBase && !isSectionRoom(existingBase)) {
                removeItem(baseId);
            } else if (existingBase?.sectionRole === "base") {
                const expectedType = outline.outlineType || outline.type || "rectangle";
                if (existingBase.outlineType !== expectedType) {
                    addItem(baseId, createBaseRoomFromOutline(outline));
                }
            }
        });
        baseRoomsCreatedRef.current = true;
    }, [stage, outlines, stagedItems, addItem, removeItem]);
    const [tool, setTool] = useState(null);
    const [canvasSettings, setCanvasSettings] = useState({
        theme: "dark", gridActive: true, gridPixelSize: 50, gridColor: "#888",
        canvasWidth: 800, canvasHeight: 600, bgColor: "#2a2a3e",
        mapPanLimit: 500,
        gridSnap: false, edgeSnap: false, alignmentGuides: true,
        snapThreshold: 10, showMeasurements: true, unit: "metric",
        roomAutoColors: false,
        wallPadding: DEFAULT_WALL_PADDING,
        doorWidth: DEFAULT_DOOR_WIDTH,
        windowWidth: DEFAULT_WINDOW_WIDTH,
    });
    const toolSettingsRef = useRef({
        line: { type: "line", width: 2, color: "#000", draggable: true, snap: false },
        clear: { type: "clear" },
        handle: { type: "handle", width: 1, color: "#000", snap: true },
        eraser: { type: "eraser", radius: 10 },
        text: { type: "text", width: 16, color: "#000" },
        polygon: { type: "polygon", color: "#00d4ff", width: 2 },
        divider: { type: "divider" },
        select: { type: "select" },
        combine: { type: "combine" },
        wall_square: { type: "wall_square" },
        wall_line: { type: "wall_line" },
        door: { type: "door" },
        window: { type: "window" },
    });

    const deleteObject = useCallback((id) => {
        setObjects(prev => prev.filter(o => o.id !== id));
        setSelectedObjectId(null);
    }, [setObjects]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) stageRedo();
                else stageUndo();
            }
            if ((e.key === "Delete" || e.key === "Backspace") && stage === "objects" && selectedObjectId) {
                e.preventDefault();
                deleteObject(selectedObjectId);
            }
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                const key = e.key.toLowerCase();
                if (key === "g") {
                    e.preventDefault();
                    setCanvasSettings(s => ({ ...s, gridSnap: !s.gridSnap }));
                }
                if (key === "e") {
                    e.preventDefault();
                    setCanvasSettings(s => ({ ...s, edgeSnap: !s.edgeSnap }));
                }
                if (key === "a") {
                    e.preventDefault();
                    setCanvasSettings(s => ({ ...s, alignmentGuides: !s.alignmentGuides }));
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [stageUndo, stageRedo, stage, selectedObjectId, deleteObject]);

    const floors = Object.values(stagedItems).filter(s => s.type === "floor");
    const allElements = Object.values(stagedItems).filter(s => s.type !== "floor" && s.floor_id);
    const hasFloors = floors.length > 0;
    const hasRooms = allElements.some(isVisibleSectionRoom);
    const isPlanStage = stage === "sections" || stage === "objects";
    const outlineElements = stage === "outline" ? outlines : outlines;
    const currentLevelOutlines = isPlanStage ? outlines.filter(o => (o.level || 1) === selectedLevel) : outlines;
    const currentLevelFloorIds = new Set(currentLevelOutlines.map(outline => outline.id));
    const currentLevelElements = isPlanStage
        ? allElements.filter(e => currentLevelFloorIds.has(e.floor_id))
        : allElements;
    const visibleElements = isPlanStage
        ? [...currentLevelOutlines, ...currentLevelElements]
        : outlineElements;
    const visibleFloors = stage === "sections" ? floors : [];

    useEffect(() => {
        if ((stage === "objects" || stage === "render3d") && !hasRooms) {
            setSelectedObjectId(null);
            setPendingPlacement(null);
            setStage(outlines.length ? "sections" : "outline");
        }
    }, [stage, hasRooms, outlines.length]);

    useEffect(() => {
        if (stage !== "outline" || !outlines.length) return;
        const timer = setTimeout(() => {
            const results = validateOutlines(outlines, { minArea: 1, checkOverlaps: true });
            setValidationResults(results);
        }, 300);
        return () => clearTimeout(timer);
    }, [outlines, stage]);

    const handleSectionValidation = useCallback(() => {
        if (stage !== "sections") return;
        const roomItems = Object.values(stagedItems).filter(el => el.type === "room" && el.sectionRole !== "base");
        const warnings = [];
        roomItems.forEach(room => {
            const area = (room.width || 0) * (room.height || 0);
            if (area <= 0) warnings.push({ type: "zero-area-room", roomId: room.id, message: `Room ${room.name} has zero area` });
        });
        const outlineFloorIds = new Set(outlines.map(o => o.id));
        roomItems.forEach(room => {
            if (!outlineFloorIds.has(room.floor_id)) {
                warnings.push({ type: "orphan-room", roomId: room.id, message: `Room ${room.name} is not in any outline` });
            }
        });
        if (warnings.length > 0) setSectionWarnings(warnings);
        else setSectionWarnings([]);
    }, [stage, stagedItems, outlines]);

    useEffect(() => {
        handleSectionValidation();
    }, [handleSectionValidation]);

    const batchMerge = useCallback(() => {
        if (multiSelectIds.length < 2) return;
        const rooms = multiSelectIds.map(id => stagedItems[id]).filter(el => el?.type === "room");
        if (rooms.length < 2) return;
        const minX = Math.min(...rooms.map(r => r.x));
        const minY = Math.min(...rooms.map(r => r.y));
        const maxX = Math.max(...rooms.map(r => r.x + r.width));
        const maxY = Math.max(...rooms.map(r => r.y + r.height));
        rooms.forEach(room => removeItem(room.id));
        Object.values(stagedItems).forEach(item => {
            if (item.type !== "divider_line") return;
            if (item.floor_id !== rooms[0].floor_id) return;
            const touching = roomsTouchingDivider(item, rooms);
            if (touching.length >= 2) removeItem(item.id);
        });
        const mergedId = `room-${Date.now()}`;
        addItem(mergedId, {
            id: mergedId, name: "Merged Room", type: "room", roomType: "other",
            floor_id: rooms[0].floor_id, x: minX, y: minY,
            width: maxX - minX, height: maxY - minY,
            fill: rooms[0].fill, stroke: "#fff", strokeWidth: 2,
        });
        setMultiSelectIds([]);
        setSelectedShapeId(mergedId);
    }, [multiSelectIds, stagedItems, removeItem, addItem]);

    const batchDelete = useCallback(() => {
        if (multiSelectIds.length === 0) return;
        multiSelectIds.forEach(id => {
            Object.values(stagedItems).forEach(item => {
                if (item.parent_id === id) removeItem(item.id);
            });
            removeItem(id);
        });
        setMultiSelectIds([]);
        setSelectedShapeId(null);
    }, [multiSelectIds, stagedItems, removeItem]);

    const batchChangeType = useCallback((newType) => {
        if (multiSelectIds.length === 0) return;
        multiSelectIds.forEach(id => {
            const item = stagedItems[id];
            if (item?.type === "room") {
                updateShape({
                    ...item,
                    roomType: newType,
                    ...(canvasSettings.roomAutoColors ? { fill: ROOM_TYPE_COLORS[newType] || item.fill } : {}),
                });
            }
        });
        setMultiSelectIds([]);
    }, [multiSelectIds, stagedItems, updateShape, canvasSettings.roomAutoColors]);

    const batchFullWall = useCallback(() => {
        const selectedRooms = multiSelectIds
            .map(id => stagedItems[id])
            .filter(room => isVisibleSectionRoom(room));
        if (!selectedRooms.length) return;

        selectedRooms.forEach((room, index) => {
            const id = `wall-${Date.now()}${index}${Math.random().toString(36).substr(2, 4)}`;
            const wall = makeWallPadItem({
                id,
                wallType: "wall_square",
                floorId: room.floor_id,
                parentId: room.id,
                room,
                settings: canvasSettings,
            });
            if (wall) addItem(id, wall);
        });
        setMultiSelectIds([]);
    }, [multiSelectIds, stagedItems, canvasSettings, addItem]);

    const updateRoomType = useCallback((roomId, newType) => {
        const room = stagedItems[roomId];
        if (!room) return;
        const updates = { roomType: newType };
        if (canvasSettings.roomAutoColors) {
            updates.fill = ROOM_TYPE_COLORS[newType] || "#6366f1";
        }
        updateShape({ ...room, ...updates });
    }, [stagedItems, updateShape, canvasSettings.roomAutoColors]);

    const applyRoomTemplate = useCallback((templateId) => {
        const outline = outlines.find(o => o.id === activeFloorId) || outlines[0];
        if (!outline) return;
        try {
            const projection = makeProjection(mapRef.current);
            const result = generateRoomTemplate(templateId, outline);
            const baseId = `room-base-${outline.id}`;
            Object.values(stagedItems).forEach(item => {
                if (item.floor_id === outline.id && item.id !== baseId) removeItem(item.id);
            });
            addItem(baseId, createBaseRoomFromOutline(outline));

            const hasGeo = outline.lat != null && outline.lng != null;
            const outlineCenter = { lat: outline.lat || 0, lng: outline.lng || 0 };
            const outlineWidthMeters = outline.widthMeters || 100;
            const outlineHeightMeters = outline.heightMeters || 100;
            const metersPerDegreeLng = 111320 * Math.cos(outlineCenter.lat * Math.PI / 180);
            const metersPerDegreeLat = 110540;

            const outlineScreen = outlineToScreenBounds(outline, projection);

            result.rooms.forEach((roomData, i) => {
                const roomId = `room-${Date.now()}-${i}`;
                const roomScreenX = outlineScreen.x + roomData.x * outlineScreen.width;
                const roomScreenY = outlineScreen.y + roomData.y * outlineScreen.height;
                const roomScreenW = roomData.width * outlineScreen.width;
                const roomScreenH = roomData.height * outlineScreen.height;

                const roomAttrs = {
                    id: roomId,
                    name: roomData.name,
                    type: "room",
                    roomType: roomData.roomType || "other",
                    floor_id: outline.id,
                    parent_id: baseId,
                    x: roomScreenX,
                    y: roomScreenY,
                    width: roomScreenW,
                    height: roomScreenH,
                    fill: canvasSettings.roomAutoColors ? ROOM_TYPE_COLORS[roomData.roomType] || "#6366f1" : "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 2,
                };

                if (hasGeo) {
                    const roomCenterLng = outlineCenter.lng + ((roomData.x + roomData.width / 2) - 0.5) * outlineWidthMeters / metersPerDegreeLng;
                    const roomCenterLat = outlineCenter.lat + ((roomData.y + roomData.height / 2) - 0.5) * outlineHeightMeters / metersPerDegreeLat;
                    roomAttrs.lat = roomCenterLat;
                    roomAttrs.lng = roomCenterLng;
                    roomAttrs.widthMeters = roomData.width * outlineWidthMeters;
                    roomAttrs.heightMeters = roomData.height * outlineHeightMeters;
                }

                addItem(roomId, roomAttrs);
            });

            result.dividers.forEach((dividerData, i) => {
                const divId = `div-${Date.now()}-${i}`;
                const divAttrs = {
                    id: divId,
                    type: "divider_line",
                    floor_id: outline.id,
                    parent_id: baseId,
                    x1: outlineScreen.x + dividerData.x1 * outlineScreen.width,
                    y1: outlineScreen.y + dividerData.y1 * outlineScreen.height,
                    x2: outlineScreen.x + dividerData.x2 * outlineScreen.width,
                    y2: outlineScreen.y + dividerData.y2 * outlineScreen.height,
                };

                if (hasGeo) {
                    const startLng = outlineCenter.lng + (dividerData.x1 - 0.5) * outlineWidthMeters / metersPerDegreeLng;
                    const startLat = outlineCenter.lat + (dividerData.y1 - 0.5) * outlineHeightMeters / metersPerDegreeLat;
                    const endLng = outlineCenter.lng + (dividerData.x2 - 0.5) * outlineWidthMeters / metersPerDegreeLng;
                    const endLat = outlineCenter.lat + (dividerData.y2 - 0.5) * outlineHeightMeters / metersPerDegreeLat;
                    divAttrs.pointsGeo = [[startLat, startLng], [endLat, endLng]];
                }

                addItem(divId, divAttrs);
            });
        } catch (e) {
            console.error("Template application failed:", e);
        }
    }, [outlines, activeFloorId, stagedItems, addItem, removeItem, canvasSettings.roomAutoColors]);

    const startObjectPlacement = useCallback((item) => {
        if (!hasRooms || !item) return;
        setTool(null);
        setSelectedShapeId(null);
        setSelectedObjectId(null);
        setPendingPlacement({
            active: true,
            kind: "object",
            type: "object",
            item,
        });
    }, [hasRooms]);

    const canCombine = (() => {
        if (stage !== "sections") return false;
        const levelRooms = currentLevelElements.filter(isVisibleSectionRoom);
        const dividers = currentLevelElements.filter(e => e.type === "divider_line");
        return dividers.some(divider => roomsTouchingDivider(divider, levelRooms.filter(room => room.floor_id === divider.floor_id)).length >= 2);
    })();

    const canSelect = (() => {
        if (stage !== "sections") return false;
        return currentLevelElements.some(e => e.type === "divider_line");
    })();

    const addLevel = useCallback(() => {
        const maxLevel = Math.max(0, ...outlines.map(o => o.level || 1));
        const newLevel = maxLevel + 1;
        const level1Outlines = outlines.filter(o => (o.level || 1) === 1);
        const sourceOutlines = level1Outlines.length > 0 ? level1Outlines : outlines;
        const createdAt = Date.now();
        const newOutlines = sourceOutlines.map((outline, index) => ({
            ...outline,
            id: `outline-${createdAt}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            level: newLevel,
            name: `${outline.name || "Outline"} L${newLevel}`,
        }));
        setOutlines(prev => [...prev, ...newOutlines]);
        newOutlines.forEach(outline => {
            const baseRoom = createBaseRoomFromOutline(outline);
            addItem(baseRoom.id, baseRoom);
        });
        setSelectedLevel(newLevel);
        setActiveFloorId(newOutlines[0]?.id || null);
        baseRoomsCreatedRef.current = false;
    }, [outlines, setOutlines, addItem, setSelectedLevel, setActiveFloorId]);

    const clampToFloor = (val, size, floor) => {
        if (!floor) return val;
        return Math.max(floor.x, Math.min(val, floor.x + floor.width - size));
    };

    useEffect(() => {
        if (stage !== "outline" || !mapRef.current || !property) return;
        setOutlines(prev => {
            let converted = false;
            const next = prev.map(shape => {
                if (shape.lat != null && shape.lng != null) return shape;
                const dims = getShapePixelDimensions(shape);
                const geo = screenToGeo(shape.x ?? 300, shape.y ?? 200, dims.width, dims.height);
                if (!geo) return shape;
                converted = true;
                const migrated = {
                    ...shape,
                    lat: geo.lat,
                    lng: geo.lng,
                    widthMeters: shape.widthMeters ?? geo.widthMeters,
                    heightMeters: shape.heightMeters ?? geo.heightMeters,
                };
                if (dims.radius != null) migrated.radiusMeters = shape.radiusMeters ?? dims.radius * geo.metersPerPixel;
                delete migrated.x;
                delete migrated.y;
                delete migrated.width;
                delete migrated.height;
                delete migrated.radius;
                return migrated;
            });
            return converted ? next : prev;
        });
    }, [stage, property, mapVersion, screenToGeo, setOutlines]);

    const selectedShape = selectedShapeId
        ? (stage === "outline"
            ? outlines.find(o => o.id === selectedShapeId) || null
            : stagedItems[selectedShapeId] || null)
        : null;
    const offsetPreviewShape = useMemo(() => {
        if (stage !== "outline" || !showOffset || !selectedShape || multiSelectIds.length > 1) return null;
        return createOffsetOutline(selectedShape, offsetDistance);
    }, [stage, showOffset, selectedShape, multiSelectIds.length, offsetDistance, createOffsetOutline]);

    const handleGridSelect = useCallback(() => {
        setSelectedShapeId(null);
        setSelectedVertexIndex(-1);
    }, []);

    function selectTool(toolName) {
        const el = document.getElementById(`${tool?.type}-tool`);
        if (el?.classList.contains("active")) el.classList.remove("active");
        if (tool?.type === toolName) { setTool(null); return; }
        if (!["clear"].includes(toolName)) {
            const newEl = document.getElementById(`${toolName}-tool`);
            newEl?.classList.add("active");
        }
        setTool(toolSettingsRef.current[toolName]);
        trackEvent("render_tool", { tool: toolName });
    }

    const deleteShape = useCallback(() => {
        if (!selectedShapeId) return;
        if (stage === "outline") {
            setOutlines(prev => prev.filter(s => s.id !== selectedShapeId));
        } else {
            Object.values(stagedItems).forEach(item => {
                if (item.parent_id === selectedShapeId) removeItem(item.id);
            });
            removeItem(selectedShapeId);
        }
        setSelectedShapeId(null);
    }, [selectedShapeId, stagedItems, removeItem, stage, setOutlines]);

    const addObject = useCallback((obj) => {
        setObjects(prev => [...prev, obj]);
    }, [setObjects]);

    const updateObject = useCallback((updated) => {
        setObjects(prev => prev.map(o => o.id === updated.id ? updated : o));
    }, [setObjects]);

    const duplicateShape = useCallback(() => {
        if (!selectedShape) return;
        const id = `shape-${Date.now()}`;
        const dup = { ...selectedShape, id };
        if (stage === "outline" && selectedShape.lat != null) {
            const proj = makeProjection(mapRef.current);
            if (proj) {
                const cur = proj.project(selectedShape.lng, selectedShape.lat);
                const next = proj.unproject(cur.x + 20, cur.y + 20);
                dup.lat = next.lat; dup.lng = next.lng;
            } else {
                dup.lat = (selectedShape.lat || 0) + 0.0001;
                dup.lng = (selectedShape.lng || 0) + 0.0001;
            }
        } else {
            dup.x = (selectedShape.x || 0) + 20;
            dup.y = (selectedShape.y || 0) + 20;
        }
        if (stage === "outline") {
            setOutlines(prev => [...prev, dup]);
        } else {
            addItem(id, dup);
        }
        setSelectedShapeId(id);
    }, [selectedShape, addItem, stage, setOutlines]);

    const addRoomToFloor = useCallback((floorId, roomType) => {
        if (!floorId) return;
        const id = `room-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        const floor = floors.find(f => f.id === floorId) || outlines.find(o => o.id === floorId);
        const x = clampToFloor(80, 120, floor);
        const y = clampToFloor(80, 80, floor);
        addItem(id, {
            id, name: "New Room", type: "room", roomType: roomType || "other",
            floor_id: floorId, x, y, width: 120, height: 80,
            fill: "#6366f1", stroke: "#fff", strokeWidth: 2,
        });
        setSelectedShapeId(id);
    }, [addItem, floors, outlines]);

    const splitRoom = useCallback((roomId, splitMode, linePos) => {
        const room = stagedItems[roomId];
        if (!room || !isSectionRoom(room)) return;
        const now = Date.now();
        const newRooms = [];
        const dividerLines = [];
        const proj = makeProjection(mapRef.current);

        let x, y, width, height;
        if (room.lat != null && room.lng != null && proj) {
            const center = proj.project(room.lng, room.lat);
            const mw = room.widthMeters || (room.width ? proj.pxToMetersX(room.width, room.lng, room.lat) : 100);
            const mh = room.heightMeters || (room.height ? proj.pxToMetersY(room.height, room.lng, room.lat) : 100);
            width = Math.max(10, Math.round(proj.metersToPxX(mw, room.lng, room.lat)));
            height = Math.max(10, Math.round(proj.metersToPxY(mh, room.lng, room.lat)));
            x = Math.round(center.x - width / 2);
            y = Math.round(center.y - height / 2);
        } else {
            x = room.x ?? 0;
            y = room.y ?? 0;
            width = room.width || 100;
            height = room.height || 100;
        }
        const { floor_id, roomType, fill } = room;
        const hasGeo = room.lat != null && room.lng != null;

        const snapSize = Math.max(1, Number(canvasSettings.gridPixelSize) || 1);
        const snap = value => canvasSettings.gridSnap ? Math.round(value / snapSize) * snapSize : value;
        const splitX = clampSplit(
            snap(typeof linePos === "object" && linePos?.x != null ? linePos.x : x + Math.round(width / 2)),
            x + 10, x + width - 10
        );
        const splitY = clampSplit(
            snap(typeof linePos === "object" && linePos?.y != null ? linePos.y : (typeof linePos === "number" ? linePos : y + Math.round(height / 2))),
            y + 10, y + height - 10
        );

        const makeRoom = (suffix, attrs) => {
            const r = {
                id: `room-${now}${suffix}`,
                name: "Divided Room",
                type: "room", sectionRole: "split", roomType, floor_id, fill,
                stroke: "#fff", strokeWidth: 2,
                ...attrs,
            };
            if (hasGeo && proj) {
                const rw = attrs.width || width;
                const rh = attrs.height || height;
                const rx = attrs.x ?? x;
                const ry = attrs.y ?? y;
                const centerPt = proj.unproject(rx + rw / 2, ry + rh / 2);
                r.lat = centerPt.lat;
                r.lng = centerPt.lng;
                r.widthMeters = room.widthMeters ? room.widthMeters * (rw / width) : Math.abs(proj.pxToMetersX(rw, room.lng, room.lat));
                r.heightMeters = room.heightMeters ? room.heightMeters * (rh / height) : Math.abs(proj.pxToMetersY(rh, room.lng, room.lat));
            }
            return r;
        };

        const makeDivider = (suffix, line) => ({
            id: `div-${now}${suffix}`,
            type: "divider_line",
            floor_id,
            parent_id: roomId,
            ...line,
            ...(hasGeo ? geoForDividerLine(proj, line) : {}),
        });

        if (splitMode === "both") {
            const leftW = Math.max(10, splitX - x);
            const rightW = Math.max(10, x + width - splitX);
            const topH = Math.max(10, splitY - y);
            const botH = Math.max(10, y + height - splitY);
            newRooms.push(
                makeRoom("tl", { x, y, width: leftW, height: topH }),
                makeRoom("tr", { x: splitX, y, width: rightW, height: topH }),
                makeRoom("bl", { x, y: splitY, width: leftW, height: botH }),
                makeRoom("br", { x: splitX, y: splitY, width: rightW, height: botH }),
            );
            dividerLines.push(
                makeDivider("h", { x1: x, y1: splitY, x2: x + width, y2: splitY }),
                makeDivider("v", { x1: splitX, y1: y, x2: splitX, y2: y + height }),
            );
        } else if (splitMode === "horizontal") {
            const topH = Math.max(10, splitY - y);
            const botH = Math.max(10, y + height - splitY);
            newRooms.push(
                makeRoom("t", { x, y, width, height: topH }),
                makeRoom("b", { x, y: splitY, width, height: botH }),
            );
            dividerLines.push(makeDivider("h", { x1: x, y1: splitY, x2: x + width, y2: splitY }));
        } else if (splitMode === "vertical") {
            const leftW = Math.max(10, splitX - x);
            const rightW = Math.max(10, x + width - splitX);
            newRooms.push(
                makeRoom("l", { x, y, width: leftW, height }),
                makeRoom("r", { x: splitX, y, width: rightW, height }),
            );
            dividerLines.push(makeDivider("v", { x1: splitX, y1: y, x2: splitX, y2: y + height }));
        }

        Object.values(stagedItems).forEach(el => {
            if (el.parent_id === roomId) removeItem(el.id);
        });
        removeItem(roomId);
        newRooms.forEach(r => addItem(r.id, r));
        dividerLines.forEach(d => addItem(d.id, d));
        if (newRooms.length > 0) setSelectedShapeId(newRooms[0].id);
        setTool({ type: "select" });
    }, [stagedItems, removeItem, addItem, canvasSettings.gridSnap, canvasSettings.gridPixelSize]);

    const combineByDivider = useCallback((dividerId, options = {}) => {
        const sourceDiv = stagedItems[dividerId];
        if (!sourceDiv || sourceDiv.type !== "divider_line") return;
        const floor_id = sourceDiv.floor_id;
        const proj = makeProjection(mapRef.current);
        const div = options.divider || screenDivider(sourceDiv, proj);
        const point = options.point || {
            x: ((div.x1 ?? 0) + (div.x2 ?? 0)) / 2,
            y: ((div.y1 ?? 0) + (div.y2 ?? 0)) / 2,
        };
        const rooms = Object.values(stagedItems)
            .filter(r => isVisibleSectionRoom(r) && r.floor_id === floor_id)
            .map(room => screenRoom(room, proj));
        const dividers = Object.values(stagedItems)
            .filter(d => d.type === "divider_line" && d.floor_id === floor_id)
            .map(d => d.id === dividerId ? div : screenDivider(d, proj));
        const crossing = crossingDividerAtPoint(div, dividers, point);
        const roomsToMerge = crossing
            ? roomsForCrossMerge(crossing.point, rooms)
            : roomsForSingleDividerMerge(div, rooms, point);
        if (roomsToMerge.length < 2) return;
        const minX = Math.min(...roomsToMerge.map(r => r.x));
        const minY = Math.min(...roomsToMerge.map(r => r.y));
        const maxX = Math.max(...roomsToMerge.map(r => r.x + r.width));
        const maxY = Math.max(...roomsToMerge.map(r => r.y + r.height));
        const geoAttrs = geoForScreenRect(proj, minX, minY, maxX - minX, maxY - minY);
        roomsToMerge.forEach(r => {
            Object.values(stagedItems).forEach(el => {
                if (el.parent_id === r.id) removeItem(el.id);
            });
            removeItem(r.id);
        });
        if (crossing) removeItem(crossing.divider.id);
        removeItem(dividerId);
        const merged = {
            id: `room-${Date.now()}`, name: "Combined Room", type: "room", sectionRole: "combined",
            roomType: roomsToMerge[0].roomType, floor_id,
            x: minX, y: minY, width: maxX - minX, height: maxY - minY,
            fill: roomsToMerge[0].fill, stroke: "#fff", strokeWidth: 2,
            ...geoAttrs,
        };
        addItem(merged.id, merged);
        setSelectedShapeId(merged.id);
    }, [stagedItems, removeItem, addItem]);

    const moveDividerLine = useCallback((dividerId, newAttrs) => {
        const proj = makeProjection(mapRef.current);
        const sourceDiv = stagedItems[dividerId];
        if (!sourceDiv || sourceDiv.type !== "divider_line") return;
        const sourceScreenDiv = screenDivider(sourceDiv, proj);
        const updated = { ...sourceDiv, ...newAttrs };
        if (proj && updated.x1 != null && updated.y1 != null && updated.x2 != null && updated.y2 != null) {
            Object.assign(updated, geoForDividerLine(proj, updated));
        }

        const axis = getDividerAxis(updated);
        const floorRooms = Object.values(stagedItems).filter(
            room => isVisibleSectionRoom(room) && room.floor_id === sourceDiv.floor_id
        ).map(room => screenRoom(room, proj));
        const affectedRooms = roomsTouchingDivider(sourceScreenDiv, floorRooms);
        const roomUpdates = {};

        if (affectedRooms.length >= 2 && axis !== "free") {
            if (axis === "horizontal") {
                const splitY = clampSplit(((updated.y1 ?? 0) + (updated.y2 ?? 0)) / 2, 
                    Math.min(...affectedRooms.map(room => room.y)) + 10, 
                    Math.max(...affectedRooms.map(room => room.y + room.height)) - 10);
                affectedRooms.forEach(room => {
                    const centerY = room.y + room.height / 2;
                    const next = centerY <= splitY
                        ? { ...room, height: Math.max(10, splitY - room.y) }
                        : { ...room, y: splitY, height: Math.max(10, room.y + room.height - splitY) };
                    if (room.lat != null && room.lng != null && proj) {
                        const rw = next.width || room.width;
                        const rh = next.height || room.height;
                        const centerPt = proj.unproject(next.x + rw / 2, next.y + rh / 2);
                        next.lat = centerPt.lat;
                        next.lng = centerPt.lng;
                        next.widthMeters = room.widthMeters ? room.widthMeters * (rw / room.width) : Math.abs(proj.pxToMetersX(rw, room.lng, room.lat));
                        next.heightMeters = room.heightMeters ? room.heightMeters * (rh / room.height) : Math.abs(proj.pxToMetersY(rh, room.lng, room.lat));
                    }
                    roomUpdates[next.id] = next;
                });
            } else if (axis === "vertical") {
                const splitX = clampSplit(((updated.x1 ?? 0) + (updated.x2 ?? 0)) / 2, 
                    Math.min(...affectedRooms.map(room => room.x)) + 10, 
                    Math.max(...affectedRooms.map(room => room.x + room.width)) - 10);
                affectedRooms.forEach(room => {
                    const centerX = room.x + room.width / 2;
                    const next = centerX <= splitX
                        ? { ...room, width: Math.max(10, splitX - room.x) }
                        : { ...room, x: splitX, width: Math.max(10, room.x + room.width - splitX) };
                    if (room.lat != null && room.lng != null && proj) {
                        const rw = next.width || room.width;
                        const rh = next.height || room.height;
                        const centerPt = proj.unproject(next.x + rw / 2, next.y + rh / 2);
                        next.lat = centerPt.lat;
                        next.lng = centerPt.lng;
                        next.widthMeters = room.widthMeters ? room.widthMeters * (rw / room.width) : Math.abs(proj.pxToMetersX(rw, room.lng, room.lat));
                        next.heightMeters = room.heightMeters ? room.heightMeters * (rh / room.height) : Math.abs(proj.pxToMetersY(rh, room.lng, room.lat));
                    }
                    roomUpdates[next.id] = next;
                });
            }
        }

        setStagedItems(prev => ({ ...prev, [dividerId]: updated, ...roomUpdates }));
    }, [stagedItems, setStagedItems]);

    const addWallPad = useCallback((wallType, floorId, parentId, point, room) => {
        if (!floorId || !room) return;
        const id = `wall-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        const wall = makeWallPadItem({ id, wallType, floorId, parentId, point, room, settings: canvasSettings });
        if (!wall) return;
        addItem(id, wall);
        setSelectedShapeId(id);
    }, [addItem, canvasSettings]);

    const addOpening = useCallback((openingType, floorId, parentId, point, room) => {
        if (!floorId || !room || !point) return;
        const id = `opening-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        const opening = makeOpeningItem({ id, openingType, floorId, parentId, point, room, settings: canvasSettings });
        if (!opening) return;
        addItem(id, opening);
        setSelectedShapeId(id);
    }, [addItem, canvasSettings]);

    return loaded ? (
        <div id="render-page">
            <header id="editor-top">
                <div className="header-nav-left">
                    <button className="header-btn" onClick={() => navigate('/editor')}>Map</button>
                    <button className="header-btn save-btn" onClick={wrappedSaveAll} disabled={saving}>Save All</button>
                </div>
                <div className="header-nav-center">
                    <div className="render-top-title">{property?.name || "Render"} — Floor Plan</div>
                </div>
                <div className="header-nav-right">
                    <button className="header-btn" onClick={stageUndo} disabled={!canUndo}>Undo</button>
                    <button className="header-btn" onClick={stageRedo} disabled={!canRedo}>Redo</button>
                    <button className="header-btn" onClick={() => navigate('/dashboard')}>Exit</button>
                </div>
            </header>
            <div id="render-main">
                <AssetsPanel
                    stage={stage}
                    addShape={addShape}
                    canvasSettings={canvasSettings}
                    setCanvasSettings={setCanvasSettings}
                    hasFloors={hasFloors}
                    addRoomToFloor={addRoomToFloor}
                    activeFloorId={activeFloorId}
                    mapDistance={mapDistance}
                    setMapDistance={setMapDistance}
                    setPendingPlacement={setPendingPlacement}
                    activeTool={tool}
                    onSelectTool={selectTool}
                    canCombine={canCombine}
                    canSelect={canSelect}
                    addLevel={addLevel}
                    onSelectCatalogItem={startObjectPlacement}
                    selectedCount={selectedCount}
                    onBooleanOp={onBooleanOp}
                    outlines={outlines}
                    onLoadTemplate={(template) => {
                        if (template.outlines) {
                            template.outlines.forEach((shapeData, i) => {
                                setTimeout(() => addShape({ ...shapeData }), i * 50);
                            });
                        }
                    }}
                    onLoadBuiltin={(templateId) => {
                        try {
                            const template = generateTemplate(templateId);
                            setTool(null);
                            setSelectedShapeId(null);
                            setMultiSelectIds([]);
                            setPendingPlacement({
                                type: "template",
                                templateId,
                                template,
                                active: true,
                            });
                        } catch (e) {
                            console.error("Builtin template load failed:", e);
                        }
                    }}
                    onImport={(importedOutlines) => {
                        importedOutlines.forEach((shapeData, i) => {
                            setTimeout(() => addShape({ ...shapeData }), i * 50);
                        });
                    }}
                    onBatchMerge={batchMerge}
                    onBatchDelete={batchDelete}
                    onBatchChangeType={batchChangeType}
                    onBatchFullWall={batchFullWall}
                    multiSelectIds={multiSelectIds}
                    onApplyTemplate={applyRoomTemplate}
                    selectedShape={selectedShape}
                    onUpdateShape={updateShape}
                />
                <PropertiesPanel
                    stage={stage}
                    selectedShape={selectedShape}
                    updateShape={updateShape}
                    floors={visibleFloors}
                    elements={stage === "objects" ? currentLevelElements : stage === "sections" ? allElements : outlines}
                    activeFloorId={activeFloorId}
                    selectedLevel={selectedLevel}
                    onSelectLevel={setSelectedLevel}
                    onSelectFloor={setActiveFloorId}
                    onSelectShape={handleCanvasSelect}
                    addFloor={addFloor}
                    addRoomToFloor={addRoomToFloor}
                    outlines={outlines}
                    addLevel={addLevel}
                    objects={objects}
                    selectedObjectId={selectedObjectId}
                    onSelectObject={setSelectedObjectId}
                    onUpdateObject={updateObject}
                    vertexMode={vertexMode}
                    selectedVertexIndex={selectedVertexIndex}
                    onSelectVertex={setSelectedVertexIndex}
                    multiSelectIds={multiSelectIds}
                    validationResults={validationResults}
                    showMeasurements={canvasSettings.showMeasurements}
                    unit={canvasSettings.unit}
                    sectionWarnings={sectionWarnings}
                    liveMeasurements={selectedShape ? {
                        area: getOutlineArea(selectedShape),
                        perimeter: getOutlinePerimeter(selectedShape),
                    } : null}
                    updateRoomType={updateRoomType}
                    mapRef={mapRef}
                    deleteElement={(id) => {
                        const item = stage === "outline"
                            ? outlines.find(o => o.id === id)
                            : stagedItems[id];
                        if (item?.type === "room") {
                            Object.values(stagedItems).forEach(el => {
                                if (el.parent_id === id || (el.type === "divider_line" && el.floor_id === item.floor_id)) {
                                    removeItem(el.id);
                                }
                            });
                        }
                        if (item?.type === "divider_line") {
                            const div = item;
                            const siblingDivs = Object.values(stagedItems).filter(
                                d => d.type === "divider_line" && d.floor_id === div.floor_id && d.id !== id
                            );
                            if (siblingDivs.length === 0) {
                                const rooms = Object.values(stagedItems).filter(
                                    r => isVisibleSectionRoom(r) && r.floor_id === div.floor_id
                                );
                                if (rooms.length >= 2) {
                                    const minX = Math.min(...rooms.map(r => r.x));
                                    const minY = Math.min(...rooms.map(r => r.y));
                                    const maxX = Math.max(...rooms.map(r => r.x + r.width));
                                    const maxY = Math.max(...rooms.map(r => r.y + r.height));
                                    const proj = makeProjection(mapRef.current);
                                    const geoAttrs = geoForScreenRect(proj, minX, minY, maxX - minX, maxY - minY);
                                    rooms.forEach(r => removeItem(r.id));
                                    const merged = {
                                        id: `room-${Date.now()}`, name: "Combined Room", type: "room", sectionRole: "combined",
                                        roomType: rooms[0].roomType, floor_id: div.floor_id,
                                        x: minX, y: minY, width: maxX - minX, height: maxY - minY,
                                        fill: rooms[0].fill, stroke: "#fff", strokeWidth: 2,
                                        ...geoAttrs,
                                    };
                                    addItem(merged.id, merged);
                                }
                            }
                        }
                        if (item?.type === "floor") {
                            Object.values(stagedItems).forEach(el => {
                                if (el.floor_id === id) removeItem(el.id);
                            });
                        }
                        if (item?.type === "object") {
                            deleteObject(id);
                            return;
                        }
                        if (stage === "outline") {
                            setOutlines(prev => prev.filter(o => o.id !== id));
                        } else {
                            removeItem(id);
                        }
                    }}
                    moveElement={(id, toFloorId) => {
                        const el = stage === "outline"
                            ? outlines.find(o => o.id === id)
                            : stagedItems[id];
                        if (el) updateShape({ ...el, floor_id: toFloorId });
                    }}
                />
                <Toolbar
                    selectedShape={selectedShape}
                    updateShape={updateShape}
                    deleteShape={deleteShape}
                    duplicateShape={duplicateShape}
                    showOffset={showOffset}
                    onToggleOffset={onShowOffset}
                    onOffset={handleOffset}
                    offsetDistance={offsetDistance}
                    onOffsetDistanceChange={setOffsetDistance}
                    vertexMode={vertexMode}
                    selectedVertexIndex={selectedVertexIndex}
                    onToggleVertexMode={handleToggleVertexMode}
                    onAddVertex={handleAddVertex}
                    onRemoveVertex={handleRemoveVertex}
                    onChamfer={handleChamfer}
                    onFillet={handleFillet}
                    multiSelectIds={multiSelectIds}
                    onBooleanOp={handleBooleanOp}
                />
                <div className="top-bars">
                    <StageBar stage={stage} setStage={setStage} hasOutlines={outlines.length > 0} hasRooms={hasRooms} />
                    <MapToggle value={mapLayer} onChange={setMapLayer} />
                </div>
                <div id="render-screen">
                    {property && (
                        <RenderMapBackground
                            visible={mapLayer !== "off" && (stage === "outline" || stage === "sections" || stage === "objects")}
                            layer={mapLayer}
                            lng={property.lng}
                            lat={property.lat}
                            distance={mapDistance}
                            mapRef={mapRef}
                            onViewChange={onMapViewChange}
                            panLimitMeters={canvasSettings?.mapPanLimit ?? 500}
                        />
                    )}
                    {hasFloors && stage === "outline" && (
                    <div className="render-toolbar">
                        <span className="render-tools">
                            <button id="handle-tool" onClick={() => selectTool("handle")}>Handle</button>
                            <button id="line-tool" onClick={() => selectTool("line")}>Line</button>
                            <button id="text-tool" onClick={() => selectTool("text")}>Text</button>
                            <button id="eraser-tool" onClick={() => selectTool("eraser")}>Eraser</button>
                            <button id="clear-tool" onClick={() => selectTool("clear")}>Clear</button>
                        </span>
                    </div>
                    )}
                    <RenderComponent
                        activeTool={tool}
                        floors={visibleFloors}
                        elements={visibleElements}
                        selectedShapeId={selectedShapeId}
                        hasFloors={hasFloors}
                        stage={stage}
                        onSelectShape={handleCanvasSelect}
                        onUpdateShape={updateShape}
                        canvasSettings={canvasSettings}
                        onGridSelect={handleGridSelect}
                        activeFloorId={activeFloorId}
                        mapVisible={mapLayer !== "off"}
                        mapRef={mapRef}
                        mapVersion={mapVersion}
                        toolActive={!!tool || !!pendingPlacement}
                        pendingPlacement={pendingPlacement}
                        setPendingPlacement={setPendingPlacement}
                        multiSelectIds={multiSelectIds}
                        vertexMode={vertexMode}
                        selectedVertexIndex={selectedVertexIndex}
                        onSelectVertex={setSelectedVertexIndex}
                        onMoveVertex={handleMoveVertex}
                        offsetPreviewShape={offsetPreviewShape}
                        onPlaceShape={addShape}
                        onPlaceTemplate={(templateId, point) => addShape(createTemplateShapeData(templateId, point))}
                        onSplitRoom={splitRoom}
                        onCombineByDivider={combineByDivider}
                        onMoveDividerLine={moveDividerLine}
                        onAddWallPad={addWallPad}
                        onAddOpening={addOpening}
                        onSelectFloor={setActiveFloorId}
                        objectsData={objects}
                        selectedObjectId={selectedObjectId}
                        onSelectObject={setSelectedObjectId}
                        onUpdateObject={updateObject}
                        onAddObject={addObject}
                        onCompletePolygon={(pts) => {
                            const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
                            const minX = Math.min(...xs), minY = Math.min(...ys);
                            const w = Math.max(...xs) - minX, h = Math.max(...ys) - minY;
                            const norm = pts.map(p => [p[0] - minX, p[1] - minY]);
                            addShape({
                                type: "polygon", x: minX, y: minY, width: w, height: h,
                                points: norm, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2,
                            });
                            setPendingPlacement(null);
                        }}
                    />
                </div>
            </div>
        </div>
    ) : <p>Loading...</p>;
}
