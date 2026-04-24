import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { thunkEditPoint } from "../../../redux/points";
import MapLibrePopup from "./MapLibrePopup";
import { ModalButton } from "../../../context/Modal";
import ManagePointsModal from "../../ManagePointsModal";
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
    // Stable refs for event handlers to avoid re-binding MAP listeners
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const canvasObjectsRef = useRef({});
    const markersRef = useRef({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [cursor, setCursor] = useState("grab");
    const settings = useSelector(state => state.settings);
    // Track previous text size to avoid redundant layout churn
    const lastSettingsRef = useRef(settings);

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
            const img = document.createElement("img");
            img.src = icon;
            img.style.width = "24px";
            img.style.height = "24px";
            img.style.display = "block";
            iconDiv.appendChild(img);
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
        const map = mapInstance.current;
        if (!map) return;

        let iconUrl = tool.icon;
        let type = tool.type || "icon";
        if (type === "home") iconUrl = "/icons/home-point.svg";
        else if (type === "apartment") iconUrl = "/icons/building-point.svg";
        else if (type === "unit") iconUrl = "/icons/unit-point.svg";
        else if (type === "icon") iconUrl = "/icons/geo-alt-fill.svg";

        else if (type === "marker") iconUrl = "/icons/geo-alt-fill.svg";

        const markerName = tool.name || "Marker";
        const markerId = `temp-${type}-${Date.now()}`;
        const { iconDiv, labelDiv } = templateElements({ icon: iconUrl, name: markerName, type });
        iconDiv.appendChild(labelDiv); // Markers/Icons/Props have label appended
        const marker = new maplibregl.Marker({ element: iconDiv, draggable: true })
            .setLngLat([lng, lat])
            .addTo(map);

        const payload = { 
            id: markerId, type, 
            name: markerName, 
            icon: iconUrl, 
            lng: lng, lat: lat 
        };

        marker.on("dragend", () => {
            const pos = marker.getLngLat();
            createdCanvasObjectRef.current?.({ ...payload, lng: pos.lng, lat: pos.lat });
        });

        if (String(markerId).startsWith('temp-')) {
            createdCanvasObject({ ...payload, lng, lat });
        }
        canvasObjectsRef.current[markerId] = { marker };
    }, [templateElements, createdCanvasObject]);

    const createRadiusTool = useCallback((lng, lat, initialRadius = 500, existingId = null, existingName = null) => {
        const map = mapInstance.current;
        if (!map) return;
        const radiusId = existingId || `temp-radius-${Date.now()}`;
        let radius = initialRadius;
        const radiusName = existingName || "";
        
        const centerId = `${radiusId}-center`;
        const handleId = `${radiusId}-handle`;

        // Safety: Remove if they somehow exist to avoid "Source already exists"
        [radiusId, centerId, handleId].forEach(sId => {
            if (map.getLayer(sId)) map.removeLayer(sId);
            if (map.getSource(sId)) map.removeSource(sId);
        });

        const handlePos = getHandlePosition(lng, lat, radius);

        map.addSource(centerId, { type: "geojson", data: { type: "Feature", properties: { id: radiusId, part: "center" }, geometry: { type: "Point", coordinates: [lng, lat] } } });
        map.addSource(handleId, { type: "geojson", data: { type: "Feature", properties: { id: radiusId, part: "handle" }, geometry: { type: "Point", coordinates: [handlePos.lng, handlePos.lat] } } });
        map.addSource(radiusId, { type: "geojson", data: createRadiusData(lng, lat, radius, handlePos.lng, handlePos.lat, radiusId) });

        map.addLayer({ id: radiusId, type: "fill", source: radiusId, paint: { "fill-color": "#8B5CF6", "fill-opacity": 0.15 } });
        map.addLayer({ id: `${radiusId}-outline`, type: "line", source: radiusId, paint: { "line-color": "#8B5CF6", "line-width": 2, "line-dasharray": [2, 2] } });
        map.addLayer({ id: `${centerId}-layer`, type: "circle", source: centerId, paint: { "circle-radius": 6, "circle-color": "#8B5CF6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });
        map.addLayer({ id: `${handleId}-layer`, type: "circle", source: handleId, paint: { "circle-radius": 6, "circle-color": "#fff", "circle-stroke-width": 2, "circle-stroke-color": "#8B5CF6" } });

        const { labelDiv } = templateElements();
        const labelMarker = new maplibregl.Marker({ element: labelDiv, anchor: "top" }).setLngLat([lng, lat]).addTo(map);

        const sync = (isInit = false) => {
            const centerSource = map.getSource(centerId);
            const handleSource = map.getSource(handleId);
            if (!centerSource || !handleSource) return;

            const cData = centerSource.serialize().data;
            const hData = handleSource.serialize().data;
            if (!cData || !hData || !cData.geometry || !hData.geometry) return;

            const c = cData.geometry.coordinates;
            const h = hData.geometry.coordinates;
            const r = mercatorDistance(c[0], c[1], h[0], h[1]);
            const radiusVal = r > 1000 ? `${(r/1000 * 2).toFixed(2)}km` : `${Math.round(r * 2)}m`;
            labelDiv.innerText = radiusName ? `${radiusName}\nDia: ${radiusVal}` : `Dia: ${radiusVal}`;
            labelMarker.setLngLat([c[0], c[1]]);
            map.getSource(radiusId).setData(createRadiusData(c[0], c[1], r, h[0], h[1], radiusId));
            
            return r;
        };

        markersRef.current[radiusId] = { sourceId: radiusId, centerId, handleId, labelMarker, sync };
        sync(true); // Show diameter immediately without triggering feedback
        if (radiusId.startsWith("temp-")) {
            createdCanvasObject({ id: radiusId, type: "radius", name: radiusName, lng, lat, radius });
        }
    }, [templateElements, createdCanvasObject]);

    const createLineTool = useCallback((lng, lat, endLng = null, endLat = null, existingId = null, existingName = null) => {
        const map = mapInstance.current;
        if (!map) return;
        const lineId = existingId || `temp-line-${Date.now()}`;
        const lineName = existingName || "";
        
        let endPos;
        if (endLng && endLat) {
            endPos = { lng: endLng, lat: endLat };
        } else {
            const { x, y } = lngLatToMercator(lng, lat);
            endPos = mercatorToLngLat(x + 500, y);
        }

        const startId = `${lineId}-start`;
        const endId = `${lineId}-end`;

        // Safety: Remove if they somehow exist to avoid "Source already exists"
        [lineId, startId, endId].forEach(sId => {
            if (map.getLayer(sId)) map.removeLayer(sId);
            if (map.getSource(sId)) map.removeSource(sId);
        });

        map.addSource(startId, { type: "geojson", data: { type: "Feature", properties: { id: lineId, part: "start" }, geometry: { type: "Point", coordinates: [lng, lat] } } });
        map.addSource(endId, { type: "geojson", data: { type: "Feature", properties: { id: lineId, part: "end" }, geometry: { type: "Point", coordinates: [endPos.lng, endPos.lat] } } });
        map.addSource(lineId, { type: "geojson", data: createLineData(lng, lat, endPos.lng, endPos.lat, lineId) });

        map.addLayer({ id: lineId, type: "line", source: lineId, paint: { "line-color": "red", "line-width": 4, "line-opacity": 0.6 } });
        map.addLayer({ id: `${startId}-layer`, type: "circle", source: startId, paint: { "circle-radius": 6, "circle-color": "red", "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });
        map.addLayer({ id: `${endId}-layer`, type: "circle", source: endId, paint: { "circle-radius": 6, "circle-color": "red", "circle-stroke-width": 2, "circle-stroke-color": "#fff" } });

        const { labelDiv } = templateElements();
        const labelMarker = new maplibregl.Marker({ element: labelDiv, anchor: "bottom" }).setLngLat([(lng + endPos.lng) / 2, (lat + endPos.lat) / 2]).addTo(map);

        const sync = (isInit = false) => {
            const startSource = map.getSource(startId);
            const endSource = map.getSource(endId);
            if (!startSource || !endSource) return;

            const startData = startSource.serialize().data;
            const endData = endSource.serialize().data;
            if (!startData || !endData || !startData.geometry || !endData.geometry) return;

            const a = startData.geometry.coordinates;
            const b = endData.geometry.coordinates;
            const d = mercatorDistance(a[0], a[1], b[0], b[1]);
            const distVal = d > 1000 ? `${(d/1000).toFixed(2)}km` : `${Math.round(d)}m`;
            labelDiv.innerText = lineName ? `${lineName}\n${distVal}` : distVal;
            labelMarker.setLngLat([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
            map.getSource(lineId).setData(createLineData(a[0], a[1], b[0], b[1], lineId));
            
            return d;
        };

        markersRef.current[lineId] = { sourceId: lineId, startId, endId, labelMarker, sync };
        sync(true); // Show length immediately without pushing to modified state
        if (lineId.startsWith("temp-")) {
            createdCanvasObject({ id: lineId, type: "line", name: lineName, lng, lat, endLng: endPos.lng, endLat: endPos.lat });
        }
    }, [templateElements, createdCanvasObject]);

    useEffect(()=> {
        if(mapInstance.current || !mapRef.current || isLoaded) return;

        const initialCenter = lngLat ?? [-83.5, 32.9];
        
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
                        tiles: [
                            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        ],
                        tileSize: 256
                    },
                    satellite: {
                        type: "raster",
                        tiles: [
                            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"           
                        ],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: "osm-layer",
                        type: "raster",
                        source: "osm",
                        layout: { visibility: "visible" }
                    },
                    {
                        id: "satellite-layer",
                        type: "raster",
                        source: "satellite",
                        layout: { visibility: "none" }
                    }
                ]
            }
        });

        // CRITICAL: Set instance immediately to prevent leaks during fast HMR/re-renders
        mapInstance.current = map;

        map.on("load", () => {
            if (mapInstance.current !== map) return; // Prevent old instances from running on dead maps
            // Initialize shared GeoJSON sources for high-performance bulk rendering
            map.addSource("markers-source", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] }
            });

            // Load custom icons sequentially to ensure registration
            const icons = [
                { name: 'home', path: '/icons/home-point.svg' },
                { name: 'apartment', path: '/icons/building-point.svg' },
                { name: 'unit', path: '/icons/unit-point.svg' },
                { name: 'marker', path: '/icons/geo-alt-fill.svg' },
                { name: 'radius', path: '/icons/radius.svg' },
            ];
            
            // Load icons — using Image object for maximum SVG compatibility
            const loadIcon = (name, url) => new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    if (mapInstance.current === map && !map.hasImage(name)) {
                        map.addImage(name, img);
                        console.log(`MAP: Registered icon "${name}"`);
                    }
                    resolve();
                };
                img.onerror = (err) => {
                    console.error(`MAP: Failed to load icon "${name}" from ${url}`, err);
                    resolve();
                };
                img.src = url;
            });

            Promise.all(icons.map(icon => loadIcon(icon.name, icon.path))).then(() => {
                if (mapInstance.current !== map) return;
                console.log("MAP: All icons processed. Creating layers...");
                map.addLayer({
                    id: "props-layer",
                    type: "circle",
                    source: "markers-source",
                    filter: ["==", ["get", "pointType"], "property"],
                    paint: {
                        "circle-radius": 10,
                        "circle-color": "#E53E3E",
                        "circle-stroke-color": "#fff",
                        "circle-stroke-width": 2,
                        "circle-opacity": 0.9
                    }
                });



                // Labels for properties only
                map.addLayer({
                    id: "props-labels-layer",
                    type: "symbol",
                    source: "markers-source",
                    filter: ["==", ["get", "pointType"], "property"],
                    layout: {
                        "text-field": ["get", "name"],
                        "text-size": 11,
                        "text-offset": [0, -1.8],
                        "text-anchor": "bottom",
                        "text-optional": true
                    },
                    paint: {
                        "text-color": "#fff",
                        "text-halo-color": "rgba(0,0,0,0.6)",
                        "text-halo-width": 1.5
                    }
                });

                setIsLoaded(true);
            });

            // Unified click handler - registered ONCE on the map.on("load") event
            map.on("click", (e) => {
                if (mapInstance.current !== map) return;
                
                // 1. Check for markers under click
                const features = map.queryRenderedFeatures(e.point).filter(f => f.properties && f.properties.id);

                if (features.length > 0) {
                    const feat = features[0];
                    const markerId = feat.properties.id;
                    const meta = getMetadataRef.current?.(markerId);
                    if (meta) {
                        onSelectRef.current?.(meta);
                        return; // Exit
                    }
                }

                // 2. Handle placement or closure
                if (canvasToolRef.current?.type) {
                    const tool = canvasToolRef.current;
                    const { lng, lat } = e.lngLat;
                    
                    if (["marker", "home", "apartment", "unit"].includes(tool.type)) {
                        createPointMarker(lng, lat, tool);
                    } else if (tool.type === "radius") {
                        createRadiusTool(lng, lat);
                    } else if (tool.type === "line") {
                        createLineTool(lng, lat);
                    }
                } else {
                    onCloseSidebarRef.current?.();
                }
            });



                // Expose for external drag engine


                // Expose for external drag engine

            let isDragging = false;
            let draggedFeatureId = null;
            let draggedPart = null;

            map.on("mousedown", (e) => {
                const allFeats = map.queryRenderedFeatures(e.point).filter(f => f.properties && f.properties.id);

                if (allFeats.length > 0) {
                    const feat = allFeats[0];
                    if (feat.properties.id) {
                        e.preventDefault();
                        isDragging = true;
                        draggedFeatureId = feat.properties.id;
                        draggedPart = feat.properties.part || null;
                        map.dragPan.disable();
                    }
                }
            });

            map.on("mousemove", (e) => {
                if (!isDragging || !draggedFeatureId) return;

                const newLngLat = [e.lngLat.lng, e.lngLat.lat];

                // 1. Check if we are dragging a Measurement Handle
                const measure = markersRef.current[draggedFeatureId];
                if (measure && draggedPart) {
                    const sourceId = `${draggedFeatureId}-${draggedPart}`;
                    const source = map.getSource(sourceId);
                    if (source) {
                        source.setData({ type: "Feature", properties: { id: draggedFeatureId, part: draggedPart }, geometry: { type: "Point", coordinates: newLngLat } });
                        
                        // Trigger recalculation
                        if (measure.sync) measure.sync();
                    }
                    return;
                }

                // 2. Default Point Dragging
                const source = map.getSource("points-source");
                if (!source) return;
                const data = source.serialize().data;
                const feature = data.features.find(f => f.properties.id === draggedFeatureId);
                if (feature) {
                    feature.geometry.coordinates = newLngLat;
                    source.setData(data);
                }
            });

            map.on("mouseup", (e) => {
                if (isDragging && draggedFeatureId) {
                    const m = markersRef.current[draggedFeatureId];
                    if (m && m.sync) {
                        const mData = getMetadataRef.current?.(draggedFeatureId);
                        if (mData) {
                            if (mData.type === "radius") {
                                const cSource = map.getSource(`${draggedFeatureId}-center`);
                                const hSource = map.getSource(`${draggedFeatureId}-handle`);
                                const c = cSource.serialize().data.geometry.coordinates;
                                const h = hSource.serialize().data.geometry.coordinates;
                                const r = mercatorDistance(c[0], c[1], h[0], h[1]);
                                createdCanvasObjectRef.current?.({ ...mData, lng: c[0], lat: c[1], radius: r });
                            } else if (mData.type === "line") {
                                const sSource = map.getSource(`${draggedFeatureId}-start`);
                                const eSource = map.getSource(`${draggedFeatureId}-end`);
                                const a = sSource.serialize().data.geometry.coordinates;
                                const b = eSource.serialize().data.geometry.coordinates;
                                createdCanvasObjectRef.current?.({ ...mData, lng: a[0], lat: a[1], endLng: b[0], endLat: b[1] });
                            }
                        }
                    }
                    
                    const meta = getMetadataRef.current?.(draggedFeatureId);
                    if (meta && !m?.sync) {
                        const pos = [e.lngLat.lng, e.lngLat.lat];
                        createdCanvasObjectRef.current?.({ ...meta, lng: pos[0], lat: pos[1], lngLat: pos });
                    }
                }
                isDragging = false;
                draggedFeatureId = null;
                draggedPart = null;
                map.dragPan.enable();
            });

            ["props-layer", "points-layer", "points-circle-layer"].forEach(layerId => {
                map.on("mouseenter", layerId, () => {
                    if (mapInstance.current === map) map.getCanvas().style.cursor = "pointer";
                });
                map.on("mouseleave", layerId, () => { 
                    if (mapInstance.current === map) map.getCanvas().style.cursor = "grab";
                });
            });
        }); // End of map.on("load")

        return () => {
            map.remove();
            if (mapInstance.current === map) {
                mapInstance.current = null;
            }
        };
    }, []);


    // Settings Bridge for measurement tools
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !isLoaded) return;

        // Scale handle circles
        Object.keys(map.style._layers).forEach(layerId => {
            if (layerId.includes("-center-layer") || layerId.includes("-handle-layer") || 
                layerId.includes("-start-layer") || layerId.includes("-end-layer")) {
                map.setPaintProperty(layerId, "circle-radius", 6 * (settings.icon_size / 20));
            }
        });

        // Scale measurement labels
        Object.values(markersRef.current).forEach(m => {
            if (m.labelMarker) {
                m.labelMarker.getElement().style.fontSize = `${settings.text_size}px`;
            }
        });
    }, [settings.icon_size, settings.text_size, isLoaded]);

    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !isLoaded) return;

        ["osm-layer", "satellite-layer"].forEach(choiceLayer => {
            mapInstance.current.setLayoutProperty(
                choiceLayer,
                "visibility",
                choiceLayer === layer ? "visible" : "none"
            );
        });
    }, [layer, isLoaded]);


    useEffect(()=> {
        const map = mapInstance.current;
        if(!map || !isLoaded || !lngLat) return;
        
        // Simple console check – if you see this, the prop reached the component
        console.log("MAP: Flying to", lngLat);

        map.flyTo({
            center: lngLat,
            zoom: 14,
            speed: 1.2,
            curve: 1.42,
            essential: true
        });
    }, [lngLat, isLoaded]);



    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !isLoaded) return;

        // 1. Update Icon Sizes
        // Base SVG is 24px. icon-size 1.0 = 24px.
        const iconScale = settings.icon_size / 24;
        
        if (map.getLayer("points-layer")) {
            map.setLayoutProperty("points-layer", "icon-size", iconScale * 0.85);
            map.setLayoutProperty("points-layer", "text-size", settings.text_size);
        }
        
        if (map.getLayer("props-layer")) {
            map.setPaintProperty("props-layer", "circle-radius", (settings.icon_size / 2) * 0.85);
        }

        if (map.getLayer("props-labels-layer")) {
            map.setLayoutProperty("props-labels-layer", "text-size", settings.text_size);
        }

        lastSettingsRef.current = settings;
    }, [settings.icon_size, settings.text_size, isLoaded]);






    // Unified DOM Marker Pool for all entities (Icons, Properties, Measurement Handles)
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !isLoaded || !markers) return;

        // 1. Identify currently active IDs in the data
        const currentIds = new Set(markers.map(m => String(m.id || m.propertyId || m.pointId || `${(m.type||"marker").toLowerCase()}-${m.pointId || m.id}`)));

        // 2. Cleanup orphaned markers (both properties and tools)
        Object.keys(markersRef.current).forEach(id => {
            if (!currentIds.has(String(id))) {
                const obj = markersRef.current[id];
                if (obj.centerMarker) obj.centerMarker.remove();
                if (obj.handleMarker) obj.handleMarker.remove();
                if (obj.labelMarker) obj.labelMarker.remove();
                if (obj.startMarker) obj.startMarker.remove();
                if (obj.endMarker) obj.endMarker.remove();
                
                // CRITICAL: Remove the primary layer ID itself (no suffix)
                if (map.getLayer(id)) map.removeLayer(id);

                ["-fill", "-outline", "-spoke", "-line", "-start-layer", "-end-layer", "-center-layer", "-handle-layer"].forEach(suffix => {
                    if (map.getLayer(id + suffix)) map.removeLayer(id + suffix);
                });

                // Remove supplemental layers if they were created with sourceId as layerId
                [id, `${id}-start`, `${id}-end`, `${id}-center`, `${id}-handle`].forEach(lId => {
                    if (map.getLayer(lId)) map.removeLayer(lId);
                });

                // Remove supplemental sources AFTER layers are gone
                [id, obj.sourceId, `${id}-start`, `${id}-end`, `${id}-center`, `${id}-handle`].forEach(sId => {
                   if (sId && map.getSource(sId)) map.removeSource(sId);
                });

                delete markersRef.current[id];
            }
        });

        Object.keys(canvasObjectsRef.current).forEach(id => {
            // FIX: removed .startsWith("temp-") check to allow deletion of newly drawn points
            if (!currentIds.has(String(id))) {
                const obj = canvasObjectsRef.current[id];
                if (obj.marker) obj.marker.remove();
                delete canvasObjectsRef.current[id];
            }
        });

        // 3. Sync markers from data to DOM
        markers.forEach(m => {
            const id = String(m.id || `${(m.type||"marker").toLowerCase()}-${m.pointId}`);
            const lng = m.lng ?? m.lngLat?.[0];
            const lat = m.lat ?? m.lngLat?.[1];

            if (m.type === "radius" || m.type === "line") {
                if (!markersRef.current[id]) {
                    if (m.type === "radius") {
                        const rVal = Number(m.extra_info?.radius || m.radius || 500);
                        createRadiusTool(lng, lat, rVal, id, m.name);
                    } else if (m.type === "line") {
                        const eLng = m.extra_info?.endLng || m.endlng || m.endLng;
                        const eLat = m.extra_info?.endLat || m.endlat || m.endLat;
                        createLineTool(lng, lat, eLng, eLat, id, m.name);
                    }
                }
            } else {
                const existing = canvasObjectsRef.current[id];
                if (existing) {
                    existing.marker.setLngLat([lng, lat]);
                } else {
                    let iconUrl = m.icon;
                    let type = (m.type || "marker").toLowerCase();
                    if (type === "icon") type = "marker";
                    if (type === "home" && !iconUrl) iconUrl = "/icons/home-point.svg";
                    else if (type === "apartment" && !iconUrl) iconUrl = "/icons/building-point.svg";
                    else if (type === "unit" && !iconUrl) iconUrl = "/icons/unit-point.svg";
                    else if (!iconUrl) iconUrl = "/icons/geo-alt-fill.svg";

                    // Safety: Basic points (Icons/Homes) - remove if exists to avoid duplication
                    const sId = String(id);
                    if (map.getLayer(sId)) map.removeLayer(sId);
                    if (map.getSource(sId)) map.removeSource(sId);

                    const { iconDiv, labelDiv } = templateElements({ icon: iconUrl, name: m.name || (type === "marker" ? "Marker" : ""), type });
                    iconDiv.appendChild(labelDiv); // Basic points have label appended
                    const marker = new maplibregl.Marker({ element: iconDiv, draggable: true })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    marker.on("dragend", () => {
                        const pos = marker.getLngLat();
                        createdCanvasObjectRef.current?.({ ...m, lng: pos.lng, lat: pos.lat });
                    });

                    marker.getElement().addEventListener("click", (e) => {
                        e.stopPropagation();
                        onSelectRef.current?.(m);
                    });

                    canvasObjectsRef.current[id] = { marker };
                }
            }
        });
    }, [markers, isLoaded, templateElements, createRadiusTool, createLineTool]);

    useEffect(() => {
        if (!mapInstance.current || !isLoaded) return;
        if (canvasTool?.type) {
            updateMapCursor("crosshair");
        } else {
            updateMapCursor("grab");
        }
    }, [canvasTool, isLoaded, updateMapCursor]);

    return (
        <div
            id="map-container"
            className=""
            ref={mapRef}
        />
    );
}
