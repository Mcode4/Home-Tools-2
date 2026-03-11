import { useState, useEffect, useRef} from "react";
import { createRoot } from "react-dom/client";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { ModalButton } from "../../../context/Modal";
import ManagePointsModal from "../../ManagePointsModal";
import "./MapComponent.css";


export default function MapComponent({ 
    layer, lngLat, markers, canvasTool,
    createdCanvasObject, deletedCanvasObject,
    updateObject
}) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [propertyState, setPropertyState] = useState({});
    const canvasObjectsRef = useRef({});

    useEffect(()=> {
        const closeMenu = () => {
            hideContextMenu();
        }

        document.addEventListener("click", closeMenu);

        return () => {
            document.removeEventListener("click", hideContextMenu);
        }
    }, [])

    useEffect(()=> {
        if(mapInstance.current || !mapRef.current || isLoaded) return;

        const initialCenter = lngLat ?? [-83.5, 32.9];
        
        const map = new maplibregl.Map({
            container: mapRef.current,
            center: initialCenter,
            zoom: 6,
            // minZoom: 1,
            maxZoom: 18,
            // maxBounds: [
            //     [-130, 20],
            //     [-60, 50]
            // ],
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

        map.on("load", ()=> {
            mapInstance.current = map;
            setIsLoaded(true);
        });

        return () => map.remove();
    }, []);


    useEffect(()=> {
        console.log("HITTT LAYER, LAYER:", layer)
        if(!mapInstance.current || !lngLat || !isLoaded) return;

        ["osm-layer", "satellite-layer"].forEach(choiceLayer => {
            mapInstance.current.setLayoutProperty(
                choiceLayer,
                "visibility",
                choiceLayer === layer ? "visible" : "none"
            );
        });
    }, [layer, isLoaded]);


    useEffect(()=> {
        console.log("HITTT FLYTO, LNGLAT:", lngLat)
        if(!mapInstance.current || !isLoaded) return;

        mapInstance.current.flyTo({
            center: lngLat, // [mapLng, mapLat]
            zoom: 14
        });
    }, [lngLat, isLoaded]);


    useEffect(()=> {
        console.log("HITTT MARKERS, MAPINSTANCE:", mapInstance, "MARKERS:", markers)
        if (!mapInstance.current || !isLoaded || !markers) return;

        const map = mapInstance.current;

        Object.entries(canvasObjectsRef.current).forEach(([id, obj])=> {
            if (obj.marker) obj.marker.remove();
            if (obj.centerMarker) obj.centerMarker.remove();
            if (obj.handleMarker) obj.handleMarker.remove();
            if (obj.labelMarker) obj.labelMarker.remove();
            if (obj.startMarker) obj.startMarker.remove();
            if (obj.endMarker) obj.endMarker.remove();
            if (obj.fillLayer && map.getLayer(obj.fillLayer)) map.removeLayer(obj.fillLayer);
            if (obj.outlineLayer && map.getLayer(obj.outlineLayer)) map.removeLayer(obj.outlineLayer);
            if (obj.spokeLayer && map.getLayer(obj.spokeLayer)) map.removeLayer(obj.spokeLayer);
            if (obj.lineLayer && map.getLayer(obj.lineLayer)) map.removeLayer(obj.lineLayer);
            if (obj.sourceId && map.getSource(obj.sourceId)) map.removeSource(obj.sourceId);
        });
        canvasObjectsRef.current = {};

        markers.map((m, i) => {
            console.log("MARKER AT INDEX:", i, "MARKER:", m)
            if(m.propertyId) {
                const markerId = `prop-${m.propertyId}`;
                const marker = new maplibregl.Marker({
                    color: "red",
                    draggable: true
                })
                    .setLngLat(m.lngLat)
                    .addTo(map);

                const el = marker.getElement();

                el.style.cursor = "cell";

                el.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: markerId
                    })
                });

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    console.log("CHANGING CANVAS OBJ, ID:", markerId)
                    createdCanvasObject({
                        id: markerId,
                        propertyId: m.propertyId,
                        pinned: m.pinned,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat
                    });
                });

                canvasObjectsRef.current[markerId] = {
                    marker
                };
            } else if(m.type === "icon") {
                console.log("MARKER AT ICON", m)
                const iconDiv = document.createElement("div");
                const root = createRoot(iconDiv);
                root.render(
                        <div 
                            className="canvasMarker"
                            style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            <div 
                                className="canvasMarkerIcon"
                                style={{fontSize: "28px"}}
                            >{m.icon}</div>
                            <p className="canvasMarkerName">{m.name}</p>
                        </div>
                    );

                const markerId = m.id ?? `icon-${m.pointId}`;

                const marker = new maplibregl.Marker({
                    element: iconDiv,
                    draggable: true 
                })
                    .setLngLat(m.lngLat)
                    .addTo(map);

                const el = marker.getElement();
                el.style.cursor = "cell";

                el.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: markerId
                    })
                });

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    createdCanvasObject({
                        id: markerId,
                        type: m.type,
                        name: m.name,
                        icon: m.icon,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat
                    });
                });

                canvasObjectsRef.current[markerId] = {
                    marker
                };
                console.log("ICON IMPORTANCE", {marker, el, iconDiv, markerId})
            } else if(m.type === "marker") {
                const markerId = m.id ?? `marker-${m.pointId}`;

                const marker = new maplibregl.Marker({
                    draggable: true,
                    color: "red"
                })
                    .setLngLat(m.lngLat)
                    .addTo(map);

                const el = marker.getElement();
                el.style.cursor = "cell";

                el.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: markerId
                    })
                });

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    createdCanvasObject({
                        id: markerId,
                        pointId: m.pointId,
                        type: m.type,
                        name: m.name,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat
                    });
                });

                canvasObjectsRef.current[markerId] = {
                    marker
                };
            } else if(m.type === "radius") {
                const radiusId = m.id ?? `radius-${m.pointId}`;
                let radius = Number(m.radius ?? 500);

                const centerMarker = new maplibregl.Marker({
                    draggable: true
                })
                    .setLngLat(m.lngLat)
                    .addTo(map);

                const handlePos = getHandlePosition(m.lngLat[0], m.lngLat[1], radius);

                map.addSource(radiusId, {
                    type: "geojson",
                    data: createRadiusData(m.lngLat[0], m.lngLat[1], radius, handlePos.lng, handlePos.lat)
                });

                map.addLayer({
                    id: `${radiusId}-fill`,
                    type: "fill",
                    source: radiusId,
                    filter: ["==", "$type", "Polygon"], 
                    paint: {"fill-color": "#4A90E2", "fill-opacity": 0.25}
                });

                map.addLayer({
                    id: `${radiusId}-outline`,
                    type: "line",
                    source: radiusId,
                    filter: ["==", "$type", "Polygon"], 
                    paint: {"line-color": "#4A90E2", "line-width": 2}
                });

                map.addLayer({
                    id: `${radiusId}-spoke`,
                    type: "line",
                    source: radiusId,
                    filter: ["==", "$type", "LineString"],
                    paint: {"line-color": "#4A90E2", "line-width": 1.5, "line-dasharray": [4,2]}
                })

                const handleMarker = new maplibregl.Marker({
                    draggable: true,
                    color: "blue"
                })
                    .setLngLat([handlePos.lng, handlePos.lat])
                    .addTo(map);

                const labelDiv = document.createElement("div");
                labelDiv.style.background = "white";
                labelDiv.style.padding = "2px 6px";
                labelDiv.style.borderRadius = "4px";
                labelDiv.style.fontSize = "12px";
                labelDiv.style.textAlign = "center";
                labelDiv.style.pointerEvents = "none";
                labelDiv.innerText = radius < 1000 ? `${radius}m` : `${(radius/1000).toFixed(2)}km`;

                const labelMarker = new maplibregl.Marker({
                    element: labelDiv,
                    anchor: "bottom"
                })
                    .setLngLat([handleMarker.getLngLat().lng, handleMarker.getLngLat().lat])
                    .addTo(map)

                handleMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();
                    radius = mercatorDistance(center.lng, center.lat, handle.lng, handle.lat);
                    const newData = createRadiusData(center.lng, center.lat, radius, handle.lng, handle.lat);
                    labelDiv.innerText = radius > 1000 ? `${(radius/1000).toFixed(2)}km` : `${Math.round(radius)}m`;
                    labelMarker.setLngLat([handle.lng, handle.lat]);
                    map.getSource(radiusId).setData(newData);
                });

                centerMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();
                    radius = mercatorDistance(center.lng, center.lat, handle.lng, handle.lat);
                    const newData = createRadiusData(center.lng, center.lat, radius, handle.lng, handle.lat);
                    labelDiv.innerText = radius > 1000 ? `${(radius/1000).toFixed(2)}km` : `${Math.round(radius)}m`;
                    labelMarker.setLngLat([handle.lng, handle.lat]);
                    map.getSource(radiusId).setData(newData);
                });

                const centerEl = centerMarker.getElement();
                const handleEl = handleMarker.getElement();

                centerEl.style.cursor = "cell";
                handleEl.style.cursor = "grab";

                centerEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: radiusId
                    })
                });

                centerMarker.on("dragstart", ()=> map.getCanvas().style.cursor = "grabbing");
                centerMarker.on("dragend", ()=> {
                    map.getCanvas().style.cursor = getBaseCursor();
                    const newLngLat = centerMarker.getLngLat()
                    createdCanvasObject({
                        pointId: radiusId,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat,
                        radius: radius
                    });
                    canvasObjectsRef.current[radiusId].centerMarker = centerMarker;
                    canvasObjectsRef.current[radiusId].radius = radius;
                });

                handleMarker.on("dragstart", ()=> map.getCanvas().style.cursor = "grabbing");
                handleMarker.on("dragend", ()=> {
                    map.getCanvas().style.cursor = getBaseCursor();
                    createdCanvasObject({
                        pointId: radiusId,
                        radius: radius
                    });
                    canvasObjectsRef.current[radiusId].handleMarker = handleMarker;
                    canvasObjectsRef.current[radiusId].labelMarker = labelMarker;
                    canvasObjectsRef.current[radiusId].radius = radius;
                });

                canvasObjectsRef.current[radiusId] = {
                    centerMarker,
                    handleMarker,
                    labelMarker,
                    sourceId: radiusId,
                    fillLayer: `${radiusId}-fill`,
                    outlineLayer: `${radiusId}-outline`,
                    spokeLayer: `${radiusId}-spoke`,
                    radius
                };
            } else if(m.type === "line") {
                const lineId = m.id ?? `line-${m.pointId}`;

                map.addSource(lineId, {
                    type: "geojson",
                    data: createLineData(m.lngLat[0], m.lngLat[1], m.endLng, m.endLat)
                });

                map.addLayer({
                    id: `${lineId}-line`,
                    type: "line",
                    source: lineId,
                    paint: {"line-color": "#E24A4A", "line-width": 2}
                });

                const startMarker = new maplibregl.Marker({ draggable: true, color: "red" })
                    .setLngLat([m.lngLat[0], m.lngLat[1]])
                    .addTo(map);

                const endMarker = new maplibregl.Marker({ draggable: true, color: "red" })
                    .setLngLat([m.endLng, m.endLat])
                    .addTo(map);

                const labelDiv = document.createElement("div");
                labelDiv.style.background = "white";
                labelDiv.style.padding = "2px 6px";
                labelDiv.style.borderRadius = "4px";
                labelDiv.style.fontSize = "12px";
                labelDiv.style.textAlign = "center";
                labelDiv.style.pointerEvents = "none";

                const updateLineLabel = () => {
                    const a = startMarker.getLngLat();
                    const b = endMarker.getLngLat();
                    const dist = mercatorDistance(a.lng, a.lat, b.lng, b.lat);
                    labelDiv.innerText = dist > 1000 ? `${(dist/1000).toFixed(2)}km` : `${Math.round(dist)}m`;
                    let aToMercator = lngLatToMercator(a.lng, a.lat);
                    let bToMercator = lngLatToMercator(b.lng, b.lat);
                    let midMerc = {x: (aToMercator.x + bToMercator.x)/2, y: (aToMercator.y + bToMercator.y)/2}
                    const mid = mercatorToLngLat(midMerc.x, midMerc.y);
                    labelMarker.setLngLat([mid.lng, mid.lat]);
                }

                const initialDist = mercatorDistance(m.lngLat[0], m.lngLat[1], m.endLng, m.endLat);
                labelDiv.innerText = `${Math.round(initialDist)}m`;

                let startToMercator = lngLatToMercator(m.lngLat[0], m.lngLat[1]);
                let endToMercator = lngLatToMercator(m.endLng, m.endLat);
                const initialMid = mercatorToLngLat((startToMercator.x + endToMercator.x)/2, (startToMercator.y + endToMercator.y)/2);

                const labelMarker = new maplibregl.Marker({ element: labelDiv, anchor: "bottom" })
                    .setLngLat([initialMid.lng, initialMid.lat])
                    .addTo(map);
                
                const onDrag = () => {
                    const a = startMarker.getLngLat();
                    const b = endMarker.getLngLat();
                    map.getSource(lineId).setData(createLineData(a.lng, a.lat, b.lng, b.lat));
                    updateLineLabel();
                }

                startMarker.on("drag", onDrag);
                startMarker.on("dragend", ()=> {
                    const newStart = startMarker.getLngLat();
                    const newEnd = endMarker.getLngLat();
                    createdCanvasObject({
                        id: lineId,
                        pointId: m.pointId,
                        type: "line",
                        lng: newStart.lng, 
                        lat: newStart.lat,
                        endLng: newEnd.lng, 
                        endLat: newEnd.lat
                    });
                })

                endMarker.on("drag", onDrag);
                endMarker.on("dragend", ()=> {
                    const newStart = startMarker.getLngLat();
                    const newEnd = endMarker.getLngLat();
                    createdCanvasObject({
                        id: lineId,
                        pointId: m.pointId,
                        type: "line",
                        lng: newStart.lng, 
                        lat: newStart.lat,
                        endLng: newEnd.lng, 
                        endLat: newEnd.lat
                    });
                })

                const startEl = startMarker.getElement();
                const endEl = endMarker.getElement();

                startEl.style.cursor = "grab";
                endEl.style.cursor = "grab";
                startEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: lineId
                    })
                });
                endEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: lineId
                    })
                });

                canvasObjectsRef.current[lineId] = {
                    startMarker,
                    endMarker,
                    labelMarker,
                    sourceId: lineId,
                    lineLayer: `${lineId}-line`
                };
            }
        });
    }, [markers, isLoaded]);


    useEffect(()=> {
        if(!mapInstance.current || !isLoaded) return;
        
        console.log("HITT CANVAS, CANVAS TOOL:", canvasTool)

        const map = mapInstance.current;

        if(canvasTool?.type) {
            setCursor("crosshair");
        } else {
            setCursor("grab");
        };

        const handleClick = (e) => {
            const {lng, lat} = e.lngLat;

            if(canvasTool.type === "icon") {
                const iconDiv = document.createElement("div")
                // iconDiv.innerHTML = canvasTool.icon
                // iconDiv.style.fontSize = "28px"

                const root = createRoot(iconDiv);
            root.render(
                    <div 
                        className="canvasMarker"
                        style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <div 
                            className="canvasMarkerIcon"
                            style={{fontSize: "28px"}}
                        >{canvasTool.icon}</div>
                        <p className="canvasMarkerName">{canvasTool.name}</p>
                    </div>
                );

                const markerId = `temp-marker-${Date.now()}`;

                const marker = new maplibregl.Marker({
                    element: iconDiv,
                    draggable: true 
                })
                    .setLngLat([lng, lat])
                    .addTo(map);

                const el = marker.getElement();

                el.style.cursor = "cell";

                el.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: markerId
                    })
                });

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    createdCanvasObject({
                        id: markerId,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat
                    });
                });

                createdCanvasObject({
                    id: markerId,
                    type: canvasTool.type,
                    name: canvasTool.name,
                    icon: canvasTool.icon,
                    lng: lng,
                    lat: lat
                });

                canvasObjectsRef.current[markerId] = {
                    marker
                };

            } else if(canvasTool.type === "marker") {
                const markerId = `temp-marker-${Date.now()}`;

                const marker = new maplibregl.Marker({
                    draggable: true,
                    color: "red"
                })
                    .setLngLat([lng, lat])
                    .addTo(map);

                const popup = new maplibregl.Popup({
                    offset: 25,
                    closeOnClick: true
                });

                const el = marker.getElement();
                el.style.cursor = "cell";

                el.addEventListener("click", (e) => {
                    e.stopPropagation();
                    console.log("CLICK");

                    const html = `
                        <div class="map-popup">
                            <strong>${canvasTool.name || "Point"} Menu</strong>
                            <div class="pop-actions">
                                ${propertyState[markerId] ? (
                                    `
                                    <button id="config-property">Configure Property</button>
                                    <button id="render-property">Render Editor</button>
                                    `
                                ) : (
                                    `
                                    <button id="add-property">Add Property</button>
                                    `
                                )}
                                
                            </div>
                        </div>
                    `;

                    console.log("HTML", html)

                    popup
                        .setLngLat(marker.getLngLat())
                        .setHTML(html)
                        .addTo(map);
                });

                popup.on("open", ()=> {
                    document.getElementById("add-property")
                        ?.addEventListener("click", ()=> {
                            console.log("Add property");
                        });
                })

                el.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: markerId
                    })
                });

                marker.on("dragstart", ()=> {
                    setCursor("grabbing");
                    popup.remove();
                });
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    createdCanvasObject({
                        id: markerId,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat
                    });
                });

                createdCanvasObject({
                    id: markerId,
                    type: canvasTool.type,
                    name: canvasTool.name,
                    lng: lng,
                    lat: lat
                });

                canvasObjectsRef.current[markerId] = {
                    marker
                };

            } else if(canvasTool.type === "radius") {
                const radiusId = `temp-radius-${Date.now()}`;

                let radius = 500; // meters

                const centerMarker = new maplibregl.Marker({
                    draggable: true
                })
                    .setLngLat([lng, lat])
                    .addTo(map);
                    
                const handlePos = getHandlePosition(lng, lat, radius);

                map.addSource(radiusId, {
                    type: "geojson",
                    data: createRadiusData(lng, lat, radius, handlePos.lng, handlePos.lat)
                });

                map.addLayer({
                    id: `${radiusId}-fill`,
                    type: "fill",
                    source: radiusId,
                    filter: ["==", "$type", "Polygon"],
                    paint:{"fill-color": "#4A90E2", "fill-opacity": 0.25}
                });

                map.addLayer({
                    id: `${radiusId}-outline`,
                    type: "line",
                    source: radiusId,
                    filter: ["==", "$type", "Polygon"],
                    paint: {"line-color": "#4A90E2", "line-width": 2}
                });

                map.addLayer({
                    id: `${radiusId}-spoke`,
                    type: "line",
                    source: radiusId,
                    filter: ["==", "$type", "LineString"],
                    paint: {"line-color": "#4A90E2", "line-width": 1.5, "line-dasharray": [4,2]}
                });

                const handleMarker = new maplibregl.Marker({
                    draggable: true,
                    color: "blue"
                })
                    .setLngLat([handlePos.lng, handlePos.lat])
                    .addTo(map);

                const labelDiv = document.createElement("div");
                labelDiv.style.background = "white";
                labelDiv.style.padding = "2px 6px";
                labelDiv.style.borderRadius = "4px";
                labelDiv.style.fontSize = "12px";
                labelDiv.style.textAlign = "center";
                labelDiv.style.pointerEvents = "none";
                labelDiv.innerText = radius < 1000 ? `${radius}m` : `${(radius/1000).toFixed(2)}km`;

                const labelMarker = new maplibregl.Marker({
                    element: labelDiv,
                    anchor: "bottom"
                })
                    .setLngLat([handleMarker.getLngLat().lng, handleMarker.getLngLat().lat])
                    .addTo(map)

                handleMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();
                    radius = mercatorDistance(center.lng, center.lat, handle.lng, handle.lat);
                    const newData = createRadiusData(center.lng, center.lat, radius, handle.lng, handle.lat);
                    labelDiv.innerText = radius > 1000 ? `${(radius/1000).toFixed(2)}km` : `${Math.round(radius)}m`;
                    labelMarker.setLngLat([handle.lng, handle.lat]);
                    map.getSource(radiusId).setData(newData);
                });

                centerMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();
                    radius = mercatorDistance(center.lng, center.lat, handle.lng, handle.lat);
                    const newData = createRadiusData(center.lng, center.lat, radius, handle.lng, handle.lat);
                    labelDiv.innerText = radius > 1000 ? `${(radius/1000).toFixed(2)}km` : `${Math.round(radius)}m`;
                    labelMarker.setLngLat([handle.lng, handle.lat]);
                    map.getSource(radiusId).setData(newData);
                });

                const centerEl = centerMarker.getElement();
                const handleEl = handleMarker.getElement();

                centerEl.style.cursor = "cell";
                handleEl.style.cursor = "grab";

                centerEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: radiusId
                    })
                });

                centerMarker.on("dragstart", ()=> map.getCanvas().style.cursor = "grabbing");
                centerMarker.on("dragend", ()=> {
                    map.getCanvas().style.cursor = getBaseCursor();
                    const newLngLat = centerMarker.getLngLat()
                    createdCanvasObject({
                        id: radiusId,
                        lng: newLngLat.lng,
                        lat: newLngLat.lat,
                        radius: radius
                    });
                    canvasObjectsRef.current[radiusId].centerMarker = centerMarker;
                    canvasObjectsRef.current[radiusId].radius = radius;
                });

                handleMarker.on("dragstart", ()=> map.getCanvas().style.cursor = "grabbing");
                handleMarker.on("dragend", ()=> {
                    map.getCanvas().style.cursor = getBaseCursor();
                    createdCanvasObject({
                        id: radiusId,
                        radius: radius
                    });
                    canvasObjectsRef.current[radiusId].handleMarker = handleMarker;
                    canvasObjectsRef.current[radiusId].labelMarker = labelMarker;
                    canvasObjectsRef.current[radiusId].radius = radius;
                });

                createdCanvasObject({
                    id: radiusId,
                    type: "radius",
                    name: "radius",
                    lng: lng,
                    lat: lat,
                    radius: radius
                });

                canvasObjectsRef.current[radiusId] = {
                    centerMarker,
                    handleMarker,
                    labelMarker,
                    sourceId: radiusId,
                    fillLayer: `${radiusId}-fill`,
                    outlineLayer: `${radiusId}-outline`,
                    spokeLayer: `${radiusId}-spoke`,
                    radius: radius
                };
            } else if(canvasTool.type === "line") {
                const lineId = `temp-line-${Date.now()}`;
                let distance = 500;

                let { x, y } = lngLatToMercator(lng, lat);
                const endPos = mercatorToLngLat(x + distance, y);
                console.log(`POINT 1: X: ${x}, Y:${y} ENDPOS:`, endPos)

                map.addSource(lineId, {
                    type: "geojson",
                    data: createLineData(lng, lat, endPos.lng, endPos.lat)
                });

                map.addLayer({
                    id: `${lineId}-line`,
                    type: "line",
                    source: lineId,
                    paint: {"line-color": "#E24A4A", "line-width": 2}
                });

                const startMarker = new maplibregl.Marker({ draggable: true, color: "red" })
                    .setLngLat([lng, lat])
                    .addTo(map);

                const endMarker = new maplibregl.Marker({ draggable: true, color: "red" })
                    .setLngLat([endPos.lng, endPos.lat])
                    .addTo(map)

                const labelDiv = document.createElement("div");
                labelDiv.style.background = "white";
                labelDiv.style.padding = "2px 6px";
                labelDiv.style.borderRadius = "4px";
                labelDiv.style.fontSize = "12px";
                labelDiv.style.textAlign = "center";
                labelDiv.style.pointerEvents = "none";

                const updateLineLabel = () => {
                    const a = startMarker.getLngLat();
                    const b = endMarker.getLngLat();
                    const dist = mercatorDistance(a.lng, a.lat, b.lng, b.lat);
                    labelDiv.innerText = dist > 1000 ? `${(dist/1000).toFixed(2)}km` : `${Math.round(dist)}m`;
                    let aToMercator = lngLatToMercator(a.lng, a.lat);
                    let bToMercator = lngLatToMercator(b.lng, b.lat);
                    let midMerc = {x: (aToMercator.x + bToMercator.x)/2, y: (aToMercator.y + bToMercator.y)/2}
                    const mid = mercatorToLngLat(midMerc.x, midMerc.y);
                    labelMarker.setLngLat([mid.lng, mid.lat]);
                }

                const initialDist = mercatorDistance(lng, lat, endPos.lng, endPos.lat);
                labelDiv.innerText = `${Math.round(initialDist)}m`

                let endToMercator = lngLatToMercator(endPos.lng, endPos.lat);
                const initialMid = mercatorToLngLat((x + endToMercator.x)/2, (y + endToMercator.y)/2);

                const labelMarker = new maplibregl.Marker({ element: labelDiv, anchor: "bottom" })
                    .setLngLat([initialMid.lng, initialMid.lat])
                    .addTo(map);
                
                const onDrag = () => {
                    const a = startMarker.getLngLat();
                    const b = endMarker.getLngLat();
                    map.getSource(lineId).setData(createLineData(a.lng, a.lat, b.lng, b.lat));
                    updateLineLabel();
                }

                startMarker.on("drag", onDrag);
                startMarker.on("dragend", ()=> {
                    const newStart = startMarker.getLngLat();
                    const newEnd = endMarker.getLngLat();
                    createdCanvasObject({
                        id: lineId,
                        type: "line",
                        lng: newStart.lng, 
                        lat: newStart.lat,
                        endLng: newEnd.lng, 
                        endLat: newEnd.lat
                    });
                })

                endMarker.on("drag", onDrag);
                endMarker.on("dragend", ()=> {
                    const newStart = startMarker.getLngLat();
                    const newEnd = endMarker.getLngLat();
                    createdCanvasObject({
                        id: lineId,
                        type: "line",
                        lng: newStart.lng, 
                        lat: newStart.lat,
                        endLng: newEnd.lng, 
                        endLat: newEnd.lat
                    });
                })

                const startEl = startMarker.getElement();
                const endEl = endMarker.getElement();

                startEl.style.cursor = "grab";
                endEl.style.cursor = "grab";
                startEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: lineId
                    })
                });
                endEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    showContextMenu({
                        x: e.clientX, 
                        y: e.clientY, 
                        id: lineId
                    })
                });

                createdCanvasObject({
                    id: lineId,
                    type: "line",
                    name: canvasTool.name || "line",
                    lng, lat,
                    endLng: endPos.lng, endLat: endPos.lat,
                    length: initialDist
                });

                canvasObjectsRef.current[lineId] = {
                    startMarker,
                    endMarker,
                    labelMarker,
                    sourceId: lineId,
                    lineLayer: `${lineId}-line`
                };
            }
        };

        const dragStart = () => setCursor("grabbing");
        const dragEnd = ()=> setCursor(getBaseCursor())

        map.on("click", handleClick);
        map.on("dragstart", dragStart);
        map.on("dragend", dragEnd);

        return () => {
            map.off("click", handleClick);
            map.off("dragstart", dragStart);
            map.off("dragend", dragEnd);
        };
    }, [canvasTool, isLoaded]);

    useEffect(()=> {
        console.log("UPDATE POINT HIT MAPCOMPONENT", updateObject)
        if(!updateObject) return;
        const id = updateObject.id;
        const updates = updateObject.updates;

        const map = mapInstance.current;
        const obj = canvasObjectsRef.current[id];
        if(!map || !obj) return;

        if(updates.radius && obj.sourceId) {
            const center = obj.centerMarker.getLngLat();
            const radius = Number(updates.radius);
            const handlePos = getHandlePosition(center.lng, center.lat, radius);
            const newData = createRadiusData(center.lng, center.lat, radius, handlePos.lng, handlePos.lat);
            obj.handleMarker.setLngLat([handlePos.lng, handlePos.lat]);
            obj.labelMarker.setLngLat([handlePos.lng, handlePos.lat]);
            obj.radius = radius;
            map.getSource(obj.sourceId).setData(newData);
        };
        if(updates.icon && updates.name) {
            const iconDiv = document.createElement("div")
            const root = createRoot(iconDiv);
            root.render(
                <div 
                    className="canvasMarker"
                    style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                    <div 
                        className="canvasMarkerIcon"
                        style={{fontSize: "28px"}}
                    >{updates.icon}</div>
                    <p className="canvasMarkerName">{updates.name}</p>
                </div>
            );
            const el = obj.marker.getElement()
            el.innerHTML = ""
            el.appendChild(iconDiv);

            console.log("EL", el)
        };
    }, [updateObject])

    const setCursor = (cursor) => {
        const map = mapInstance.current;
        if(!map) return;
        map.getCanvas().style.cursor = cursor;
    };

    function showContextMenu({x, y, id}) {
        const menu = document.getElementById("marker-context");
        if(!menu) return;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.remove("hidden");

        document.getElementById("marker-delete-action").onclick = () => {
            deleteCanvasObject(id);
            hideContextMenu();
        }
    }

    function hideContextMenu() {
        const menu = document.getElementById("marker-context");
        // console.log("HIT SHOWCONTEXT", menu)
        if(menu) menu.classList.add("hidden")
    }

    const getBaseCursor = () => canvasTool?.type ? "crosshair" : "grab";

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
        console.log("HANDLE POSITION CALLED LNG:", centerLng, " LAT:", centerLat, " C:", c);
        return mercatorToLngLat(c.x + radiusMeters, c.y);
    }

    function createRadiusData(centerLng, centerLat, radiusMeters, handleLng, handleLat, steps = 64) {
        const c = lngLatToMercator(centerLng, centerLat);
        const coords = []
        for(let i=0; i<= steps; i++) {
            const angle = (i/steps) * 2 * Math.PI;
            const pt = mercatorToLngLat(
                c.x + radiusMeters * Math.cos(angle),
                c.y + radiusMeters * Math.sin(angle)
            );
            coords.push([pt.lng, pt.lat]);
        };
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {type: "Polygon", coordinates: [coords]},
                    properties: {}
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [[centerLng, centerLat], [handleLng, handleLat]]
                    },
                    properties: {}
                }
            ]
        }
    }

    function createLineData(aLng, aLat, bLng, bLat) {
        return {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [[aLng, aLat], [bLng, bLat]]
                },
                properties: {}
            }]
        }
    }

    const deleteCanvasObject = (id) => {
        const map = mapInstance.current;
        const obj = canvasObjectsRef.current[id];

        if(!obj) return;

        if(obj.marker) {
            obj.marker.remove();
        };
        
        if(obj.centerMarker) obj.centerMarker.remove();
        if(obj.handleMarker) obj.handleMarker.remove();
        if(obj.labelMarker) obj.labelMarker.remove();
        if(obj.startMarker) obj.startMarker.remove();
        if(obj.endMarker) obj.endMarker.remove();

        if(obj.fillLayer && map.getLayer(obj.fillLayer)) {
            map.removeLayer(obj.fillLayer);
        };

        if(obj.outlineLayer && map.getLayer(obj.outlineLayer)) {
            map.removeLayer(obj.outlineLayer);
        };
        if(obj.spokeLayer && map.getLayer(obj.spokeLayer)) {
            map.removeLayer(obj.spokeLayer);
        };
        if(obj.lineLayer && map.getLayer(obj.lineLayer)) {
            map.removeLayer(obj.lineLayer);
        };
        if(obj.sourceId && map.getSource(obj.sourceId)) {
            map.removeSource(obj.sourceId);
        };

        delete canvasObjectsRef.current[id];
        deletedCanvasObject(id);
    }

    return (
        <>
        <div id="marker-context" className="marker-context hidden">
            <ModalButton
                itemText="Edit"
                modalComponent={
                <ManagePointsModal 
                    addFunc={createdCanvasObject}
                    deleteFunc={deleteCanvasObject}
                    changeFunc={(id, updates)=> updateObject = {id, updates}}
                />}
            />
            <button id="marker-delete-action">Delete</button>
        </div>
        <div
            id="map-container"
            className=""
            ref={mapRef}
        />
        </>
    )
}