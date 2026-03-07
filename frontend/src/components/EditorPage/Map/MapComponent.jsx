import { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { circle } from "@turf/turf";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import "./MapComponent.css"


export default function MapComponent({ layer, lngLat, markers, canvasTool, createdCanvasObject, deletedCanvasObject }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [cursorState, setCursorState] = useState("grab");
    const canvasObjectsRef = useRef({});

    useEffect(()=> {
        if(mapInstance.current || !mapRef.current || isLoaded) return;

        const initialCenter = lngLat ?? [-83.5, 32.9];
        
        const map = new maplibregl.Map({
            container: mapRef.current,
            center: initialCenter,
            zoom: 6,
            // minZoom: 1,
            maxZoom: 18,
            maxBounds: [
                [-130, 20],
                [-60, 50]
            ],
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

        markers.forEach(m => {
            const markerId = `marker-${Date.now()}-${m.propertyId}`;

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
                deleteCanvasObject(markerId);
            });

            marker.on("dragstart", ()=> setCursor("grabbing"));
            marker.on("dragend", ()=> {
                setCursor(getBaseCursor());
                const newLngLat = marker.getLngLat();
                createdCanvasObject({
                    id: markerId,
                    propertyId: m.propertyId,
                    lng: newLngLat.lng,
                    lat: newLngLat.lat
                });
            });

            createdCanvasObject({
                id: markerId,
                propertyId: m.propertyId,
                lng: m.lngLat[0],
                lat: m.lngLat[1]
            });

            canvasObjectsRef.current[markerId] = {
                marker
            };
        })
        // const geojson = {
        //     type: "FeatureCollection",
        //     features: markers.map(m => ({
        //         type: "Feature",
        //         properties: {
        //             id: m.propertyId
        //         },
        //         geometry: {
        //             type: "Point",
        //             coordinates: m.lngLat
        //         }
        //     }))
        // };

        // if(!map.getSource("properties") && geojson.features.length > 0){
        //     try {
        //         map.addSource("properties", {
        //             type: "geojson",
        //             data: geojson,
        //             cluster: true,
        //             clusterMaxZoom: 14,
        //             clusterRadius: 50
        //         });

        //         map.addLayer({
        //             id: "property-points",
        //             type: "circle",
        //             source: "properties",
        //             filter: ["!", ["has", "point_count"]],
        //             paint: {
        //                 "circle-radius": 9,
        //                 "circle-color": "#ff0000",
        //                 "circle-stroke-width": 1,
        //                 "circle-stroke-color": "#ffffff"
        //             }
        //         });
        //     } catch(e) {
        //         console.warn("Map failed to add markers", e)
        //     }
        // } else {
        //     try {
        //         map.getSource("properties").setData(geojson);
        //     } catch(e) {
        //         console.warn("Map source not ready yet:", e);
        //     };
        // };

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

                createRoot(iconDiv).render(
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

                const markerId = `marker-${Date.now()}`;

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
                    deleteCanvasObject(markerId);
                });

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    createdCanvasObject({
                        id: markerId,
                        type: canvasTool.type,
                        name: canvasTool.name,
                        icon: canvasTool.icon,
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
                const markerId = `marker-${Date.now()}`;

                const marker = new maplibregl.Marker({
                    draggable: true,
                    color: "red"
                })
                    .setLngLat([lng, lat])
                    .addTo(map);

                const el = marker.getElement();
                el.style.cursor = "cell";

                el.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    deleteCanvasObject(markerId);
                });

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> {
                    setCursor(getBaseCursor());
                    const newLngLat = marker.getLngLat();
                    createdCanvasObject({
                        id: markerId,
                        type: canvasTool.type,
                        name: canvasTool.name,
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
                const radiusId = `radius-${Date.now()}`;

                map.addSource(radiusId, {
                    type: "geojson",
                    data: createCircle(lng, lat, 500)
                });

                map.addLayer({
                    id: `${radiusId}-fill`,
                    type: "fill",
                    source: radiusId,
                    paint: {
                        "fill-color": "#4A90E2",
                        "fill-opacity": 0.25
                    }
                });

                map.addLayer({
                    id: `${radiusId}-outline`,
                    type: "line",
                    source: radiusId,
                    paint: {
                        "line-color": "#4A90E2",
                        "line-width": 2 
                    }
                });

                const centerMarker = new maplibregl.Marker({
                    draggable: true
                })
                    .setLngLat([lng, lat])
                    .addTo(map);

                let radius = 500; // meters
                const handleLng = lng + (radius / 111320); // rough meters to lng conversation

                const handleMarker = new maplibregl.Marker({
                    draggable: true,
                    color: "blue"
                })
                    .setLngLat([handleLng, lat])
                    .addTo(map);

                const labelDiv = document.createElement("div");
                labelDiv.style.background = "white";
                labelDiv.style.padding = "2px 6px";
                labelDiv.style.borderRadius = "4px";
                labelDiv.style.fontSize = "12px";
                labelDiv.style.textAlign = "center";
                labelDiv.style.innerText = "500m";

                const labelMarker = new maplibregl.Marker({
                    element: labelDiv,
                    anchor: "bottom"
                })
                    .setLngLat([handleMarker.getLngLat().lng, handleMarker.getLngLat().lat])
                    .addTo(map)

                handleMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();

                    const dx = handle.lng - center.lng;
                    const dy = handle.lat - center.lat;
                    
                    radius = Math.sqrt(dx*dx + dy*dy) * 111320;

                    const newCircle = createCircle(center.lng, center.lat, radius);
                    labelDiv.innerText = radius > 1000 ? 
                        `${(radius/1000).toFixed(2)}km` :
                        `${Math.round(radius)}m`;
                    labelMarker.setLngLat([handle.lng, handle.lat]);
                    map.getSource(radiusId).setData(newCircle);
                });

                centerMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();

                    const dx = handle.lng - center.lng;
                    const dy = handle.lat - center.lat;
                    
                    radius = Math.sqrt(dx*dx + dy*dy) * 111320;

                    const newCircle = createCircle(center.lng, center.lat, radius);
                    labelDiv.innerText = radius > 1000 ? 
                        `${(radius/1000).toFixed(2)}km` :
                        `${Math.round(radius)}m`;
                    labelMarker.setLngLat([handle.lng, handle.lat]);
                    map.getSource(radiusId).setData(newCircle);
                });

                const centerEl = centerMarker.getElement();
                const handleEl = handleMarker.getElement();

                centerEl.style.cursor = "cell";
                handleEl.style.cursor = "grab";

                centerEl.addEventListener("contextmenu", (e)=> {
                    e.preventDefault();
                    deleteCanvasObject(radiusId);
                })

                centerMarker.on("dragstart", ()=> map.getCanvas().style.cursor = "grabbing");
                centerMarker.on("dragend", ()=> {
                    map.getCanvas().style.cursor = getBaseCursor();
                    const newLngLat = centerMarker.getLngLat()
                    createdCanvasObject({
                        id: radiusId,
                        type: "radius",
                        lng: newLngLat.lng,
                        lat: newLngLat.lat,
                        radius: radius
                    });
                });

                handleMarker.on("dragstart", ()=> map.getCanvas().style.cursor = "grabbing");
                handleMarker.on("dragend", ()=> map.getCanvas().style.cursor = getBaseCursor());

                createdCanvasObject({
                    id: radiusId,
                    type: "radius",
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
                    outlineLayer: `${radiusId}-outline`
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

    const setCursor = (cursor) => {
        const map = mapInstance.current;
        if(!map) return;
        map.getCanvas().style.cursor = cursor;
    };

    const getBaseCursor = () => canvasTool?.type ? "crosshair" : "grab";

    function createCircle(lng, lat, radiusMeters) {
        return circle([lng, lat], radiusMeters / 1000, {
            steps: 64,
            unit: "kilometers"
        })
    }

    const deleteCanvasObject = (id) => {
        const map = mapInstance.current;
        const obj = canvasObjectsRef.current[id];

        if(!obj) return;

        if(obj.marker) {
            obj.marker.remove();
        };
        
        if(obj.centerMarker) obj.centerMarker.remove();
        if (obj.handleMarker) obj.handleMarker.remove();
        if (obj.labelMarker) obj.labelMarker.remove();

        if(obj.fillLayer && map.getLayer(obj.fillLayer)) {
            map.removeLayer(obj.fillLayer);
        };

        if(obj.outlineLayer && map.getLayer(obj.outlineLayer)) {
            map.removeLayer(obj.outlineLayer);
        };

        if(obj.sourceId && map.getSource(obj.sourceId)) {
            map.removeSource(obj.sourceId);
        };

        delete canvasObjectsRef.current[id];
        deletedCanvasObject(id);
    }

    return (
        <div
            id="map-container"
            className=""
            ref={mapRef}
        />
    )
}