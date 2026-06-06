import { useState, useEffect, useRef, useCallback } from "react";
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
import { booleanUnion, booleanSubtract, booleanIntersect } from "../../functions/booleanOps";
import { validateOutlines } from "../../functions/outlineValidation";
import { getOutlineArea, getOutlinePerimeter } from "../../functions/outlineValidation";
import { handleSearchAddress as handleSearchAddressNominatim, reverseLookupAddress } from "../../functions/nominatim";
import * as turf from "@turf/turf";
import "./RenderPage.css"

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

function pointToLineDistance(point, lineStart, lineEnd) {
    const x = point[0], y = point[1];
    const x1 = lineStart[0], y1 = lineStart[1];
    const x2 = lineEnd[0], y2 = lineEnd[1];

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
        xx = x1; yy = y1;
    } else if (param > 1) {
        xx = x2; yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function clonePoints(points) {
    return Array.isArray(points) ? points.map(point => Array.isArray(point) ? [...point] : point) : undefined;
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
    }, [handleSaveAll, id, outlines, objects, outlineHistory, saveObjects]);

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
    const [vertexMode, setVertexMode] = useState(false);
    const [selectedVertexIndex, setSelectedVertexIndex] = useState(-1);
    const [validationResults, setValidationResults] = useState({ isValid: true, warnings: [], measurements: [] });
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pendingGeocode, setPendingGeocode] = useState(null);
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
        if (ctrlKey) {
            setMultiSelectIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
            setSelectedShapeId(prev => prev === id ? null : id);
        } else {
            setMultiSelectIds([]);
            setSelectedShapeId(id);
        }
    }, []);

    const handleMultiSelectClear = useCallback(() => {
        setMultiSelectIds([]);
    }, []);

    const handleBooleanOp = useCallback((opType) => {
        if (multiSelectIds.length < 2) return;
        const outlinesA = outlines.filter(o => multiSelectIds.includes(o.id));
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
            result.id = newId;
            setOutlines(prev => [...prev.filter(o => !multiSelectIds.includes(o.id)), result]);
            setMultiSelectIds([]);
            setSelectedShapeId(newId);
        }
    }, [multiSelectIds, outlines, setOutlines]);

    const handleToggleVertexMode = useCallback(() => {
        setVertexMode(prev => !prev);
        if (!vertexMode) {
            setSelectedVertexIndex(-1);
        }
    }, [vertexMode]);

    const addShape = useCallback((shapeData) => {
        const id = `shape-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        if (stage === "outline" && mapRef.current) {
            const dims = getShapePixelDimensions(shapeData);
            const geo = screenToGeo(shapeData.x ?? 300, shapeData.y ?? 200, dims.width, dims.height);
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
                        const p = proj.unproject((shapeData.x ?? 0) + nx, (shapeData.y ?? 0) + ny);
                        return [p.lat, p.lng];
                    });
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

    const handleAddVertex = useCallback((point) => {
        if (!selectedShapeId) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        if (!outline || !Array.isArray(outline.points) || outline.points.length < 3) return;

        let minDist = Infinity;
        let insertIndex = -1;

        for (let i = 0; i < outline.points.length; i++) {
            const p1 = outline.points[i];
            const p2 = outline.points[(i + 1) % outline.points.length];
            const dist = pointToLineDistance(point, p1, p2);
            if (dist < minDist && dist < 15) {
                minDist = dist;
                insertIndex = i + 1;
            }
        }

        if (insertIndex >= 0) {
            const newPoints = [...outline.points];
            newPoints.splice(insertIndex, 0, point);
            updateShape({ ...outline, points: newPoints });
        }
    }, [selectedShapeId, outlines, updateShape]);

    const handleRemoveVertex = useCallback(() => {
        if (!selectedShapeId || selectedVertexIndex < 0) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        if (!outline || !Array.isArray(outline.points) || outline.points.length <= 3) return;

        const newPoints = outline.points.filter((_, i) => i !== selectedVertexIndex);
        updateShape({ ...outline, points: newPoints });
        setSelectedVertexIndex(-1);
    }, [selectedShapeId, selectedVertexIndex, outlines, updateShape]);

    const handleChamfer = useCallback(() => {
        if (!selectedShapeId || selectedVertexIndex < 0) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        if (!outline || !Array.isArray(outline.points) || outline.points.length < 3) return;

        const chamferDist = 10;
        const points = [...outline.points];
        const idx = selectedVertexIndex;
        const prevIdx = (idx - 1 + points.length) % points.length;
        const nextIdx = (idx + 1) % points.length;

        const v = points[idx];
        const vPrev = points[prevIdx];
        const vNext = points[nextIdx];

        const dir1 = [v[0] - vPrev[0], v[1] - vPrev[1]];
        const dir2 = [vNext[0] - v[0], vNext[1] - v[1]];
        const len1 = Math.hypot(dir1[0], dir1[1]);
        const len2 = Math.hypot(dir2[0], dir2[1]);
        if (len1 === 0 || len2 === 0) return;

        const chamfer1 = [v[0] - (dir1[0] / len1) * chamferDist, v[1] - (dir1[1] / len1) * chamferDist];
        const chamfer2 = [v[0] + (dir2[0] / len2) * chamferDist, v[1] + (dir2[1] / len2) * chamferDist];

        points.splice(idx, 1, chamfer1, chamfer2);
        updateShape({ ...outline, points });
        setSelectedVertexIndex(idx + 1);
    }, [selectedShapeId, selectedVertexIndex, outlines, updateShape]);

    const handleFillet = useCallback(() => {
        if (!selectedShapeId || selectedVertexIndex < 0) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        if (!outline || !Array.isArray(outline.points) || outline.points.length < 3) return;

        const filletDist = 10;
        const points = [...outline.points];
        const idx = selectedVertexIndex;
        const prevIdx = (idx - 1 + points.length) % points.length;
        const nextIdx = (idx + 1) % points.length;

        const v = points[idx];
        const vPrev = points[prevIdx];
        const vNext = points[nextIdx];

        const dir1 = [v[0] - vPrev[0], v[1] - vPrev[1]];
        const dir2 = [vNext[0] - v[0], vNext[1] - v[1]];
        const len1 = Math.hypot(dir1[0], dir1[1]);
        const len2 = Math.hypot(dir2[0], dir2[1]);
        if (len1 === 0 || len2 === 0) return;

        const p1 = [v[0] - (dir1[0] / len1) * filletDist, v[1] - (dir1[1] / len1) * filletDist];
        const p2 = [v[0] + (dir2[0] / len2) * filletDist, v[1] + (dir2[1] / len2) * filletDist];

        points.splice(idx, 1, v, p1, p2);
        updateShape({ ...outline, points });
        setSelectedVertexIndex(idx + 2);
    }, [selectedShapeId, selectedVertexIndex, outlines, updateShape]);

    const onBooleanOp = handleBooleanOp;

    const onShowOffset = useCallback(() => {
        setShowOffset(prev => !prev);
    }, []);

    const handleOffset = useCallback((distanceMeters) => {
        if (!selectedShapeId || !mapRef.current) return;
        const outline = outlines.find(o => o.id === selectedShapeId);
        if (!outline) return;

        const proj = makeProjection(mapRef.current);
        if (!proj) return;

        try {
            let points = [];
            if (Array.isArray(outline.points)) {
                points = outline.points.map(([nx, ny]) => proj.project(
                    proj.unproject(nx, ny).lng,
                    proj.unproject(nx, ny).lat
                ).then(p => [p.x, p.y])); // This won't work directly, need different approach
            } else if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
                const center = proj.project(outline.lng, outline.lat);
                const halfW = proj.metersToPxX(outline.widthMeters / 2, outline.lng, outline.lat);
                const halfH = proj.metersToPxY(outline.heightMeters / 2, outline.lng, outline.lat);
                points = [
                    [center.x - halfW, center.y - halfH],
                    [center.x + halfW, center.y - halfH],
                    [center.x + halfW, center.y + halfH],
                    [center.x - halfW, center.y + halfH],
                    [center.x - halfW, center.y - halfH]
                ];
            }

            if (points.length >= 4) {
                const polygon = turf.polygon([points]);
                const buffered = turf.buffer(polygon, distanceMeters, { units: 'meters' });
                const coords = buffered.geometry.coordinates[0];
                const screenPoints = coords.map(([x, y]) => {
                    const ll = proj.unproject(x, y);
                    return [ll.lat, ll.lng];
                });
                const newOutline = {
                    type: "polygon",
                    points: screenPoints.map(([lat, lng]) => {
                        const p = proj.project(lng, lat);
                        return [p.x - coords[0][0], p.y - coords[0][1]];
                    }),
                    lat: screenPoints[0][0],
                    lng: screenPoints[0][1],
                };
                addShape(newOutline);
            }
        } catch (e) {
            console.error("Offset failed:", e);
        }
    }, [selectedShapeId, outlines, addShape, mapRef]);

    const handlePendingPlacement = useCallback((placement) => {
        if (placement?.type === "template") {
            const { templateId, active } = placement;
            if (!active) return;
            try {
                const template = generateTemplate(templateId);
                const shapeData = {
                    type: "polygon",
                    points: template.points,
                    fill: "#6366f1",
                    stroke: "#00d4ff",
                    strokeWidth: 2,
                };
                addShape(shapeData);
                setPendingPlacement(null);
            } catch (e) {
                console.error("Template placement failed:", e);
            }
        }
    }, [addShape]);

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
        handlePendingPlacement(pendingPlacement);
    }, [pendingPlacement, handlePendingPlacement]);

    useEffect(() => {
        if (stage !== "outline" || !outlines.length) return;
        const timer = setTimeout(() => {
            const results = validateOutlines(outlines, { minArea: 1, checkOverlaps: true });
            setValidationResults(results);
        }, 300);
        return () => clearTimeout(timer);
    }, [outlines, stage]);

    const handleSearchAddress = useCallback(async (query) => {
        if (!query || query.length < 3) return;
        setIsSearching(true);
        try {
            const results = await handleSearchAddressNominatim(query);
            setSearchResults(results || []);
        } catch (err) {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSelectResult = useCallback((result) => {
        if (!result || !mapRef.current) return;
        mapRef.current.flyTo({ center: [result.lng, result.lat], zoom: 17 });
        setPendingGeocode(result);
        setSearchResults([]);
    }, []);

    const handlePlaceAtCursor = useCallback(() => {
        if (!pendingGeocode || !mapRef.current) return;
        const { lat, lng } = pendingGeocode;
        addShape({
            type: "rectangle",
            lat, lng,
            widthMeters: 10, heightMeters: 10,
            fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2,
        });
        setPendingGeocode(null);
    }, [pendingGeocode, addShape]);

    const handleReverseGeocode = useCallback(async (screenPoint) => {
        if (!mapRef.current) return;
        const proj = makeProjection(mapRef.current);
        if (!proj) return;
        const ll = proj.unproject(screenPoint.x, screenPoint.y);
        try {
            const result = await reverseLookupAddress(ll.lng, ll.lat);
            if (result) {
                addShape({
                    type: "rectangle",
                    lat: result.lat,
                    lng: result.lng,
                    widthMeters: 10, heightMeters: 10,
                    fill: "#6366f1", stroke: "#00d4ff", strokeWidth: 2,
                });
            }
        } catch (err) {
            console.error("Reverse geocode failed:", err);
        }
    }, [addShape]);

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
    }, [stage, property, mapVersion, screenToGeo]);

    const selectedShape = selectedShapeId
        ? (stage === "outline"
            ? outlines.find(o => o.id === selectedShapeId) || null
            : stagedItems[selectedShapeId] || null)
        : null;

    const handleGridSelect = useCallback(() => {
        setSelectedShapeId(null);
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
            removeItem(selectedShapeId);
        }
        setSelectedShapeId(null);
    }, [selectedShapeId, removeItem, stage, setOutlines]);

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

        const splitX = clampSplit(
            typeof linePos === "object" && linePos?.x != null ? linePos.x : x + Math.round(width / 2),
            x + 10, x + width - 10
        );
        const splitY = clampSplit(
            typeof linePos === "object" && linePos?.y != null ? linePos.y : (typeof linePos === "number" ? linePos : y + Math.round(height / 2)),
            y + 10, y + height - 10
        );

        const geoForRect = (rx, ry, rw, rh) => {
            if (!proj || room.lat == null) return {};
            const centerPt = proj.unproject(rx + rw / 2, ry + rh / 2);
            return {
                lat: centerPt.lat,
                lng: centerPt.lng,
                widthMeters: room.widthMeters ? room.widthMeters * (rw / width) : Math.abs(proj.pxToMetersX(rw, room.lng, room.lat)),
                heightMeters: room.heightMeters ? room.heightMeters * (rh / height) : Math.abs(proj.pxToMetersY(rh, room.lng, room.lat)),
            };
        };

        const makeRoom = (suffix, attrs) => ({
            id: `room-${now}${suffix}`,
            name: "Divided Room",
            type: "room", sectionRole: "split", roomType, floor_id, fill,
            stroke: "#fff", strokeWidth: 2,
            ...attrs,
        });

        const makeDivider = (suffix, line) => ({
            id: `div-${now}${suffix}`,
            type: "divider_line",
            floor_id,
            parent_id: roomId,
            ...line,
            ...geoForDividerLine(proj, line),
        });

        if (splitMode === "both") {
            const leftW = Math.max(10, splitX - x);
            const rightW = Math.max(10, x + width - splitX);
            const topH = Math.max(10, splitY - y);
            const botH = Math.max(10, y + height - splitY);
            newRooms.push(
                makeRoom("tl", { x, y, width: leftW, height: topH, ...geoForRect(x, y, leftW, topH) }),
                makeRoom("tr", { x: splitX, y, width: rightW, height: topH, ...geoForRect(splitX, y, rightW, topH) }),
                makeRoom("bl", { x, y: splitY, width: leftW, height: botH, ...geoForRect(x, splitY, leftW, botH) }),
                makeRoom("br", { x: splitX, y: splitY, width: rightW, height: botH, ...geoForRect(splitX, splitY, rightW, botH) }),
            );
            dividerLines.push(
                makeDivider("h", { x1: x, y1: splitY, x2: x + width, y2: splitY }),
                makeDivider("v", { x1: splitX, y1: y, x2: splitX, y2: y + height }),
            );
        } else if (splitMode === "horizontal") {
            const topH = Math.max(10, splitY - y);
            const botH = Math.max(10, y + height - splitY);
            newRooms.push(
                makeRoom("t", { x, y, width, height: topH, ...geoForRect(x, y, width, topH) }),
                makeRoom("b", { x, y: splitY, width, height: botH, ...geoForRect(x, splitY, width, botH) }),
            );
            dividerLines.push(makeDivider("h", { x1: x, y1: splitY, x2: x + width, y2: splitY }));
        } else if (splitMode === "vertical") {
            const leftW = Math.max(10, splitX - x);
            const rightW = Math.max(10, x + width - splitX);
            newRooms.push(
                makeRoom("l", { x, y, width: leftW, height, ...geoForRect(x, y, leftW, height) }),
                makeRoom("r", { x: splitX, y, width: rightW, height, ...geoForRect(splitX, y, rightW, height) }),
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
    }, [stagedItems, removeItem, addItem]);

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
        const div = screenDivider(sourceDiv, proj);
        const updated = { ...sourceDiv, ...newAttrs };
        if (proj && updated.x1 != null && updated.y1 != null && updated.x2 != null && updated.y2 != null) {
            Object.assign(updated, geoForDividerLine(proj, updated));
        }

        const axis = getDividerAxis(div);
        const floorRooms = Object.values(stagedItems).filter(
            room => isVisibleSectionRoom(room) && room.floor_id === sourceDiv.floor_id
        ).map(room => screenRoom(room, proj));
        const affectedRooms = roomsTouchingDivider(div, floorRooms);
        const roomUpdates = {};

        if (affectedRooms.length >= 2 && axis !== "free") {
            if (axis === "horizontal") {
                const oldSplit = ((div.y1 ?? 0) + (div.y2 ?? 0)) / 2;
                const minY = Math.min(...affectedRooms.map(room => room.y));
                const maxY = Math.max(...affectedRooms.map(room => room.y + room.height));
                const splitY = clampSplit(((updated.y1 ?? 0) + (updated.y2 ?? 0)) / 2, minY + 10, maxY - 10);
                affectedRooms.forEach(room => {
                    const centerY = room.y + room.height / 2;
                    const next = centerY <= oldSplit
                        ? { ...room, height: Math.max(10, splitY - room.y) }
                        : { ...room, y: splitY, height: Math.max(10, room.y + room.height - splitY) };
                    Object.assign(next, geoForScreenRect(proj, next.x, next.y, next.width, next.height));
                    roomUpdates[next.id] = next;
                });
            } else if (axis === "vertical") {
                const oldSplit = ((div.x1 ?? 0) + (div.x2 ?? 0)) / 2;
                const minX = Math.min(...affectedRooms.map(room => room.x));
                const maxX = Math.max(...affectedRooms.map(room => room.x + room.width));
                const splitX = clampSplit(((updated.x1 ?? 0) + (updated.x2 ?? 0)) / 2, minX + 10, maxX - 10);
                affectedRooms.forEach(room => {
                    const centerX = room.x + room.width / 2;
                    const next = centerX <= oldSplit
                        ? { ...room, width: Math.max(10, splitX - room.x) }
                        : { ...room, x: splitX, width: Math.max(10, room.x + room.width - splitX) };
                    Object.assign(next, geoForScreenRect(proj, next.x, next.y, next.width, next.height));
                    roomUpdates[next.id] = next;
                });
            }
        }

        setStagedItems(prev => ({ ...prev, [dividerId]: updated, ...roomUpdates }));
    }, [stagedItems, setStagedItems]);

    const addWallPad = useCallback((wallType, floorId, parentId, point) => {
        if (!floorId) return;
        const parent = stagedItems[parentId] || outlines.find(o => o.id === parentId) || {};
        const id = `wall-${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
        const isSquare = wallType === "wall_square";
        const width = isSquare ? 60 : 120;
        const height = isSquare ? 60 : 6;
        addItem(id, {
            id, name: isSquare ? "Full Wall" : "Section Wall",
            type: "wall", wallType, floor_id: floorId, parent_id: parentId,
            x: point ? point.x - width / 2 : (parent.x || 0) + 20,
            y: point ? point.y - height / 2 : (parent.y || 0) + 20,
            width,
            height,
            fill: isSquare ? "#52525b" : "#d4d4d8",
            stroke: "#111827",
            strokeWidth: 1,
        });
        setSelectedShapeId(id);
    }, [stagedItems, outlines, addItem]);

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
                    onShowOffset={onShowOffset}
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
                            addShape({
                                type: "polygon",
                                points: template.points,
                                fill: "#6366f1",
                                stroke: "#00d4ff",
                                strokeWidth: 2,
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
                    onSearchAddress={handleSearchAddress}
                    searchResults={searchResults}
                    onSelectResult={handleSelectResult}
                    onPlaceAtCursor={handlePlaceAtCursor}
                    isSearching={isSearching}
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
                    onOffset={handleOffset}
                    vertexMode={vertexMode}
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
                        onPlaceShape={addShape}
                        onSplitRoom={splitRoom}
                        onCombineByDivider={combineByDivider}
                        onMoveDividerLine={moveDividerLine}
                        onAddWallPad={addWallPad}
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
