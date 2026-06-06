import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { Stage, Layer, Rect, Line, Circle, Text, Transformer, Group } from "react-konva";
import { makeProjection, groundDistanceMeters } from "../../../functions/geoProject";
import ThreeCanvas from "./ThreeCanvas";
import "./RenderComponent.css";

function polygonPoints(sides, radius, cx = 0, cy = 0) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        pts.push(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    return pts;
}

function getShapeRenderType(shape) {
    return shape?.outlineType || shape?.shapeType || shape?.type;
}

function getShapeRenderSize(shape) {
    const shapeType = getShapeRenderType(shape);
    const isCustomPoly = shapeType === "polygon" && Array.isArray(shape._points || shape.points) && (shape._points || shape.points).length >= 3;
    const isRegPoly = !isCustomPoly && shape.sides && shape.sides >= 3;
    const isCircle = shapeType === "circle";
    const radius = shape.radius || 50;

    return {
        width: isCustomPoly ? (shape.width || 100) : (isRegPoly || isCircle ? radius * 2 : (shape.width || 120)),
        height: isCustomPoly ? (shape.height || 100) : (isRegPoly || isCircle ? radius * 2 : (shape.height || 80)),
    };
}

function drawShapePath(ctx, shape, absolute = false) {
    if (!shape) return;
    const shapeType = getShapeRenderType(shape);
    const isCustomPoly = shapeType === "polygon" && Array.isArray(shape._points || shape.points) && (shape._points || shape.points).length >= 3;
    const isRegPoly = !isCustomPoly && shape.sides && shape.sides >= 3;
    const isCircle = shapeType === "circle";
    const { width, height } = getShapeRenderSize(shape);
    const ox = absolute ? (shape.x || 0) : 0;
    const oy = absolute ? (shape.y || 0) : 0;
    const rotation = absolute ? ((shape.rotation || 0) * Math.PI) / 180 : 0;

    const draw = () => {
        if (isCustomPoly) {
            const pts = shape._points || shape.points;
            ctx.moveTo(ox + pts[0][0], oy + pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(ox + pts[i][0], oy + pts[i][1]);
            }
            ctx.closePath();
        } else if (isRegPoly) {
            const r = shape.radius || Math.min(width, height) / 2 || 50;
            const pts = polygonPoints(shape.sides, r, ox + r, oy + r);
            ctx.moveTo(pts[0], pts[1]);
            for (let i = 2; i < pts.length; i += 2) {
                ctx.lineTo(pts[i], pts[i + 1]);
            }
            ctx.closePath();
        } else if (isCircle) {
            const r = shape.radius || Math.min(width, height) / 2 || 50;
            ctx.arc(ox + r, oy + r, r, 0, Math.PI * 2);
        } else {
            ctx.rect(ox, oy, width, height);
        }
    };

    if (rotation) {
        ctx.save();
        ctx.translate(ox + width / 2, oy + height / 2);
        ctx.rotate(rotation);
        ctx.translate(-(ox + width / 2), -(oy + height / 2));
        ctx.beginPath();
        draw();
        ctx.restore();
    } else {
        ctx.beginPath();
        draw();
    }
}

