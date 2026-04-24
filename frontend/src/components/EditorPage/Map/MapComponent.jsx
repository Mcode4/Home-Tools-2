import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import "./MapComponent.css";

const EARTH_R = 6378137;

function lngLatToMercator(lng, lat) {
    const x = lng * Math.PI / 180 * EARTH_R;
    const y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * EARTH_R;
    return { x, y };
}

function mercatorToLngLat(x, y) {
    const lng = x / EARTH_R * 180 / Math.PI;
    const lat = (2 * Math.atan(Math.exp(y / EARTH_R)) - Math.PI / 2) * 180 / Math.PI;
    return { lng, lat };
}

function mercatorDistance(lng1, lat1, lng2, lat2) {
    const a = lngLatToMercator(lng1, lat1);
    const b = lngLatToMercator(lng2, lat2);
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function getHandlePosition(centerLng, centerLat, radiusMeters) {
    const c = lngLatToMercator(centerLng, centerLat);
    return mercatorToLngLat(c.x + radiusMeters, c.y);
}

function createRadiusData(centerLng, centerLat, radiusMeters, handleLng, handleLat, id, steps = 64) {
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

function createLineData(aLng, aLat, bLng, bLat, id) {
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

export default function MapComponent({ 
    layer, lngLat, markers, canvasTool,
    createdCanvasObject, deletedCanvasObject,
    getMetadata, onSelect, onCloseSidebar
}) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const [isLoaded, setIsLoaded] = useState(false);
    const settings = useSelector(state => state.settings);

    const canvasToolRef = useRef(canvasTool);
    const createdCanvasObjectRef = useRef(createdCanvasObject);
    const getMetadataRef = useRef(getMetadata);
    const onSelectRef = useRef(onSelect);
    const onCloseSidebarRef = useRef(onCloseSidebar);

    useEffect(() => { canvasToolRef.current = canvasTool; }, [canvasTool]);
    useEffect(() => { createdCanvasObjectRef.current = createdCanvasObject; }, [createdCanvasObject]);
    useEffect(() => { getMetadataRef.current = getMetadata; }, [getMetadata]);
    useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
    useEffect(() => { onCloseSidebarRef.current = onCloseSidebar; }, [onCloseSidebar]);

    const updateMapCursor = useCallback((cursor) => {
        const map = mapInstance.current;
        if (!map) return;
        const canvas = map.getCanvas();
        if (canvas) canvas.style.cursor = cursor;
    }, []);

    const templateElements = useCallback(({ icon, name, type } = {}) => {
        const textColor = (settings.theme === "light") ? "#111827" : "#f8fafc";
        const textShadow = (settings.theme === "light") 
            ? "0 1px 2px rgba(255,255,255,0.8)" 
            : "0 1px 3px rgba(0,0,0,1)";

        const iconDiv = document.createElement("div");
        iconDiv.className = `map-custom-marker ${type}-marker`;
        if (icon) {
            // EMOJI DETECTION: If not a path/URL, treat as raw text
            const isUrl = icon.startsWith("http") || icon.startsWith("/") || icon.startsWith("data:");
            if (isUrl) {
                const img = document.createElement("img");
                img.src = icon;
                img.style.width = "24px";
                img.style.height = "24px";
                img.style.display = "block";
                iconDiv.appendChild(img);
            } else {
                const span = document.createElement("span");
                span.innerText = icon;
                span.style.fontSize = "20px";
                span.style.display = "flex";
                span.style.alignItems = "center";
                span.style.justifyContent = "center";
                span.style.width = "24px";
                span.style.height = "24px";
                iconDiv.appendChild(span);
            }
        }

        const labelDiv = document.createElement("div");
        labelDiv.className = "map-marker-label";
        labelDiv.innerText = name || "";
        labelDiv.style.color = textColor;
        labelDiv.style.textShadow = textShadow;
        labelDiv.style.marginTop = "2px";

        return { iconDiv, labelDiv };
    }, [settings.theme]);

    const createPointMarker = useCallback((lng, lat, tool) => {
        const markerId = `temp-${tool.type}-${Date.now()}`;
        createdCanvasObjectRef.current?.({ id: markerId, type: tool.type, name: tool.name || "", icon: tool.icon || null, lng, lat, source: "canvas" });
    }, []);

    const createRadiusTool = useCallback((lng, lat, initialRadius = 500, existingId = null, existingName = null, hLng = null, hLat = null) => {
        const map = mapInstance.current;
        if (!map) return;
        const radiusId = existingId || `temp-radius-${Date.now()}`;
        const radiusName = existingName || "";
        const centerId = `${radiusId}-center`;
        const handleId = `${radiusId}-handle`;
        const handlePos = (hLng && hLat) ? { lng: hLng, lat: hLat } : getHandlePosition(lng, lat, initialRadius);

        [radiusId, centerId, handleId].forEach(sId => { if (map.getLayer(sId)) map.removeLayer(sId); if (map.getSource(sId)) map.removeSource(sId); });

        map.addSource(centerId, { type: "geojson", data: { type: "Feature", properties: { id: radiusId, part: "center" }, geometry: { type: "Point", coordinates: [lng, lat] } } });
        map.addSource(handleId, { type: "geojson", data: { type: "Feature", properties: { id: radiusId, part: "handle" }, geometry: { type: "Point", coordinates: [handlePos.lng, handlePos.lat] } } });
        map.addSource(radiusId, { type: "geojson", data: createRadiusData(lng, lat, initialRadius, handlePos.lng, handlePos.lat, radiusId) });

        map.addLayer({ id: radiusId, type: "fill", source: radiusId, paint: { "fill-color": "#8B5CF6", "fill-opacity": 0.15 } });
        map.addLayer({ id: `${radiusId}-outline`, type: "line", source: radiusId, paint: { "line-color": "#8B5CF6", "line-width": 2, "line-dasharray": [2, 2] } });
        map.addLayer({ id: `${centerId}-layer`, type: "circle", source: centerId, paint: { "circle-radius": 6, "circle-color": "#8B5CF6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });
        map.addLayer({ id: `${handleId}-layer`, type: "circle", source: handleId, paint: { "circle-radius": 6, "circle-color": "#fff", "circle-stroke-width": 2, "circle-stroke-color": "#8B5CF6" } });

        const { labelDiv } = templateElements();
        const labelMarker = new maplibregl.Marker({ element: labelDiv, anchor: "top" }).setLngLat([lng, lat]).addTo(map);

        const sync = () => {
            const cSource = map.getSource(centerId), hSource = map.getSource(handleId);
            if (!cSource || !hSource) return;
            const c = cSource.serialize().data.geometry.coordinates, h = hSource.serialize().data.geometry.coordinates;
            const r = mercatorDistance(c[0], c[1], h[0], h[1]);
            const radiusVal = r > 1000 ? `${(r/1000 * 2).toFixed(2)}km` : `${Math.round(r * 2)}m`;
            labelDiv.innerText = radiusName ? `${radiusName}\nDia: ${radiusVal}` : `Dia: ${radiusVal}`;
            labelMarker.setLngLat([c[0], c[1]]);
            map.getSource(radiusId).setData(createRadiusData(c[0], c[1], r, h[0], h[1], radiusId));
        };

        markersRef.current[radiusId] = { type: "radius", centerId, handleId, labelMarker, sync };
        if (!existingId) createdCanvasObjectRef.current?.({ id: radiusId, type: "radius", name: radiusName, lng, lat, radius: initialRadius, handleLng: handlePos.lng, handleLat: handlePos.lat });
    }, [templateElements]);

    const createLineTool = useCallback((lng, lat, endLng = null, endLat = null, existingId = null, existingName = null) => {
        const map = mapInstance.current;
        if (!map) return;
        const lineId = existingId || `temp-line-${Date.now()}`, lineName = existingName || "";
        let endPos = (endLng && endLat) ? { lng: endLng, lat: endLat } : mercatorToLngLat(lngLatToMercator(lng, lat).x + 500, lngLatToMercator(lng, lat).y);
        const startId = `${lineId}-start`, endId = `${lineId}-end`;

        [lineId, startId, endId].forEach(sId => { if (map.getLayer(sId)) map.removeLayer(sId); if (map.getSource(sId)) map.removeSource(sId); });

        map.addSource(startId, { type: "geojson", data: { type: "Feature", properties: { id: lineId, part: "start" }, geometry: { type: "Point", coordinates: [lng, lat] } } });
        map.addSource(endId, { type: "geojson", data: { type: "Feature", properties: { id: lineId, part: "end" }, geometry: { type: "Point", coordinates: [endPos.lng, endPos.lat] } } });
        map.addSource(lineId, { type: "geojson", data: createLineData(lng, lat, endPos.lng, endPos.lat, lineId) });

        map.addLayer({ id: lineId, type: "line", source: lineId, paint: { "line-color": "red", "line-width": 4, "line-opacity": 0.6 } });
        map.addLayer({ id: `${startId}-layer`, type: "circle", source: startId, paint: { "circle-radius": 6, "circle-color": "red", "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });
        map.addLayer({ id: `${endId}-layer`, type: "circle", source: endId, paint: { "circle-radius": 6, "circle-color": "red", "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });

        const { labelDiv } = templateElements();
        const labelMarker = new maplibregl.Marker({ element: labelDiv, anchor: "bottom" }).setLngLat([(lng + endPos.lng) / 2, (lat + endPos.lat) / 2]).addTo(map);

        const sync = () => {
            const sSource = map.getSource(startId), eSource = map.getSource(endId);
            if (!sSource || !eSource) return;
            const a = sSource.serialize().data.geometry.coordinates, b = eSource.serialize().data.geometry.coordinates;
            const d = mercatorDistance(a[0], a[1], b[0], b[1]);
            const distVal = d > 1000 ? `${(d/1000).toFixed(2)}km` : `${Math.round(d)}m`;
            labelDiv.innerText = lineName ? `${lineName}\n${distVal}` : distVal;
            labelMarker.setLngLat([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
            map.getSource(lineId).setData(createLineData(a[0], a[1], b[0], b[1], lineId));
        };

        markersRef.current[lineId] = { type: "line", startId, endId, labelMarker, sync };
        if (!existingId) createdCanvasObjectRef.current?.({ id: lineId, type: "line", name: lineName, lng, lat, endLng: endPos.lng, endLat: endPos.lat });
    }, [templateElements]);

    useEffect(() => {
        if (mapInstance.current || !mapRef.current) return;
        
        let initialCenter = [-83.5, 32.9];
        if (lngLat && Array.isArray(lngLat) && !isNaN(lngLat[0]) && !isNaN(lngLat[1])) {
            initialCenter = lngLat;
        }

        const map = new maplibregl.Map({
            container: mapRef.current,
            center: initialCenter,
            zoom: 6,
            maxZoom: 18,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: "raster",
                        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                        tileSize: 256
                    },
                    satellite: {
                        type: "raster",
                        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                        tileSize: 256
                    }
                },
                layers: [
                    { id: "osm-layer", type: "raster", source: "osm", layout: { visibility: "visible" } },
                    { id: "satellite-layer", type: "raster", source: "satellite", layout: { visibility: "none" } }
                ]
            }
        });
        mapInstance.current = map;
        map.on("load", () => { 
            console.log("MAP: Successfully loaded");
            setIsLoaded(true); 
        });
        
        map.on("error", (e) => {
            console.error("MAP: Fatal initialization error", e);
        });

        map.on("click", (e) => {
            const features = map.queryRenderedFeatures(e.point).filter(f => f.properties?.id);
            if (features.length > 0) { 
                const meta = getMetadataRef.current?.(features[0].properties.id); 
                if (meta) { onSelectRef.current?.(meta); return; } 
            }
            if (canvasToolRef.current?.type) {
                const tool = canvasToolRef.current;
                if (tool.type === "radius") createRadiusTool(e.lngLat.lng, e.lngLat.lat);
                else if (tool.type === "line") createLineTool(e.lngLat.lng, e.lngLat.lat);
                else createPointMarker(e.lngLat.lng, e.lngLat.lat, tool);
            } else { 
                onCloseSidebarRef.current?.(); 
            }
        });

        let isDragging = false, dragId = null, dragPart = null;
        map.on("mousedown", (e) => {
            const feats = map.queryRenderedFeatures(e.point).filter(f => f.properties?.id);
            if (feats.length > 0) { 
                e.preventDefault(); 
                isDragging = true; 
                dragId = feats[0].properties.id; 
                dragPart = feats[0].properties.part; 
                map.dragPan.disable(); 
            }
        });
        map.on("mousemove", (e) => {
            if (!isDragging || !dragId) return;
            const measure = markersRef.current[dragId];
            if (measure && dragPart) {
                const s = map.getSource(`${dragId}-${dragPart}`);
                if (s) { 
                    s.setData({ 
                        type: "Feature", 
                        properties: { id: dragId, part: dragPart }, 
                        geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] } 
                    }); 
                    measure.sync(); 
                }
            }
        });
        map.on("mouseup", (e) => {
            if (isDragging && dragId) {
                const m = markersRef.current[dragId], meta = getMetadataRef.current?.(dragId);
                if (m?.sync && meta) {
                    if (meta.type === "radius") {
                        const c = map.getSource(`${dragId}-center`).serialize().data.geometry.coordinates, h = map.getSource(`${dragId}-handle`).serialize().data.geometry.coordinates;
                        createdCanvasObjectRef.current?.({ ...meta, lng: c[0], lat: c[1], radius: mercatorDistance(c[0], c[1], h[0], h[1]), handleLng: h[0], handleLat: h[1] });
                    } else if (meta.type === "line") {
                        const a = map.getSource(`${dragId}-start`).serialize().data.geometry.coordinates, b = map.getSource(`${dragId}-end`).serialize().data.geometry.coordinates;
                        createdCanvasObjectRef.current?.({ ...meta, lng: a[0], lat: a[1], endLng: b[0], endLat: b[1] });
                    }
                } else if (meta) { 
                    createdCanvasObjectRef.current?.({ ...meta, lng: e.lngLat.lng, lat: e.lngLat.lat }); 
                }
            }
            isDragging = false; dragId = null; dragPart = null; map.dragPan.enable();
        });

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !isLoaded) return;
        ["osm-layer", "satellite-layer"].forEach(lId => { if (map.getLayer(lId)) map.setLayoutProperty(lId, "visibility", lId === layer ? "visible" : "none"); });
    }, [layer, isLoaded]);

    useEffect(() => {
        const map = mapInstance.current;
        if (map && isLoaded && lngLat) map.flyTo({ center: lngLat, zoom: 14 });
    }, [lngLat, isLoaded]);

    const getMId = useCallback((m) => {
        if (m.id && !isNaN(m.id)) { const isProp = ["home", "apartment", "unit"].includes((m.type || "").toLowerCase()); return `${isProp ? "prop" : "point"}-${m.id}`; }
        return String(m.id || `point-${Date.now()}`);
    }, []);

    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !isLoaded || !markers) return;
        const currentIds = new Set(markers.map(m => getMId(m)));
        Object.keys(markersRef.current).forEach(id => {
            if (!currentIds.has(id)) {
                const entry = markersRef.current[id];
                if (entry.marker) entry.marker.remove();
                if (entry.labelMarker) entry.labelMarker.remove();
                [id, `${id}-start`, `${id}-end`, `${id}-center`, `${id}-handle`, `${id}-outline`, `${id}-spoke`].forEach(sid => { if (map.getLayer(sid)) map.removeLayer(sid); if (map.getSource(sid)) map.removeSource(sid); });
                delete markersRef.current[id];
            }
        });
        markers.forEach(m => {
            const id = getMId(m), lng = m.lng || m.lngLat?.[0], lat = m.lat || m.lngLat?.[1];
            if (!lng || !lat) return;
            const existing = markersRef.current[id], type = (m.type || "marker").toLowerCase();
            if (existing && existing.marker) {
                existing.marker.setLngLat([lng, lat]);
                const el = existing.marker.getElement();
                const label = el?.querySelector('.map-marker-label');
                if (label) label.innerText = m.name || "";
            } else if (!existing) {
                if (type === "radius" || type === "line") {
                    if (type === "radius") createRadiusTool(lng, lat, m.radius || 500, id, m.name, m.handleLng, m.handleLat);
                    else createLineTool(lng, lat, m.endLng, m.endLat, id, m.name);
                } else {
                    const iconUrl = m.icon || (type === "home" ? "/icons/home-point.svg" : type === "apartment" ? "/icons/building-point.svg" : type === "unit" ? "/icons/unit-point.svg" : "/icons/geo-alt-fill.svg");
                    const { iconDiv, labelDiv } = templateElements({ icon: iconUrl, name: m.name, type });
                    iconDiv.appendChild(labelDiv);
                    const marker = new maplibregl.Marker({ element: iconDiv, draggable: true }).setLngLat([lng, lat]).addTo(map);
                    marker.on("dragend", () => { const pos = marker.getLngLat(); createdCanvasObjectRef.current?.({ ...m, lng: pos.lng, lat: pos.lat }); });
                    marker.getElement().addEventListener("click", (e) => { e.stopPropagation(); onSelectRef.current?.(m); });
                    markersRef.current[id] = { type, marker };
                }
            }
        });
    }, [markers, isLoaded, templateElements, createRadiusTool, createLineTool, getMId]);

    useEffect(() => { updateMapCursor(canvasTool?.type ? "crosshair" : "grab"); }, [canvasTool, updateMapCursor]);

    return <div id="map-container" ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />;
}