function removeProjectedFields(shape) {
    if (!shape?._isProjected) return shape;
    const { x, y, width, height, radius, _points, _isProjected, _sourceGeometry, ...source } = shape;
    if (_sourceGeometry?.x !== undefined) source.x = _sourceGeometry.x;
    if (_sourceGeometry?.y !== undefined) source.y = _sourceGeometry.y;
    if (_sourceGeometry?.width !== undefined && source.widthMeters == null) source.width = _sourceGeometry.width;
    if (_sourceGeometry?.height !== undefined && source.heightMeters == null) source.height = _sourceGeometry.height;
    if (_sourceGeometry?.radius !== undefined && source.radiusMeters == null) source.radius = _sourceGeometry.radius;
    return source;
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

function getPointBounds(points) {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}

function normalizeScreenPoints(points) {
    const bounds = getPointBounds(points);
    return {
        points: points.map(([px, py]) => [px - bounds.minX, py - bounds.minY]),
        width: Math.max(bounds.maxX - bounds.minX, 1),
        height: Math.max(bounds.maxY - bounds.minY, 1),
    };
}

function withMetricDimensions(shape, projection, cache) {
    const cached = cache[shape.id] || {};
    const shapeType = getShapeRenderType(shape);
    const widthMeters = shape.widthMeters ?? cached.widthMeters ?? projection.pxToMetersX(shape.width || 120, shape.lng, shape.lat);
    const heightMeters = shape.heightMeters ?? cached.heightMeters ?? projection.pxToMetersY(shape.height || 80, shape.lng, shape.lat);
    const radiusPx = shape.radius ?? Math.min(shape.width || 100, shape.height || 100) / 2;
    const radiusMeters = shape.radiusMeters
        ?? cached.radiusMeters
        ?? (shape.radius != null || shape.sides || shapeType === "circle" ? Math.min(
            projection.pxToMetersX(radiusPx, shape.lng, shape.lat),
            projection.pxToMetersY(radiusPx, shape.lng, shape.lat)
        ) : null);

    cache[shape.id] = {
        ...cached,
        widthMeters,
        heightMeters,
        ...(radiusMeters != null ? { radiusMeters } : {}),
    };

    return { widthMeters, heightMeters, radiusMeters };
}

function projectMetricBox(projection, lng, lat, widthMeters, heightMeters) {
    const center = projection.project(lng, lat);
    const width = Math.max(projection.metersToPxX(widthMeters, lng, lat), 1);
    const height = Math.max(projection.metersToPxY(heightMeters, lng, lat), 1);

    return {
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
    };
}

function measureScreenBox(projection, x, y, width, height) {
    const center = projection.unproject(x + width / 2, y + height / 2);
    const left = projection.unproject(x, y + height / 2);
    const right = projection.unproject(x + width, y + height / 2);
    const top = projection.unproject(x + width / 2, y);
    const bottom = projection.unproject(x + width / 2, y + height);

    return {
        center,
        widthMeters: groundDistanceMeters(left.lng, left.lat, right.lng, right.lat),
        heightMeters: groundDistanceMeters(top.lng, top.lat, bottom.lng, bottom.lat),
    };
}

function dividerOrientation(divider) {
    if (!divider) return "free";
    const dx = Math.abs((divider.x2 ?? 0) - (divider.x1 ?? 0));
    const dy = Math.abs((divider.y2 ?? 0) - (divider.y1 ?? 0));
    if (dx > dy * 1.5) return "horizontal";
    if (dy > dx * 1.5) return "vertical";
    return "free";
}

function lineSegmentsIntersect(a, b) {
    const det = (a.x2 - a.x1) * (b.y2 - b.y1) - (a.y2 - a.y1) * (b.x2 - b.x1);
    if (Math.abs(det) < 0.0001) return false;
    const t = ((b.x1 - a.x1) * (b.y2 - b.y1) - (b.y1 - a.y1) * (b.x2 - b.x1)) / det;
    const u = ((b.x1 - a.x1) * (a.y2 - a.y1) - (b.y1 - a.y1) * (a.x2 - a.x1)) / det;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
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

function dividerHasCrossing(divider, dividers) {
    return dividers.some(other => other.id !== divider.id && lineSegmentsIntersect(divider, other));
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
    return edges.some(edge => lineSegmentsIntersect(line, edge));
}

function roomsTouchingDivider(divider, rooms) {
    return rooms.filter(room => lineIntersectsRoom(divider, room));
}

function roomContainsPoint(room, point, tolerance = 2) {
    return point.x >= room.x - tolerance
        && point.x <= room.x + room.width + tolerance
        && point.y >= room.y - tolerance
        && point.y <= room.y + room.height + tolerance;
}

function crossingDividerAtPoint(divider, dividers, point, threshold = 14) {
    if (!point) return null;
    const axis = dividerOrientation(divider);
    if (axis === "free") return null;
    for (const other of dividers) {
        if (other.id === divider.id || dividerOrientation(other) === axis) continue;
        const intersection = lineIntersectionPoint(divider, other);
        if (intersection && pointDistance(point, intersection) <= threshold) {
            return { divider: other, point: intersection };
        }
    }
    return null;
}

function roomsAcrossDividerSegment(divider, rooms, point, tolerance = 4) {
    const axis = dividerOrientation(divider);
    if (axis === "horizontal") {
        const splitY = ((divider.y1 ?? 0) + (divider.y2 ?? 0)) / 2;
        const x = point?.x ?? (((divider.x1 ?? 0) + (divider.x2 ?? 0)) / 2);
        const candidates = rooms.filter(room => x >= room.x - tolerance && x <= room.x + room.width + tolerance);
        const above = candidates
            .filter(room => Math.abs((room.y + room.height) - splitY) <= tolerance)
            .sort((a, b) => (b.y + b.height) - (a.y + a.height))[0];
        const below = candidates
            .filter(room => Math.abs(room.y - splitY) <= tolerance)
            .sort((a, b) => a.y - b.y)[0];
        return [above, below].filter(Boolean);
    }

    if (axis === "vertical") {
        const splitX = ((divider.x1 ?? 0) + (divider.x2 ?? 0)) / 2;
        const y = point?.y ?? (((divider.y1 ?? 0) + (divider.y2 ?? 0)) / 2);
        const candidates = rooms.filter(room => y >= room.y - tolerance && y <= room.y + room.height + tolerance);
        const left = candidates
            .filter(room => Math.abs((room.x + room.width) - splitX) <= tolerance)
            .sort((a, b) => (b.x + b.width) - (a.x + a.width))[0];
        const right = candidates
            .filter(room => Math.abs(room.x - splitX) <= tolerance)
            .sort((a, b) => a.x - b.x)[0];
        return [left, right].filter(Boolean);
    }

    return [];
}

function combinePreviewForDivider(divider, dividers, rooms, point) {
    const crossing = crossingDividerAtPoint(divider, dividers, point);
    if (crossing) {
        return {
            mode: "both",
            rooms: rooms.filter(room => roomContainsPoint(room, crossing.point, 2)),
            crossing,
        };
    }

    const axis = dividerOrientation(divider);
    const touching = roomsTouchingDivider(divider, rooms);
    if (touching.length < 2) return { mode: axis, rooms: [] };

    if (axis === "horizontal") {
        const splitY = ((divider.y1 ?? 0) + (divider.y2 ?? 0)) / 2;
        const clickY = point?.y ?? splitY;
        const above = touching.filter(room => room.y + room.height / 2 <= splitY);
        const below = touching.filter(room => room.y + room.height / 2 > splitY);
        if (clickY <= splitY) {
            return { mode: "horizontal", rooms: above.length > 0 ? above : touching.slice(0, 2) };
        } else {
            return { mode: "horizontal", rooms: below.length > 0 ? below : touching.slice(0, 2) };
        }
    }

    if (axis === "vertical") {
        const splitX = ((divider.x1 ?? 0) + (divider.x2 ?? 0)) / 2;
        const clickX = point?.x ?? splitX;
        const left = touching.filter(room => room.x + room.width / 2 <= splitX);
        const right = touching.filter(room => room.x + room.width / 2 > splitX);
        if (clickX <= splitX) {
            return { mode: "vertical", rooms: left.length > 0 ? left : touching.slice(0, 2) };
        } else {
            return { mode: "vertical", rooms: right.length > 0 ? right : touching.slice(0, 2) };
        }
    }

    return { mode: axis, rooms: touching.slice(0, 2) };
}

function getDividerPlan(room, pt) {
    if (!room || !pt) return null;
    const centerX = room.x + room.width / 2;
    const centerY = room.y + room.height / 2;
    const splitX = Math.max(room.x + 10, Math.min(pt.x, room.x + room.width - 10));
    const splitY = Math.max(room.y + 10, Math.min(pt.y, room.y + room.height - 10));
    const relX = Math.abs((pt.x - centerX) / room.width);
    const relY = Math.abs((pt.y - centerY) / room.height);
    const nearX = relX <= 0.18;
    const nearY = relY <= 0.18;
    const edgeX = Math.min(pt.x - room.x, room.x + room.width - pt.x) / room.width;
    const edgeY = Math.min(pt.y - room.y, room.y + room.height - pt.y) / room.height;
    const mode = nearX && nearY ? "both"
        : nearX ? "vertical"
        : nearY ? "horizontal"
        : edgeY < edgeX ? "vertical"
        : "horizontal";
    const lines = [];
    if (mode === "horizontal" || mode === "both") {
        lines.push({ x1: room.x, y1: splitY, x2: room.x + room.width, y2: splitY });
    }
    if (mode === "vertical" || mode === "both") {
        lines.push({ x1: splitX, y1: room.y, x2: splitX, y2: room.y + room.height });
    }
    return { mode, splitX, splitY, lines };
}

const DEFAULT_WALL_PADDING = 8;
const DEFAULT_DOOR_WIDTH = 34;
const DEFAULT_WINDOW_WIDTH = 46;

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
    const distTop = Math.abs(clickY - room.y);
    const distBottom = Math.abs(clickY - (room.y + room.height));
    const distLeft = Math.abs(clickX - room.x);
    const distRight = Math.abs(clickX - (room.x + room.width));
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

function fullWallRects(wall) {
    const thickness = Math.max(1, Math.min(wall.wallThickness || DEFAULT_WALL_PADDING, wall.width / 2, wall.height / 2));
    const innerHeight = Math.max(0, wall.height - thickness * 2);
    return [
        { key: "top", x: wall.x, y: wall.y, width: wall.width, height: thickness },
        { key: "bottom", x: wall.x, y: wall.y + wall.height - thickness, width: wall.width, height: thickness },
        { key: "left", x: wall.x, y: wall.y + thickness, width: thickness, height: innerHeight },
        { key: "right", x: wall.x + wall.width - thickness, y: wall.y + thickness, width: thickness, height: innerHeight },
    ].filter(rect => rect.width > 0 && rect.height > 0);
}

function wallToolPreview(toolType, room, pt, settings = {}) {
    if (!room || !toolType) return null;
    const thickness = wallPaddingFromSettings(settings);
    if (toolType === "wall_square") {
        return {
            type: "wall_square",
            valid: true,
            room,
            wall: { ...room, wallThickness: thickness, fill: "rgba(82, 82, 91, 0.55)", stroke: "#22c55e" },
        };
    }
    const edge = pt ? detectRoomEdge(pt.x, pt.y, room, Math.max(15, thickness * 2)) : null;
    if (!edge) return { type: toolType, valid: false, room };
    if (toolType === "wall_line") {
        return {
            type: toolType,
            valid: true,
            room,
            rect: wallSideRect(room, edge, thickness),
        };
    }
    const openingLength = openingWidthFromSettings(settings, toolType);
    const openingThickness = Math.max(4, thickness + 2);
    const margin = 4;
    let rect;
    if (edge === "top" || edge === "bottom") {
        const width = Math.max(8, Math.min(openingLength, room.width - margin * 2));
        const x = Math.max(room.x + margin, Math.min(pt.x - width / 2, room.x + room.width - width - margin));
        rect = { x, y: edge === "top" ? room.y : room.y + room.height - openingThickness, width, height: openingThickness };
    } else {
        const height = Math.max(8, Math.min(openingLength, room.height - margin * 2));
        const y = Math.max(room.y + margin, Math.min(pt.y - height / 2, room.y + room.height - height - margin));
        rect = { x: edge === "left" ? room.x : room.x + room.width - openingThickness, y, width: openingThickness, height };
    }
    return { type: toolType, valid: true, room, rect };
}

const LEGACY_OBJECT_PX_TO_METERS = 0.01;

function getObjectMetricSize(source = {}) {
    return {
        widthMeters: Number(source.widthMeters ?? (source.width != null ? source.width * LEGACY_OBJECT_PX_TO_METERS : 1)),
        heightMeters: Number(source.heightMeters ?? (source.height != null ? source.height * LEGACY_OBJECT_PX_TO_METERS : 1)),
        heightMeters3d: Number(source.heightMeters3d ?? (source.height3d != null ? source.height3d * LEGACY_OBJECT_PX_TO_METERS : 0.6)),
    };
}

function objectScreenSize(source, projection, point) {
    const metrics = getObjectMetricSize(source);
    if (projection && point) {
        const geo = point.lng != null && point.lat != null ? point : projection.unproject(point.x, point.y);
        const width = Math.max(projection.metersToPxX(metrics.widthMeters, geo.lng, geo.lat), 4);
        const height = Math.max(projection.metersToPxY(metrics.heightMeters, geo.lng, geo.lat), 4);
        const scale = projection.meterScaleAt(geo.lng, geo.lat);
        const height3d = Math.max(metrics.heightMeters3d * ((scale.pixelsPerMeterX + scale.pixelsPerMeterY) / 2), 4);
        return { width, height, height3d, ...metrics };
    }
    return {
        width: Math.max(source.width ?? metrics.widthMeters * 100, 4),
        height: Math.max(source.height ?? metrics.heightMeters * 100, 4),
        height3d: Math.max(source.height3d ?? metrics.heightMeters3d * 100, 4),
        ...metrics,
    };
}

function projectObjectToScreen(object, projection) {
    if (!object) return object;
    const metrics = getObjectMetricSize(object);
    if (projection && object.lat != null && object.lng != null) {
        const center = projection.project(object.lng, object.lat);
        const screen = objectScreenSize(object, projection, { lng: object.lng, lat: object.lat });
        return {
            ...object,
            x: center.x,
            y: center.y,
            width: screen.width,
            height: screen.height,
            height3d: screen.height3d,
            _isProjectedObject: true,
            _sourceGeometry: {
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height,
                height3d: object.height3d,
            },
        };
    }
    return {
        ...object,
        width: object.width ?? metrics.widthMeters * 100,
        height: object.height ?? metrics.heightMeters * 100,
        height3d: object.height3d ?? metrics.heightMeters3d * 100,
    };
}

function removeProjectedObjectFields(object) {
    if (!object?._isProjectedObject) return object;
    const { _isProjectedObject, _sourceGeometry, ...source } = object;
    if (_sourceGeometry?.x !== undefined) source.x = _sourceGeometry.x;
    if (_sourceGeometry?.y !== undefined) source.y = _sourceGeometry.y;
    if (_sourceGeometry?.width !== undefined && source.widthMeters == null) source.width = _sourceGeometry.width;
    if (_sourceGeometry?.height !== undefined && source.heightMeters == null) source.height = _sourceGeometry.height;
    if (_sourceGeometry?.height3d !== undefined && source.heightMeters3d == null) source.height3d = _sourceGeometry.height3d;
    delete source._sourceGeometry;
    return source;
}

function templateScreenGeometry(template, center, projection) {
    if (!template || !center) return null;
    let pxPerMeterX = 4;
    let pxPerMeterY = 4;

    if (projection) {
        const geo = projection.unproject(center.x, center.y);
        const scale = projection.meterScaleAt(geo.lng, geo.lat);
        pxPerMeterX = scale.pixelsPerMeterX;
        pxPerMeterY = scale.pixelsPerMeterY;
    }

    const width = Math.max((template.width || 20) * pxPerMeterX, 8);
    const height = Math.max((template.height || 20) * pxPerMeterY, 8);
    return {
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
        points: (template.points || []).map(([mx, my]) => [mx * pxPerMeterX, my * pxPerMeterY]),
    };
}

function clampObjectCenterToRoom(point, item, room, padding = 6) {
    const width = item?.width || 40;
    const height = item?.height || 40;
    const halfW = width / 2;
    const halfH = height / 2;
    const minX = (room.x || 0) + halfW + padding;
    const maxX = (room.x || 0) + (room.width || 100) - halfW - padding;
    const minY = (room.y || 0) + halfH + padding;
    const maxY = (room.y || 0) + (room.height || 100) - halfH - padding;

    return {
        x: minX <= maxX ? Math.max(minX, Math.min(point.x, maxX)) : (room.x || 0) + (room.width || 100) / 2,
        y: minY <= maxY ? Math.max(minY, Math.min(point.y, maxY)) : (room.y || 0) + (room.height || 100) / 2,
    };
}

function withGeoPolygonPoints(shape, projection, cache) {
    const cached = cache[shape.id] || {};
    if (shape.pointsGeo?.length) return shape.pointsGeo;
    if (isLikelyGeoPoints(shape.points)) return shape.points;
    if (cached.pointsGeo?.length) return cached.pointsGeo;

    const normalized = normalizeScreenPoints(shape.points);
    const center = projection.project(shape.lng, shape.lat);
    const width = shape.width ?? normalized.width;
    const height = shape.height ?? normalized.height;
    const origin = { x: center.x - width / 2, y: center.y - height / 2 };
    const pointsGeo = normalized.points.map(([px, py]) => {
        const p = projection.unproject(origin.x + px, origin.y + py);
        return [p.lat, p.lng];
    });

    cache[shape.id] = {
        ...cached,
        pointsGeo,
    };

    return pointsGeo;
}

function renderShapeGroup(shape, shapeRef, isSelected, onSelect, onUpdate, activeFloor, clampX, clampY, stagePosRef, isOutline = false, mapRef = null, isDraggingRef = null, draggable = true, isSections = false, listening = true) {
    const shapeType = getShapeRenderType(shape);
    const isCustomPoly = shapeType === "polygon" && Array.isArray(shape._points || shape.points) && (shape._points || shape.points).length >= 3;
    const isRegPoly = !isCustomPoly && shape.sides && shape.sides >= 3;
    const isCir = shapeType === "circle";
    const { width: rw, height: rh } = getShapeRenderSize(shape);

    const isSectionOutline = isSections && isOutline;
    const fill = isSectionOutline ? "transparent" : (isOutline ? "rgba(0, 212, 255, 0.06)" : (shape.fill || "#6366f1"));
    const stroke = isSelected ? "#fff" : (isSectionOutline ? "#00d4ff" : (isOutline ? "#00d4ff" : (shape.stroke || "#555")));
    const sw = isSelected ? 2 : (isSectionOutline ? 1.5 : (isOutline ? 2.5 : (shape.strokeWidth || 2)));
    const dash = isSectionOutline ? [8, 6] : undefined;

    const events = {
        onClick: (e) => onSelect(shape.id, !!(e.evt?.ctrlKey || e.evt?.metaKey)),
        onTap: () => onSelect(shape.id, false),
        onDragStart: () => { if (isDraggingRef) isDraggingRef.current = true; },
        onDragEnd: (e) => {
            if (isDraggingRef) isDraggingRef.current = false;
            const newX = e.target.x(), newY = e.target.y();
            const cx = clampX(newX, rw, activeFloor), cy = clampY(newY, rh, activeFloor);
            if (shape._isProjected && mapRef?.current) {
                const proj = makeProjection(mapRef.current);
                if (proj) {
                    const sourceShape = removeProjectedFields(shape);
                    const measured = measureScreenBox(proj, cx, cy, rw, rh);
                    const updatedShape = {
                        ...sourceShape,
                        lat: measured.center.lat,
                        lng: measured.center.lng,
                        widthMeters: sourceShape.widthMeters ?? measured.widthMeters,
                        heightMeters: sourceShape.heightMeters ?? measured.heightMeters,
                    };
                    delete updatedShape.width;
                    delete updatedShape.height;
                    if (shape.radius !== undefined || shape.sides) {
                        updatedShape.radiusMeters = sourceShape.radiusMeters ?? Math.min(measured.widthMeters, measured.heightMeters) / 2;
                        delete updatedShape.radius;
                    }
                    if (isCustomPoly) {
                        const nextPointsGeo = (shape._points || shape.points).map(([px, py]) => {
                            const p = proj.unproject(cx + px, cy + py);
                            return [p.lat, p.lng];
                        });
                        updatedShape.points = nextPointsGeo;
                        updatedShape.pointsGeo = nextPointsGeo.map(point => [...point]);
                    }
                    onUpdate(updatedShape);
                    e.target.position({ x: cx, y: cy });
                    return;
                }
            }
            onUpdate({ ...shape, x: cx, y: cy });
        },
    };

    let shapeEl;
    if (isCustomPoly) {
        const pts = shape._points || shape.points;
        const flat = pts.flat();
        shapeEl = <Line points={flat} closed width={rw} height={rh} fill={fill} stroke={stroke} strokeWidth={sw} dash={dash} />;
    } else if (isRegPoly) {
        const r = shape.radius || 50;
        shapeEl = <Line points={polygonPoints(shape.sides, r, r, r)} closed width={r * 2} height={r * 2} fill={fill} stroke={stroke} strokeWidth={sw} dash={dash} />;
    } else if (isCir) {
        const r = shape.radius || 50;
        shapeEl = <Circle x={r} y={r} radius={r} width={r * 2} height={r * 2} fill={fill} stroke={stroke} strokeWidth={sw} dash={dash} />;
    } else {
        shapeEl = <Rect width={shape.width || 120} height={shape.height || 80} cornerRadius={6} fill={fill} stroke={stroke} strokeWidth={sw} dash={dash} />;
    }

    const gridSize = 20;
    const label = (shape.roomType || shape.outlineType || shape.type || "").replace("_", " ");

    const buildClipFunc = (ctx) => {
        drawShapePath(ctx, shape, false);
    };

    let innerContent;
    if (isOutline && !isSectionOutline) {
        const w = rw;
        const h = rh;
        const gridLines = [];
        for (let i = 1; i * gridSize < w; i++) {
            gridLines.push(
                <Line key={`vg-${i}`} points={[i * gridSize, 0, i * gridSize, h]} stroke="rgba(0, 212, 255, 0.18)" strokeWidth={0.5} listening={false} />
            );
        }
        for (let i = 1; i * gridSize < h; i++) {
            gridLines.push(
                <Line key={`hg-${i}`} points={[0, i * gridSize, w, i * gridSize]} stroke="rgba(0, 212, 255, 0.18)" strokeWidth={0.5} listening={false} />
            );
        }
        innerContent = (
            <Group clipFunc={buildClipFunc}>
                {gridLines}
                <Text x={8} y={8} text={shape.name || label} fontSize={11} fill="#fff" width={Math.max(rw - 16, 20)} wrap="word" listening={false} />
                <Text x={8} y={rh - 16} text={label} fontSize={9} fill="#ffffff88" listening={false} />
            </Group>
        );
    } else {
        innerContent = (
            <>
                <Text x={8} y={8} text={shape.name || label} fontSize={11} fill="#fff" width={Math.max(rw - 16, 20)} wrap="word" listening={false} />
                <Text x={8} y={rh - 16} text={label} fontSize={9} fill="#ffffff88" listening={false} />
            </>
        );
    }

    return (
        <Group ref={shapeRef} x={shape.x} y={shape.y} rotation={shape.rotation || 0} draggable={draggable} listening={listening} {...events} onDblClick={(e) => {
            e.cancelBubble = true;
            const newName = window.prompt("Room name:", shape.name || "Room");
            if (newName !== null) {
                onUpdate({ ...shape, name: newName });
            }
        }}>
            {shapeEl}
            {innerContent}
        </Group>
    );
}

export default function RenderComponent({
    activeTool, floors, elements, selectedShapeId, onSelectShape, onUpdateShape, canvasSettings, onGridSelect, activeFloorId, hasFloors, stage, mapVisible, onCompletePolygon, onPlaceShape, onPlaceTemplate, onSplitRoom, onCombineByDivider, onMoveDividerLine, onAddWallPad, onAddOpening, objectsData, selectedObjectId, onSelectObject, onUpdateObject, onAddObject, mapRef, mapVersion, toolActive, pendingPlacement, setPendingPlacement, multiSelectIds = [], vertexMode = false, selectedVertexIndex = -1, onSelectVertex, onMoveVertex, offsetPreviewShape, onSelectFloor
}) {
    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const transformerRef = useRef(null);
    const shapeNodesRef = useRef({});

    const [size, setSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [lines, setLines] = useState([]);
    const [handleEnds, setHandleEnds] = useState([]);
    const [cursor, setCursor] = useState({ x: null, y: null, type: "grab" });
    const [texts, setTexts] = useState([]);
    const [editingText, setEditingText] = useState(null);
    const [polyVerts, setPolyVerts] = useState([]);
    const [polyCursor, setPolyCursor] = useState(null);
    const isDraggingRef = useRef(false);
    const dividerDragPointRef = useRef({});
    const lastProjectedRef = useRef([]);
    const projectedMetricGeometryRef = useRef({});
    const [ghostPos, setGhostPos] = useState(null);
    const [dividerHover, setDividerHover] = useState(null);
    const [dividerDraw, setDividerDraw] = useState(null);
    const [hoverDivider, setHoverDivider] = useState(null);
    const [wallPreview, setWallPreview] = useState(null);

    const scaleRef = useRef(1);
    const savedStagePosRef = useRef(null);
    const positionRef = useRef({ x: 0, y: 0 });
    const drawingRef = useRef(false);
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 15;

    const activeFloor = activeFloorId ? floors.find(f => f.id === activeFloorId) : null;
    const gridBounds = activeFloor || { x: 0, y: 0, width: canvasSettings?.canvasWidth || 800, height: canvasSettings?.canvasHeight || 600 };
    const baseplateSize = canvasSettings ? { width: canvasSettings.canvasWidth, height: canvasSettings.canvasHeight } : { width: 800, height: 600 };
    const gridActive = hasFloors && (canvasSettings?.gridActive ?? true);
    const gridPixelSize = canvasSettings?.gridPixelSize ?? 50;
    const gridColor = canvasSettings?.gridColor || "#555";

    const projection = useMemo(() => makeProjection(mapRef?.current), [mapRef, mapVersion, mapVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    const projectedElements = useMemo(() => {
        if (isDraggingRef.current && lastProjectedRef.current.length) return lastProjectedRef.current;
        if (!projection) {
            const result = elements;
            lastProjectedRef.current = result;
            return result;
        }
        const result = (elements || []).map(el => {
            if (el.type === "divider_line" && Array.isArray(el.pointsGeo) && el.pointsGeo.length >= 2) {
                const start = el.pointsGeo[0];
                const end = el.pointsGeo[1];
                const p1 = projection.project(start[1], start[0]);
                const p2 = projection.project(end[1], end[0]);
                return {
                    ...el,
                    x1: p1.x,
                    y1: p1.y,
                    x2: p2.x,
                    y2: p2.y,
                    _isProjected: true,
                };
            }

            if (el.lat == null || el.lng == null) return el;
            const sourceGeometry = { x: el.x, y: el.y, width: el.width, height: el.height, radius: el.radius };
            const metricCache = projectedMetricGeometryRef.current;
            const shapeType = getShapeRenderType(el);

            if (shapeType === "polygon" && Array.isArray(el.points)) {
                const pointsGeo = withGeoPolygonPoints(el, projection, metricCache);
                const projectedPoints = pointsGeo.map(([plat, plng]) => projection.project(plng, plat));
                const normalized = normalizeScreenPoints(projectedPoints.map(p => [p.x, p.y]));
                metricCache[el.id] = {
                    ...(metricCache[el.id] || {}),
                    pointsGeo,
                    widthMeters: projection.pxToMetersX(normalized.width, el.lng, el.lat),
                    heightMeters: projection.pxToMetersY(normalized.height, el.lng, el.lat),
                };

                return {
                    ...el,
                    x: Math.min(...projectedPoints.map(p => p.x)),
                    y: Math.min(...projectedPoints.map(p => p.y)),
                    width: normalized.width,
                    height: normalized.height,
                    _points: normalized.points,
                    _isProjected: true,
                    _sourceGeometry: sourceGeometry,
                };
            }

            const metricDims = withMetricDimensions(el, projection, metricCache);
            const box = projectMetricBox(projection, el.lng, el.lat, metricDims.widthMeters, metricDims.heightMeters);
            const radiusBox = metricDims.radiusMeters != null
                ? projectMetricBox(projection, el.lng, el.lat, metricDims.radiusMeters * 2, metricDims.radiusMeters * 2)
                : null;
            const radiusPx = radiusBox ? Math.min(radiusBox.width, radiusBox.height) / 2 : null;
            const widthPx = box.width;
            const heightPx = box.height;
            const projectedRadius = radiusPx != null ? radiusPx : (el.sides || shapeType === "circle" ? Math.min(widthPx, heightPx) / 2 : el.radius);

            return {
                ...el,
                x: box.x,
                y: box.y,
                width: widthPx,
                height: heightPx,
                radius: projectedRadius,
                _points: el.points,
                _isProjected: true,
                _sourceGeometry: sourceGeometry,
            };
        });
        lastProjectedRef.current = result;
        return result;
    }, [elements, projection]);

    const projectedObjects = useMemo(() => {
        return (objectsData || []).map(object => projectObjectToScreen(object, projection));
    }, [objectsData, projection]);

    const clampX = (val, w, floor) => floor ? Math.max(floor.x, Math.min(val, floor.x + floor.width - w)) : val;
    const clampY = (val, h, floor) => floor ? Math.max(floor.y, Math.min(val, floor.y + floor.height - h)) : val;

    const isObjectPlacement = pendingPlacement?.active && pendingPlacement.kind === "object";
    const isTemplatePlacing = pendingPlacement?.active && pendingPlacement.type === "template";
    const placementItem = pendingPlacement?.item;
    const isPolygonTool = activeTool?.type === "polygon" || pendingPlacement?.type === "polygon";

    useEffect(() => {
        if (!isPolygonTool) {
            if (polyVerts.length) setPolyVerts([]);
            if (polyCursor) setPolyCursor(null);
            return;
        }
        const onKey = (e) => {
            if (e.key === "Escape") { setPolyVerts([]); setPolyCursor(null); setPendingPlacement?.(null); }
            else if (e.key === "Enter" && polyVerts.length >= 3) {
                onCompletePolygon?.(polyVerts.map(v => [v.x, v.y]));
                setPolyVerts([]);
                setPolyCursor(null);
                setPendingPlacement?.(null);
            }
        };
        const onBlur = () => {
            if (polyVerts.length >= 3) {
                onCompletePolygon?.(polyVerts.map(v => [v.x, v.y]));
            }
            setPolyVerts([]);
            setPolyCursor(null);
            setPendingPlacement?.(null);
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("blur", onBlur);
        };
    }, [isPolygonTool, polyVerts, polyCursor, onCompletePolygon, setPendingPlacement]);

    useEffect(() => {
        if (activeTool?.type === "handle") {
            const newHandles = lines?.map(line => ({
                start: [line.points[0], line.points[1]],
                end: [line.points[2], line.points[3]],
                lineColor: line.color
            }));
            setHandleEnds(newHandles);
            setCursor(c => ({ ...c, type: "grab" }));
        } else {
            if (handleEnds.length > 0) setHandleEnds([]);
            if (["grab", "grabbing"].includes(cursor.type)) setCursor(c => ({ ...c, type: "crosshair" }));
        }
        if (activeTool?.type === "clear") { setLines([]); setTexts([]); }
    }, [activeTool?.type]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return;
            const { offsetWidth, offsetHeight } = containerRef.current;
            setSize({ width: offsetWidth, height: offsetHeight });
        };
        updateSize();
        const ro = new ResizeObserver(updateSize);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const setShapeNodeRef = useCallback((id) => (node) => {
        if (node) shapeNodesRef.current[id] = node;
        else delete shapeNodesRef.current[id];
    }, []);

    useLayoutEffect(() => {
        const tr = transformerRef.current;
        if (!tr) return;
        if (stage === "sections") {
            tr.nodes([]);
            tr.getLayer()?.batchDraw();
            return;
        }
        if (selectedShapeId && shapeNodesRef.current[selectedShapeId]) {
            tr.nodes([shapeNodesRef.current[selectedShapeId]]);
            tr.forceUpdate();
            tr.getLayer()?.batchDraw();
        } else {
            tr.nodes([]);
            tr.getLayer()?.batchDraw();
        }
    }, [selectedShapeId, elements, projectedElements, mapVersion, stage]);

    const Grid = ({ bounds, gs, sc }) => {
        const g = [];
        const sw = 1 / sc;
        const ox = bounds.x, oy = bounds.y;
        const w = bounds.width, h = bounds.height;
        const cx = ox + w / 2, cy = oy + h / 2;
        g.push(<Line key="gcx" points={[cx, oy, cx, oy + h]} stroke={gridColor} strokeWidth={sw * 2} />);
        g.push(<Line key="gcy" points={[ox, cy, ox + w, cy]} stroke={gridColor} strokeWidth={sw * 2} />);
        for (let i = 1; i < (w / gs) / 2; i++) {
            const px = cx + gs * i, mx = cx - gs * i;
            g.push(<Line key={`gx${px}`} points={[px, oy, px, oy + h]} stroke={gridColor} strokeWidth={sw} />);
            g.push(<Line key={`gx${mx}`} points={[mx, oy, mx, oy + h]} stroke={gridColor} strokeWidth={sw} />);
        }
        for (let i = 1; i < (h / gs) / 2; i++) {
            const py = cy + gs * i, my = cy - gs * i;
            g.push(<Line key={`gy${py}`} points={[ox, py, ox + w, py]} stroke={gridColor} strokeWidth={sw} />);
            g.push(<Line key={`gy${my}`} points={[ox, my, ox + w, my]} stroke={gridColor} strokeWidth={sw} />);
        }
        return <>{g}</>;
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const sb = 1.05;
        const os = scaleRef.current, op = positionRef.current;
        const stage = e.target.getStage();
        stage.stopDrag();
        const ptr = stage.getPointerPosition();
        const mtp = { x: (ptr.x - op.x) / os, y: (ptr.y - op.y) / os };
        let ns = e.evt.deltaY > 0 ? os / sb : os * sb;
        ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, ns));
        const np = { x: ptr.x - mtp.x * ns, y: ptr.y - mtp.y * ns };
        scaleRef.current = ns; positionRef.current = np;
        setScale(ns); setPosition(np);
    };

    const snap = (v, gs) => Math.round(v / gs) * gs;

    const handleMouseDown = (e) => {
        if (activeTool?.type === "eraser") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            setLines(prev => prev.filter(l => !isPointNearLine(pt.x, pt.y, l, activeTool.radius)));
            drawingRef.current = true;
        } else if (activeTool?.type === "text") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            setTexts(prev => [...prev, { id: Date.now().toString(), x: pt.x, y: pt.y, text: "Edit", fontSize: 16, color: "#fff" }]);
        } else if (activeTool?.type === "line") {
            const stage = e.target.getStage();
            stage.stopDrag();
            const pt = stage.getRelativePointerPosition();
            const wx = activeTool.snap ? snap(pt.x, gridPixelSize) : pt.x;
            const wy = activeTool.snap ? snap(pt.y, gridPixelSize) : pt.y;
            drawingRef.current = true;
            setLines(prev => [...prev, { id: Date.now().toString(), points: [wx, wy, wx, wy], color: activeTool.color || "#fff", width: activeTool.width || 2, draggable: activeTool.draggable || false }]);
        }
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const pt = stage.getRelativePointerPosition();
        setCursor(c => ({ ...c, x: pt.x, y: pt.y }));
        if ((activeTool?.type === "polygon" || isPolygonPlacing) && pt) {
            setPolyCursor({ x: pt.x, y: pt.y });
        }
        if (!drawingRef.current) return;
        stage.stopDrag();
        if (activeTool?.type === "eraser") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            setLines(prev => prev.filter(l => !isPointNearLine(pt.x, pt.y, l, (activeTool.radius || 10) / scaleRef.current)));
            return;
        }
        if (activeTool?.type === "line") {
            setLines(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, points: [last.points[0], last.points[1], pt.x, pt.y] }];
            });
        }
    };

    const handleMouseUp = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
    };

    const isPointNearLine = (px, py, obj, th = 10) => {
        if (!obj?.points) return false;
        const [x1, y1, x2, y2] = obj.points;
        const a = px - x1, b = py - y1, c = x2 - x1, d = y2 - y1;
        const dot = a * c + b * d, lenSq = c * c + d * d;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * c; yy = y1 + param * d; }
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2) < th;
    };

    const findRoomAtPoint = (pt, includeBase = true) => {
        const allProj = projectedElements || elements;
        const rooms = allProj
            .filter(el => el.type === "room" && el.floor_id && (includeBase || el.sectionRole !== "base"))
            .slice()
            .reverse();
        for (const room of rooms) {
            const rx = room.x || 0, ry = room.y || 0, rw = room.width || 100, rh = room.height || 100;
            if (pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh) {
                return room;
            }
        }
        return null;
    };

    const findOutlineAtPoint = (pt) => {
        const allProj = projectedElements || elements;
        const outlines = allProj.filter(el => el.floor_id == null && el.type !== "divider_line" && el.type !== "wall" && el.type !== "opening").slice().reverse();
        for (const outline of outlines) {
            const rx = outline.x || 0, ry = outline.y || 0, rw = outline.width || 100, rh = outline.height || 100;
            if (pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh) {
                return outline;
            }
        }
        return null;
    };

    const findSectionTargetAtPoint = (pt) => {
        const room = findRoomAtPoint(pt);
        if (room) return { ...room, floorTargetId: room.floor_id };
        const allProj = projectedElements || elements;
        const outlines = allProj.filter(el => el.floor_id == null && el.type !== "divider_line" && el.type !== "wall").slice().reverse();
        for (const outline of outlines) {
            const ox = outline.x || 0, oy = outline.y || 0, ow = outline.width || 100, oh = outline.height || 100;
            if (pt.x >= ox && pt.x <= ox + ow && pt.y >= oy && pt.y <= oy + oh) {
                return { ...outline, floorTargetId: outline.id };
            }
        }
        return null;
    };

    const findDividerAtPoint = (pt, threshold = 8) => {
        const allProj = projectedElements || elements;
        const dividers = allProj.filter(el => el.type === "divider_line");
        let closest = null;
        let closestDist = Infinity;
        for (const div of dividers) {
            const { x1, y1, x2, y2 } = div;
            const dx = x2 - x1, dy = y2 - y1;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) continue;
            let t = ((pt.x - x1) * dx + (pt.y - y1) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const px = x1 + t * dx, py = y1 + t * dy;
            const dist = Math.sqrt((pt.x - px) ** 2 + (pt.y - py) ** 2);
            if (dist < threshold && dist < closestDist) {
                closestDist = dist;
                closest = { divider: div, t, px, py };
            }
        }
        return closest;
    };

    const handleStageClick = (e) => {
        if (didPanRef.current) { didPanRef.current = false; return; }

        if (activeTool?.type === "divider") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            if (dividerDraw) {
                setDividerDraw(null);
                return;
            }
            const hit = findRoomAtPoint(pt);
            if (!hit) return;
            const plan = getDividerPlan(hit, pt);
            if (!plan) return;
            onSplitRoom?.(hit.id, plan.mode, { x: plan.splitX, y: plan.splitY });
            return;
        }

        if (activeTool?.type === "combine") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            const hit = findDividerAtPoint(pt, 12);
            if (hit) {
                onCombineByDivider?.(hit.divider.id, { point: { x: hit.px, y: hit.py }, divider: hit.divider });
            }
            return;
        }

        if (activeTool?.type === "select") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            const hit = findDividerAtPoint(pt, 12);
            if (hit) {
                onSelectShape(hit.divider.id);
            } else {
                const outlineHit = findOutlineAtPoint(pt);
                if (outlineHit) {
                    onSelectFloor?.(outlineHit.id);
                } else {
                    onSelectShape(null);
                }
            }
            return;
        }

        if (activeTool?.type === "wall_square" || activeTool?.type === "wall_line" || activeTool?.type === "door" || activeTool?.type === "window") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            const hit = findSectionTargetAtPoint(pt);
            if (hit) {
                const room = hit.room || hit;
                if (activeTool.type === "door" || activeTool.type === "window") {
                    onAddOpening?.(activeTool.type, hit.floorTargetId || hit.floor_id, hit.id, pt, room);
                } else {
                    onAddWallPad?.(activeTool.type, hit.floorTargetId || hit.floor_id, hit.id, pt, room);
                }
            }
            return;
        }

        if (isObjectPlacement) {
            const stageNode = e.target.getStage();
            const pt = stageNode.getRelativePointerPosition();
            if (!pt || !placementItem) return;
            const room = findRoomAtPoint(pt, false);
            if (!room) return;
            const screenSize = objectScreenSize(placementItem, projection, pt);
            const snapped = clampObjectCenterToRoom(pt, { ...placementItem, ...screenSize }, room);
            const geo = projection?.unproject(snapped.x, snapped.y);
            const metricSize = getObjectMetricSize(placementItem);
            const obj = {
                id: `obj-${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
                name: placementItem.name,
                type: "object",
                category: placementItem.category,
                x: snapped.x,
                y: snapped.y,
                width: screenSize.width,
                height: screenSize.height,
                height3d: screenSize.height3d,
                widthMeters: metricSize.widthMeters,
                heightMeters: metricSize.heightMeters,
                heightMeters3d: metricSize.heightMeters3d,
                ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
                rotation: 0,
                floor_id: room.floor_id,
                room_id: room.id,
                fill: placementItem.fill || "#888",
                icon: placementItem.icon,
                modelUrl: placementItem.modelUrl || null,
            };
            onAddObject?.(obj);
            onSelectObject?.(obj.id);
            setPendingPlacement?.(null);
            setGhostPos(null);
            return;
        }

        if (isTemplatePlacing) {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            onPlaceTemplate?.(pendingPlacement.templateId, pt);
            setPendingPlacement(null);
            setGhostPos(null);
            return;
        }

        if (pendingPlacement?.active && pendingPlacement.type !== "polygon") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            const defaults = {
                rectangle: { width: 100, height: 80, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2 },
                circle: { radius: 50, width: 100, height: 100, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2 },
                triangle: { sides: 3, radius: 50, width: 100, height: 100, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2 },
                pentagon: { sides: 5, radius: 50, width: 100, height: 100, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2 },
                hexagon: { sides: 6, radius: 50, width: 100, height: 100, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2 },
                octagon: { sides: 8, radius: 50, width: 100, height: 100, fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2 },
            };
            const shapeDefaults = defaults[pendingPlacement.type] || defaults.rectangle;
            const width = shapeDefaults.width || (shapeDefaults.radius || 50) * 2;
            const height = shapeDefaults.height || (shapeDefaults.radius || 50) * 2;
            onPlaceShape?.({ ...shapeDefaults, type: pendingPlacement.type, x: pt.x - width / 2, y: pt.y - height / 2 });
            setPendingPlacement(null);
            setGhostPos(null);
            return;
        }

        if (activeTool?.type === "polygon" || pendingPlacement?.type === "polygon") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) return;
            const newPt = { x: pt.x, y: pt.y };
            if (polyVerts.length >= 3) {
                const first = polyVerts[0];
                const dx = first.x - newPt.x, dy = first.y - newPt.y;
                if (Math.sqrt(dx * dx + dy * dy) < 12) {
                    onCompletePolygon?.(polyVerts.map(v => [v.x, v.y]));
                    setPolyVerts([]);
                    setPolyCursor(null);
                    setPendingPlacement(null);
                    return;
                }
            }
            setPolyVerts(prev => [...prev, newPt]);
            return;
        }
        if (e.target === e.target.getStage()) {
            onSelectShape(null);
            if (onGridSelect) onGridSelect();
        }
    };

    const handleAnchorDrag = (e, id, index) => {
        const stage = e.target.getStage();
        const pt = stage.getRelativePointerPosition();
        const wx = activeTool?.snap ? snap(pt.x, gridPixelSize) : pt.x;
        const wy = activeTool?.snap ? snap(pt.y, gridPixelSize) : pt.y;
        setLines(prev => prev.map(l => {
            if (l.id !== id) return l;
            const np = [...l.points];
            np[index * 2] = wx; np[index * 2 + 1] = wy;
            return { ...l, points: np };
        }));
    };

    const mapPanRef = useRef({ active: false, startX: 0, startY: 0 });
    const didPanRef = useRef(false);

    const isPlacing = !!pendingPlacement?.active;
    const isPolygonPlacing = isPlacing && pendingPlacement.type === "polygon";
    const isShapePlacing = isPlacing && !isPolygonPlacing && !isObjectPlacement && !isTemplatePlacing;
    const hoverOrientation = hoverDivider?.combineMode || (hoverDivider?.crosses ? "both" : hoverDivider?.orientation);
    const cursorClass = isPolygonPlacing ? "cursor-crosshair"
        : isShapePlacing || isTemplatePlacing ? "cursor-pad"
        : activeTool?.type === "divider" ? "cursor-divider"
        : activeTool?.type === "select" ? `cursor-select-${hoverOrientation || "free"}`
        : activeTool?.type === "combine" ? `cursor-combine-${hoverOrientation || "free"}`
        : activeTool?.type === "wall_square" ? "cursor-pad-square"
        : activeTool?.type === "wall_line" ? "cursor-pad-line"
        : (activeTool?.type === "door" || activeTool?.type === "window") ? "cursor-opening"
        : "";
    const isDrawTool = activeTool && ["line", "text", "eraser"].includes(activeTool.type);

    const handleMapWheel = useCallback((e) => {
        if (!mapVisible || !mapRef?.current) return;
        e.evt.preventDefault();
        const delta = e.evt.deltaY;
        const zoomDiff = delta > 0 ? -0.5 : 0.5;
        const cur = mapRef.current.getZoom();
        mapRef.current.zoomTo(Math.max(12, Math.min(24, cur + zoomDiff)), { duration: 0 });
    }, [mapVisible, mapRef]);

    const handleCanvasMouseDown = useCallback((e) => {
        const targetRole = e.target?.getAttr?.("dataRole");
        const canStartMapPan = mapVisible && (
            e.target === e.target.getStage() ||
            (stage === "objects" && targetRole !== "object")
        );
        if (canStartMapPan) {
            mapPanRef.current = { active: true, startX: e.evt.clientX, startY: e.evt.clientY };
            didPanRef.current = false;
        }
    }, [mapVisible, stage]);

    const handleCanvasMouseMove = useCallback((e) => {
        if (mapVisible && mapPanRef.current?.active && mapRef?.current) {
            const dx = e.evt.clientX - mapPanRef.current.startX;
            const dy = e.evt.clientY - mapPanRef.current.startY;
            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
            didPanRef.current = true;
            mapPanRef.current.startX = e.evt.clientX;
            mapPanRef.current.startY = e.evt.clientY;
            mapRef.current.panBy([-dx, -dy], { duration: 0 });
            return;
        }
        if (isPolygonPlacing || activeTool?.type === "polygon") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (pt) setPolyCursor({ x: pt.x, y: pt.y });
        }
        if (isObjectPlacement) {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (pt) {
                const room = findRoomAtPoint(pt, false);
                const screenSize = objectScreenSize(placementItem, projection, pt);
                const next = room ? clampObjectCenterToRoom(pt, { ...placementItem, ...screenSize }, room) : pt;
                setGhostPos({ ...next, ...screenSize, valid: !!room });
            }
        } else if (isTemplatePlacing) {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (pt) {
                const geometry = templateScreenGeometry(pendingPlacement.template, pt, projection);
                setGhostPos(geometry ? { x: pt.x, y: pt.y, ...geometry } : { x: pt.x, y: pt.y });
            }
        } else if (isShapePlacing) {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (pt) {
                const defaults = {
                    rectangle: { width: 100, height: 80 },
                    circle: { width: 100, height: 100 },
                    triangle: { width: 100, height: 100 },
                    pentagon: { width: 100, height: 100 },
                    hexagon: { width: 100, height: 100 },
                    octagon: { width: 100, height: 100 },
                };
                const size = defaults[pendingPlacement.type] || defaults.rectangle;
                setGhostPos({ x: pt.x, y: pt.y, width: size.width, height: size.height });
            }
        }
        if (activeTool?.type === "divider") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            if (!pt) { setDividerHover(null); return; }
            if (dividerDraw) {
                setDividerDraw(prev => ({ ...prev, x2: pt.x, y2: pt.y }));
                return;
            }
            const hit = findRoomAtPoint(pt);
            if (hit) {
                const plan = getDividerPlan(hit, pt);
                setDividerHover(plan ? { room: hit, ...plan } : null);
            } else {
                setDividerHover(null);
            }
            setHoverDivider(null);
            setWallPreview(null);
        } else if (activeTool?.type === "select" || activeTool?.type === "combine") {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            const hit = pt ? findDividerAtPoint(pt, 12) : null;
            const allProj = projectedElements || elements;
            const dividers = allProj.filter(el => el.type === "divider_line" && (!hit || el.floor_id === hit.divider.floor_id));
            const rooms = allProj.filter(el => el.type === "room" && el.floor_id === hit?.divider.floor_id && el.sectionRole !== "base");
            const preview = activeTool?.type === "combine" && hit
                ? combinePreviewForDivider(hit.divider, dividers, rooms, { x: hit.px, y: hit.py })
                : null;
            setHoverDivider(hit ? {
                divider: hit.divider,
                orientation: dividerOrientation(hit.divider),
                crosses: dividerHasCrossing(hit.divider, dividers),
                combineMode: preview?.rooms?.length >= 2 ? preview.mode : null,
                combineRooms: preview?.rooms || [],
            } : null);
            setDividerHover(null);
            setWallPreview(null);
        } else if (["wall_square", "wall_line", "door", "window"].includes(activeTool?.type)) {
            const stage = e.target.getStage();
            const pt = stage.getRelativePointerPosition();
            const room = pt ? findRoomAtPoint(pt) : null;
            setWallPreview(room ? wallToolPreview(activeTool.type, room, pt, canvasSettings) : null);
            setDividerHover(null);
            setHoverDivider(null);
        } else {
            setDividerHover(null);
            setHoverDivider(null);
            setWallPreview(null);
        }
    }, [mapVisible, mapRef, isPolygonPlacing, isShapePlacing, isObjectPlacement, isTemplatePlacing, placementItem, pendingPlacement, projection, activeTool?.type, elements, dividerDraw, projectedElements, canvasSettings]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCanvasMouseUp = useCallback(() => {
        mapPanRef.current.active = false;
    }, []);

    const renderedElements = projectedElements || elements || [];
    const projectedOffsetPreview = useMemo(() => {
        if (!offsetPreviewShape || !projection) return null;
        const pointsGeo = offsetPreviewShape.pointsGeo || (isLikelyGeoPoints(offsetPreviewShape.points) ? offsetPreviewShape.points : null);
        if (!pointsGeo?.length) return null;
        return pointsGeo.map(([lat, lng]) => {
            const point = projection.project(lng, lat);
            return [point.x, point.y];
        });
    }, [offsetPreviewShape, projection]);
    const isPlanStage = stage === "sections" || stage === "objects";
    const shapeElements = renderedElements.filter(el => el.type !== "divider_line" && el.type !== "wall" && el.type !== "opening");
    const sectionInteriorShapes = isPlanStage ? shapeElements.filter(el => el.floor_id) : [];
    const sectionOutlineShapes = isPlanStage ? shapeElements.filter(el => !el.floor_id) : [];
    const normalShapes = isPlanStage ? [] : shapeElements;
    const dividerElements = renderedElements.filter(el => el.type === "divider_line");
    const wallElements = renderedElements.filter(el => el.type === "wall");
    const openingElements = renderedElements.filter(el => el.type === "opening");

    const renderElementShape = (el) => {
        const isSectionTopOutline = isPlanStage && !el.floor_id;
        const isOutlineRender = stage === "outline" || isSectionTopOutline;
        const draggable = stage === "outline";
        const listening = stage !== "objects";
        const isSelected = el.id === selectedShapeId || multiSelectIds.includes(el.id);

        const handleOutlineClick = (id, ctrlKey) => {
            if (isSectionTopOutline && stage === "sections") {
                onSelectFloor?.(id);
            } else {
                onSelectShape(id, ctrlKey);
            }
        };

        return (
            <React.Fragment key={el.id}>
                {renderShapeGroup(el, setShapeNodeRef(el.id), isSelected, handleOutlineClick, onUpdateShape, activeFloor, clampX, clampY, savedStagePosRef, isOutlineRender, mapRef, isDraggingRef, draggable, isPlanStage, listening)}
            </React.Fragment>
        );
    };

    const renderDividerHandles = (div) => {
        const isSelected = selectedShapeId === div.id;
        if (activeTool?.type !== "select") return null;
        const moveHandle = (e, origin, attrsForPoint) => {
            onMoveDividerLine?.(div.id, attrsForPoint(e.target.x(), e.target.y()));
            e.target.position(origin);
        };
        return (
            <React.Fragment key={`handles-${div.id}`}>
                <Circle x={div.x1} y={div.y1} radius={8 / scaleRef.current} fill={isSelected ? "#22c55e" : "#ff8800"} stroke="#fff" strokeWidth={1 / scaleRef.current} draggable
                    onClick={(e) => { e.cancelBubble = true; onSelectShape(div.id); }}
                    onTap={(e) => { e.cancelBubble = true; onSelectShape(div.id); }}
                    onDragMove={(e) => moveHandle(e, { x: div.x1, y: div.y1 }, (x, y) => ({ x1: x, y1: y }))}
                    onDragEnd={(e) => moveHandle(e, { x: div.x1, y: div.y1 }, (x, y) => ({ x1: x, y1: y }))} />
                <Circle x={div.x2} y={div.y2} radius={8 / scaleRef.current} fill={isSelected ? "#22c55e" : "#ff8800"} stroke="#fff" strokeWidth={1 / scaleRef.current} draggable
                    onClick={(e) => { e.cancelBubble = true; onSelectShape(div.id); }}
                    onTap={(e) => { e.cancelBubble = true; onSelectShape(div.id); }}
                    onDragMove={(e) => moveHandle(e, { x: div.x2, y: div.y2 }, (x, y) => ({ x2: x, y2: y }))}
                    onDragEnd={(e) => moveHandle(e, { x: div.x2, y: div.y2 }, (x, y) => ({ x2: x, y2: y }))} />
            </React.Fragment>
        );
    };

    const renderDivider = (div, showHandles = true) => {
        const isSelected = selectedShapeId === div.id;
        const moveDivider = (e) => {
            const node = e.target;
            const dx = node.x(), dy = node.y();
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
            node.position({ x: 0, y: 0 });
            onMoveDividerLine?.(div.id, {
                x1: div.x1 + dx,
                y1: div.y1 + dy,
                x2: div.x2 + dx,
                y2: div.y2 + dy,
                _actionPoint: dividerDragPointRef.current[div.id] || null,
            });
        };
        return (
            <React.Fragment key={div.id}>
                <Line
                    points={[div.x1, div.y1, div.x2, div.y2]}
                    stroke={isSelected ? "#22c55e" : "#ff4444"}
                    strokeWidth={isSelected ? 3 : 2}
                    hitStrokeWidth={12}
                    listening={stage !== "objects"}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (activeTool?.type === "combine") {
                            const stage = e.target.getStage();
                            const pt = stage?.getRelativePointerPosition();
                            onCombineByDivider?.(div.id, { point: pt ? { x: pt.x, y: pt.y } : null, divider: div });
                            return;
                        }
                        onSelectShape(div.id);
                    }}
                    onTap={(e) => {
                        e.cancelBubble = true;
                        if (activeTool?.type === "combine") {
                            const stage = e.target.getStage();
                            const pt = stage?.getRelativePointerPosition();
                            onCombineByDivider?.(div.id, { point: pt ? { x: pt.x, y: pt.y } : null, divider: div });
                            return;
                        }
                        onSelectShape(div.id);
                    }}
                    draggable={stage === "sections" && activeTool?.type === "select"}
                    onDragStart={(e) => {
                        const stageNode = e.target.getStage();
                        const pt = stageNode?.getRelativePointerPosition();
                        dividerDragPointRef.current[div.id] = pt ? { x: pt.x, y: pt.y } : null;
                    }}
                    onDragMove={moveDivider}
                    onDragEnd={(e) => {
                        moveDivider(e);
                        delete dividerDragPointRef.current[div.id];
                    }}
                />
                {showHandles && renderDividerHandles(div)}
            </React.Fragment>
        );
    };

    const renderWall = (wall) => {
        const selected = selectedShapeId === wall.id;
        const draggable = stage === "sections" && activeTool?.type === "select";
        const common = {
            listening: stage !== "objects",
            onClick: (e) => {
                e.cancelBubble = true;
                onSelectShape(wall.id);
            },
            onTap: (e) => {
                e.cancelBubble = true;
                onSelectShape(wall.id);
            },
        };

        if (wall.wallType === "wall_square") {
            return (
                <Group
                    key={wall.id}
                    draggable={draggable}
                    onDragEnd={(e) => {
                        const dx = e.target.x();
                        const dy = e.target.y();
                        e.target.position({ x: 0, y: 0 });
                        onUpdateShape({ ...wall, x: wall.x + dx, y: wall.y + dy });
                    }}
                    {...common}
                >
                    {fullWallRects(wall).map(rect => (
                        <Rect
                            key={`${wall.id}-${rect.key}`}
                            {...rect}
                            fill={wall.fill || "#52525b"}
                            stroke={wall.stroke || "#111827"}
                            strokeWidth={wall.strokeWidth || 1}
                        />
                    ))}
                    {selected && (
                        <Rect
                            x={wall.x}
                            y={wall.y}
                            width={wall.width}
                            height={wall.height}
                            fill="transparent"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dash={[6, 4]}
                        />
                    )}
                </Group>
            );
        }

        return (
            <Rect key={wall.id} x={wall.x} y={wall.y} width={wall.width} height={wall.height}
                fill={wall.fill || "#888"} stroke={selected ? "#22c55e" : (wall.stroke || "#555")} strokeWidth={selected ? 2 : (wall.strokeWidth || 1)}
                listening={stage !== "objects"}
                draggable={draggable}
                onClick={(e) => { e.cancelBubble = true; onSelectShape(wall.id); }}
                onTap={(e) => { e.cancelBubble = true; onSelectShape(wall.id); }}
                onDragEnd={(e) => {
                    onUpdateShape({ ...wall, x: e.target.x(), y: e.target.y() });
                }} />
        );
    };

    const renderOpening = (opening) => {
        const selected = selectedShapeId === opening.id;
        const isWindow = opening.openingType === "window";
        return (
            <Group
                key={opening.id}
                listening={stage !== "objects"}
                draggable={stage === "sections" && activeTool?.type === "select"}
                onClick={(e) => { e.cancelBubble = true; onSelectShape(opening.id); }}
                onTap={(e) => { e.cancelBubble = true; onSelectShape(opening.id); }}
                onDragEnd={(e) => {
                    const dx = e.target.x();
                    const dy = e.target.y();
                    e.target.position({ x: 0, y: 0 });
                    onUpdateShape({ ...opening, x: opening.x + dx, y: opening.y + dy });
                }}
            >
                <Rect
                    x={opening.x}
                    y={opening.y}
                    width={opening.width}
                    height={opening.height}
                    fill={opening.fill || (isWindow ? "#38bdf8" : "#f8fafc")}
                    stroke={selected ? "#22c55e" : (opening.stroke || "#475569")}
                    strokeWidth={selected ? 2 : (opening.strokeWidth || 1)}
                    dash={isWindow ? [4, 3] : undefined}
                />
                <Text
                    x={opening.x}
                    y={opening.y + Math.max(0, opening.height / 2 - 5)}
                    width={opening.width}
                    text={isWindow ? "W" : "D"}
                    fontSize={10}
                    fontStyle="bold"
                    fill={isWindow ? "#082f49" : "#334155"}
                    align="center"
                    listening={false}
                />
            </Group>
        );
    };

    const renderObject2D = (obj) => {
        const width = obj.width || 40;
        const height = obj.height || 40;
        const selected = obj.id === selectedObjectId;
        return (
            <Group
                key={obj.id}
                x={obj.x || 0}
                y={obj.y || 0}
                rotation={obj.rotation || 0}
                draggable={stage === "objects"}
                dataRole="object"
                onClick={(e) => { e.cancelBubble = true; onSelectObject?.(obj.id); }}
                onTap={(e) => { e.cancelBubble = true; onSelectObject?.(obj.id); }}
                onDragEnd={(e) => {
                    const point = { x: e.target.x(), y: e.target.y() };
                    const room = renderedElements.find(el => el.id === obj.room_id)
                        || findRoomAtPoint(point, false);
                    const snapped = room ? clampObjectCenterToRoom(point, obj, room) : point;
                    const sourceObject = removeProjectedObjectFields(obj);
                    const geo = projection?.unproject(snapped.x, snapped.y);
                    const metricSize = getObjectMetricSize(sourceObject);
                    onUpdateObject?.({
                        ...sourceObject,
                        x: snapped.x,
                        y: snapped.y,
                        ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
                        widthMeters: metricSize.widthMeters,
                        heightMeters: metricSize.heightMeters,
                        heightMeters3d: metricSize.heightMeters3d,
                        floor_id: room?.floor_id || obj.floor_id || null,
                        room_id: room?.id || obj.room_id || null,
                    });
                    e.target.position(snapped);
                }}
            >
                <Rect
                    x={-width / 2}
                    y={-height / 2}
                    width={width}
                    height={height}
                    cornerRadius={4}
                    fill={obj.fill || "#8B5CF6"}
                    opacity={0.75}
                    stroke={selected ? "#22c55e" : "#ffffff"}
                    strokeWidth={selected ? 2 : 1}
                    dataRole="object"
                />
                <Text
                    x={-width / 2 + 4}
                    y={-height / 2 + 4}
                    text={obj.icon || obj.name || "Object"}
                    fontSize={14}
                    fill="#fff"
                    width={Math.max(width - 8, 20)}
                    align="center"
                    listening={false}
                />
            </Group>
        );
    };

    const renderDividerPreviews = (floorId = null) => {
        const previewRooms = (hoverDivider?.combineRooms || []).filter(room => !floorId || room.floor_id === floorId);
        const showDividerHover = dividerHover && (!floorId || dividerHover.room?.floor_id === floorId);

        return (
        <>
            {activeTool?.type === "combine" && previewRooms.length >= 2 && (
                <Group listening={false}>
                    {previewRooms.map(room => (
                        <Rect key={`combine-preview-${room.id}`} x={room.x} y={room.y}
                            width={room.width} height={room.height}
                            fill="rgba(34, 197, 94, 0.22)"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dash={[8, 4]} />
                    ))}
                </Group>
            )}

            {dividerDraw && (
                <Line points={[dividerDraw.x1, dividerDraw.y1, dividerDraw.x2 || dividerDraw.x1, dividerDraw.y2 || dividerDraw.y1]}
                    stroke="#ff4444" strokeWidth={2} dash={[6, 3]} listening={false} />
            )}

            {showDividerHover && activeTool?.type === "divider" && (
                <Group listening={false}>
                    <Rect x={dividerHover.room.x} y={dividerHover.room.y}
                        width={dividerHover.room.width} height={dividerHover.room.height}
                        fill="rgba(0, 212, 255, 0.15)" stroke="#00d4ff" strokeWidth={2} dash={[6, 3]} />
                    {dividerHover.lines.map((line, index) => (
                        <Line key={`divider-preview-${index}`} points={[line.x1, line.y1, line.x2, line.y2]}
                            stroke="#ff4444" strokeWidth={2} dash={[6, 4]} />
                    ))}
                    <Text x={dividerHover.room.x + 4} y={dividerHover.room.y + 4}
                        text={dividerHover.mode === "both" ? "4-split" : dividerHover.mode === "horizontal" ? "H-split" : "V-split"}
                        fontSize={10} fill="#ff4444" />
                </Group>
            )}
        </>
        );
    };

    const renderWallPreview = (floorId = null) => {
        if (!wallPreview || (floorId && wallPreview.room?.floor_id !== floorId)) return null;
        if (!wallPreview.valid) {
            return (
                <Group listening={false}>
                    <Rect
                        x={wallPreview.room.x}
                        y={wallPreview.room.y}
                        width={wallPreview.room.width}
                        height={wallPreview.room.height}
                        fill="rgba(239, 68, 68, 0.08)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dash={[6, 4]}
                    />
                    <Text
                        x={wallPreview.room.x + 6}
                        y={wallPreview.room.y + 6}
                        width={Math.max(40, wallPreview.room.width - 12)}
                        text="Choose an edge"
                        fontSize={10}
                        fill="#ef4444"
                    />
                </Group>
            );
        }

        if (wallPreview.type === "wall_square") {
            return (
                <Group listening={false}>
                    {fullWallRects(wallPreview.wall).map(rect => (
                        <Rect
                            key={`wall-preview-${rect.key}`}
                            {...rect}
                            fill="rgba(34, 197, 94, 0.28)"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dash={[7, 4]}
                        />
                    ))}
                </Group>
            );
        }

        const isOpening = wallPreview.type === "door" || wallPreview.type === "window";
        return (
            <Rect
                {...wallPreview.rect}
                fill={isOpening ? "rgba(14, 165, 233, 0.34)" : "rgba(34, 197, 94, 0.28)"}
                stroke={isOpening ? "#0ea5e9" : "#22c55e"}
                strokeWidth={2}
                dash={[7, 4]}
                listening={false}
            />
        );
    };

    return (
        <div id="render-component" ref={containerRef} className={`${toolActive ? "tool-active" : ""} ${cursorClass}`.trim()}>
            {size.width > 0 && (
                <Stage
                    ref={stageRef}
                    width={size.width} height={size.height}
                    style={{}}
                    scaleX={mapVisible ? 1 : scale} scaleY={mapVisible ? 1 : scale}
                    x={mapVisible ? 0 : position.x} y={mapVisible ? 0 : position.y}
                    draggable={isDrawTool && !mapVisible}
                    onWheel={mapVisible ? handleMapWheel : (toolActive ? handleWheel : undefined)}
                    onDragMove={(e) => { if (!mapVisible) positionRef.current = e.target.position(); }}
                    onDragEnd={(e) => { if (!mapVisible) { const np = { x: e.target.x(), y: e.target.y() }; positionRef.current = np; setPosition(np); } }}
                    onMouseDown={mapVisible ? handleCanvasMouseDown : (isDrawTool ? handleMouseDown : undefined)}
                    onMouseMove={(e) => {
                        if (mapVisible) handleCanvasMouseMove(e);
                        else if (isDrawTool || isPolygonPlacing) handleMouseMove(e);
                        else if (activeTool?.type === "divider" && dividerDraw) {
                            const stage = e.target.getStage();
                            const pt = stage.getRelativePointerPosition();
                            if (pt) setDividerDraw(prev => ({ ...prev, x2: pt.x, y2: pt.y }));
                        }
                    }}
                    onMouseUp={mapVisible ? handleCanvasMouseUp : (isDrawTool ? handleMouseUp : undefined)}
                    onClick={handleStageClick}
                    onTap={handleStageClick}
                >
                    <Layer>
                        {hasFloors && !mapVisible && <Rect x={0} y={0} width={baseplateSize.width} height={baseplateSize.height}
                            fill={canvasSettings?.bgColor || "#1a1a2e"} stroke="#555" strokeWidth={2} />}
                        {gridActive && <Grid bounds={gridBounds} gs={gridPixelSize} sc={scaleRef.current} />}
                        {activeFloor && <Rect x={gridBounds.x} y={gridBounds.y} width={gridBounds.width} height={gridBounds.height}
                            fill="transparent" stroke={gridColor} strokeWidth={2} dash={[10, 5]} listening={false} />}

                        {projectedOffsetPreview && (
                            <Line
                                points={projectedOffsetPreview.flat()}
                                closed
                                fill="rgba(34, 197, 94, 0.22)"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dash={[8, 5]}
                                listening={false}
                            />
                        )}

                        {isPlanStage ? (
                            <>
                                {sectionOutlineShapes.map(outline => (
                                    <Group key={`section-floor-${outline.id}`} clipFunc={(ctx) => drawShapePath(ctx, outline, true)}>
                                        {sectionInteriorShapes.filter(el => el.floor_id === outline.id).map(renderElementShape)}
                                        {dividerElements.filter(el => el.floor_id === outline.id).map(div => renderDivider(div, false))}
                                        {wallElements.filter(el => el.floor_id === outline.id).map(renderWall)}
                                        {openingElements.filter(el => el.floor_id === outline.id).map(renderOpening)}
                                        {renderDividerPreviews(outline.id)}
                                        {renderWallPreview(outline.id)}
                                        {stage === "objects" && projectedObjects
                                            .filter(obj => obj.floor_id === outline.id)
                                            .map(renderObject2D)}
                                    </Group>
                                ))}
                                {sectionOutlineShapes.length === 0 && (
                                    <>
                                        {sectionInteriorShapes.map(renderElementShape)}
                                        {dividerElements.map(renderDivider)}
                                        {wallElements.map(renderWall)}
                                        {openingElements.map(renderOpening)}
                                        {renderDividerPreviews()}
                                        {renderWallPreview()}
                                        {stage === "objects" && projectedObjects.map(renderObject2D)}
                                    </>
                                )}
                                {sectionOutlineShapes.map(renderElementShape)}
                                {sectionOutlineShapes.length > 0 && dividerElements.map(renderDividerHandles)}
                            </>
                        ) : (
                            normalShapes.map(renderElementShape)
                        )}

                        {vertexMode && selectedShapeId && (() => {
                            const shape = (projectedElements || elements || []).find(s => s.id === selectedShapeId);
                            const pts = shape?._points || shape?.points;
                            if (!shape || getShapeRenderType(shape) !== "polygon" || !Array.isArray(pts) || pts.length < 3) return null;
                            return pts.map(([px, py], index) => {
                                const x = (shape.x || 0) + px;
                                const y = (shape.y || 0) + py;
                                const isActive = index === selectedVertexIndex;
                                return (
                                    <Circle
                                        key={`vertex-${shape.id}-${index}`}
                                        x={x}
                                        y={y}
                                        radius={isActive ? 7 : 5}
                                        fill={isActive ? "#22c55e" : "#fff"}
                                        stroke={isActive ? "#fff" : "#22c55e"}
                                        strokeWidth={2}
                                        draggable
                                        onClick={(e) => {
                                            e.cancelBubble = true;
                                            onSelectVertex?.(index);
                                        }}
                                        onTap={(e) => {
                                            e.cancelBubble = true;
                                            onSelectVertex?.(index);
                                        }}
                                        onDragStart={(e) => {
                                            e.cancelBubble = true;
                                            onSelectVertex?.(index);
                                            if (isDraggingRef) isDraggingRef.current = true;
                                        }}
                                        onDragEnd={(e) => {
                                            if (isDraggingRef) isDraggingRef.current = false;
                                            onMoveVertex?.(index, { x: e.target.x(), y: e.target.y() });
                                        }}
                                    />
                                );
                            });
                        })()}

                        {(isShapePlacing || isObjectPlacement || isTemplatePlacing) && ghostPos && (
                            isObjectPlacement ? (
                                <Group listening={false}>
                                    <Rect
                                        x={ghostPos.x - ((ghostPos.width || 40) / 2)}
                                        y={ghostPos.y - ((ghostPos.height || 40) / 2)}
                                        width={ghostPos.width || 40}
                                        height={ghostPos.height || 40}
                                        cornerRadius={4}
                                        fill={placementItem?.fill || "#8B5CF6"}
                                        opacity={ghostPos.valid ? 0.55 : 0.25}
                                        stroke={ghostPos.valid ? "#22c55e" : "#ef4444"}
                                        strokeWidth={2}
                                        dash={[6, 4]}
                                    />
                                    <Text
                                        x={ghostPos.x - ((ghostPos.width || 40) / 2)}
                                        y={ghostPos.y - ((ghostPos.height || 40) / 2) - 16}
                                        text={ghostPos.valid ? placementItem?.name || "Place object" : "Select a room"}
                                        fontSize={11}
                                        fill={ghostPos.valid ? "#22c55e" : "#ef4444"}
                                        width={Math.max(ghostPos.width || 40, 80)}
                                        align="center"
                                    />
                                </Group>
                            ) : isTemplatePlacing && ghostPos.points ? (
                                <Group x={ghostPos.x} y={ghostPos.y} opacity={0.55} listening={false}>
                                    <Line
                                        points={ghostPos.points.flat()}
                                        closed
                                        fill="#6366f1"
                                        stroke="#00d4ff"
                                        strokeWidth={2}
                                        dash={[7, 5]}
                                    />
                                    <Text
                                        x={0}
                                        y={-18}
                                        text={pendingPlacement.template?.name || "Template"}
                                        fontSize={11}
                                        fill="#00d4ff"
                                        width={Math.max(ghostPos.width || 80, 80)}
                                        align="center"
                                    />
                                </Group>
                            ) : (
                                <Group x={ghostPos.x - ((ghostPos.width || 100) / 2)} y={ghostPos.y - ((ghostPos.height || 80) / 2)} opacity={0.5} listening={false}>
                                    {pendingPlacement.type === "circle" ? (
                                        <Circle x={50} y={50} radius={50} fill="#6366f1" stroke="#00d4ff" strokeWidth={2} dash={[7, 5]} />
                                    ) : pendingPlacement.sides ? (
                                        <Line points={polygonPoints(pendingPlacement.sides, 50, 50, 50)} closed fill="#6366f1" stroke="#00d4ff" strokeWidth={2} dash={[7, 5]} />
                                    ) : (
                                        <Rect width={ghostPos.width || 100} height={ghostPos.height || 80} cornerRadius={6} fill="#6366f1" stroke="#00d4ff" strokeWidth={2} dash={[7, 5]} />
                                    )}
                                </Group>
                            )
                        )}

                        {(activeTool?.type === "polygon" || isPolygonPlacing) && polyVerts.length > 0 && (
                            <>
                                <Line
                                    points={polyVerts.length > 1
                                        ? polyVerts.slice(0, -1).flatMap((v, i) => [v.x, v.y, polyVerts[i + 1].x, polyVerts[i + 1].y]).concat(polyCursor ? [polyVerts[polyVerts.length - 1].x, polyVerts[polyVerts.length - 1].y, polyCursor.x, polyCursor.y] : [])
                                        : (polyCursor ? [polyVerts[0].x, polyVerts[0].y, polyCursor.x, polyCursor.y] : [])}
                                    stroke="#00d4ff" strokeWidth={2} dash={[6, 4]} listening={false}
                                />
                                {polyVerts.map((v, i) => (
                                    <Circle key={`pv-${i}`} x={v.x} y={v.y}
                                        radius={i === 0 && polyVerts.length >= 3 ? 7 : 4}
                                        fill={i === 0 ? "#00d4ff" : "#fff"}
                                        stroke="#00d4ff" strokeWidth={2} listening={false} />
                                ))}
                            </>
                        )}

                        {lines.map(line => (
                            <Line key={`l-${line.id}`} points={line.points} stroke={line.color} strokeWidth={line.width}
                                draggable={line.draggable}
                                onDragEnd={(e) => {
                                    const dx = e.target.x() / scaleRef.current;
                                    const dy = e.target.y() / scaleRef.current;
                                    setLines(prev => prev.map(l => l.id === line.id ? { ...l, points: l.points.map((p, i) => i % 2 === 0 ? p + dx : p + dy) } : l));
                                    e.target.position({ x: 0, y: 0 });
                                }} />
                        ))}
                        {handleEnds?.length > 0 && handleEnds.map(({ start, end, lineColor }, i) => (
                            lines[i] && <React.Fragment key={`h-${i}`}>
                                <Circle x={start[0]} y={start[1]} radius={8 / scaleRef.current} fill={activeTool?.color} stroke={lineColor}
                                    strokeWidth={activeTool?.width} draggable onDragMove={(e) => handleAnchorDrag(e, lines[i].id, 0)} />
                                <Circle x={end[0]} y={end[1]} radius={8 / scaleRef.current} fill={activeTool?.color} stroke={lineColor}
                                    strokeWidth={activeTool?.width} draggable onDragMove={(e) => handleAnchorDrag(e, lines[i].id, 1)} />
                            </React.Fragment>
                        ))}
                        {texts.map(t => (
                            <Text key={`t-${t.id}`} x={t.x} y={t.y} text={t.text} fontSize={t.fontSize} fill={t.color} draggable
                                onDblClick={(e) => {
                                    const absPos = e.target.getAbsolutePosition();
                                    setEditingText({ id: t.id, x: absPos.x, y: absPos.y, value: t.text });
                                }} />
                        ))}
                        {activeTool?.type === "eraser" && cursor?.x && (
                            <Circle x={cursor.x} y={cursor.y} radius={activeTool.radius} stroke="rgba(255,0,0,0.2)" />
                        )}
                        {stage !== "sections" && (
                            <Transformer ref={transformerRef}
                                rotateEnabled={true}
                                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center", "middle-left", "middle-right"]}
                                borderStroke="#fff"
                                borderStrokeWidth={1.5}
                                anchorFill="#6366f1"
                                anchorStroke="#fff"
                                anchorSize={8}
                                rotateAnchorOffset={30}
                                boundBoxFunc={(ob, nb) => {
                                    if (nb.width < 10 || nb.height < 10) return ob;
                                    return nb;
                                }}
                                onTransformEnd={(e) => {
                                    const node = e.target;
                                    if (!selectedShapeId) { node.scaleX(1); node.scaleY(1); return; }
                                    const shape = (projectedElements || elements || []).find(s => s.id === selectedShapeId);
                                    if (!shape) { node.scaleX(1); node.scaleY(1); return; }
                                    const sx = node.scaleX(), sy = node.scaleY();
                                    const rotation = node.rotation();
                                    const merged = { ...removeProjectedFields(shape), rotation };
                                    if (shape._isProjected && mapRef?.current) {
                                        const proj = makeProjection(mapRef.current);
                                        if (proj) {
                                            const nodeX = node.x();
                                            const nodeY = node.y();
                                            const absSx = Math.abs(sx) || 1;
                                            const absSy = Math.abs(sy) || 1;
                                            if (getShapeRenderType(shape) === "polygon" && Array.isArray(shape._points) && shape._points.length >= 3) {
                                                const screenPoints = shape._points.map(([px, py]) => [nodeX + px * sx, nodeY + py * sy]);
                                                const bounds = getPointBounds(screenPoints);
                                                const nextWidth = Math.max(bounds.maxX - bounds.minX, 1);
                                                const nextHeight = Math.max(bounds.maxY - bounds.minY, 1);
                                                const measured = measureScreenBox(proj, bounds.minX, bounds.minY, nextWidth, nextHeight);
                                                merged.lat = measured.center.lat;
                                                merged.lng = measured.center.lng;
                                                const nextPointsGeo = screenPoints.map(([px, py]) => {
                                                    const p = proj.unproject(px, py);
                                                    return [p.lat, p.lng];
                                                });
                                                merged.points = nextPointsGeo;
                                                merged.pointsGeo = nextPointsGeo.map(point => [...point]);
                                                merged.widthMeters = measured.widthMeters;
                                                merged.heightMeters = measured.heightMeters;
                                                delete merged.width;
                                                delete merged.height;
                                                onUpdateShape(merged);
                                                node.scaleX(1); node.scaleY(1);
                                                return;
                                            }

                                            const nextWidth = Math.max(10, (shape.width || 120) * absSx);
                                            const nextHeight = Math.max(10, (shape.height || 80) * absSy);
                                            const measured = measureScreenBox(proj, nodeX, nodeY, nextWidth, nextHeight);
                                            merged.lat = measured.center.lat;
                                            merged.lng = measured.center.lng;
                                            merged.widthMeters = measured.widthMeters;
                                            merged.heightMeters = measured.heightMeters;
                                            delete merged.width;
                                            delete merged.height;
                                            if (shape.radius !== undefined || shape.sides) {
                                                merged.radiusMeters = Math.min(measured.widthMeters, measured.heightMeters) / 2;
                                                delete merged.radius;
                                            }
                                            onUpdateShape(merged);
                                            node.scaleX(1); node.scaleY(1);
                                            return;
                                        }
                                    }
                                    if (shape.radius !== undefined || shape.sides) {
                                        const avg = (Math.abs(sx) + Math.abs(sy)) / 2;
                                        merged.radius = Math.max(10, (shape.radius || 50) * (avg || 1));
                                    } else {
                                        merged.width = Math.max(10, (shape.width || 120) * Math.abs(sx));
                                        merged.height = Math.max(10, (shape.height || 80) * Math.abs(sy));
                                    }
                                    onUpdateShape(merged);
                                    node.scaleX(1); node.scaleY(1);
                                }} />
                        )}
                    </Layer>
                </Stage>
            )}
            {stage === "render3d" && (
                <div
                    className="three-canvas-layer render3d-stage"
                >
                    <ThreeCanvas
                        stage={stage}
                        rooms={renderedElements?.filter(el => el.type === "room" && el.floor_id && el.sectionRole !== "base") || []}
                        objectsData={projectedObjects}
                        selectedObjectId={selectedObjectId}
                        onObjectClick={onSelectObject}
                        onPointerMissed={() => onSelectShape?.(null)}
                    />
                </div>
            )}
            {editingText && <input style={{ position: "absolute", top: editingText.y, left: editingText.x, fontSize: 16, zIndex: 30, border: "1px solid var(--border)", padding: 2 }}
                value={editingText.value} onChange={(e) => setEditingText(prev => ({ ...prev, value: e.target.value }))}
                onBlur={() => {
                    setTexts(prev => prev.map(t => t.id === editingText.id ? { ...t, text: editingText.value } : t));
                    setEditingText(null);
                }} />}
        </div>
    );
}
