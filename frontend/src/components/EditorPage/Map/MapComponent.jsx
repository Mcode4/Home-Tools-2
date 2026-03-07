import { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { circle } from "@turf/turf";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import "./MapComponent.css"


export default function MapComponent({ layer, lngLat, markers, canvasTool, createdCanvasObject }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRefs = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [cursorState, setCursorState] = useState("grab");

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

        const geojson = {
            type: "FeatureCollection",
            features: markers.map(m => ({
                type: "Feature",
                properties: {
                    id: m.propertyId
                },
                geometry: {
                    type: "Point",
                    coordinates: m.lngLat
                }
            }))
        };

        if(!map.getSource("properties") && geojson.features.length > 0){
            try {
                map.addSource("properties", {
                    type: "geojson",
                    data: geojson,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                map.addLayer({
                    id: "property-points",
                    type: "circle",
                    source: "properties",
                    filter: ["!", ["has", "point_count"]],
                    paint: {
                        "circle-radius": 9,
                        "circle-color": "#ff0000",
                        "circle-stroke-width": 1,
                        "circle-stroke-color": "#ffffff"
                    }
                });
            } catch(e) {
                console.warn("Map failed to add markers", e)
            }
        } else {
            try {
                map.getSource("properties").setData(geojson);
            } catch(e) {
                console.warn("Map source not ready yet:", e);
            };
        };

    }, [markers, isLoaded]);


    useEffect(()=> {
        if(!mapInstance.current || !isLoaded) return;
        
        console.log("HITT CANVAS, CANVAS TOOL:", canvasTool)

        const map = mapInstance.current;

        if(canvasTool?.type) {
            if(cursorState !== "crosshair") setCursor("crosshair");
        } else {
            if(cursorState !== "grab") setCursor("grab");
            return;
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

                const marker = new maplibregl.Marker({
                    element: iconDiv,
                    draggable: true 
                })
                    .setLngLat([lng, lat])
                    .addTo(map);
                
                createdCanvasObject({
                    type: canvasTool.type,
                    name: canvasTool.name,
                    icon: canvasTool.icon,
                    lng: lng,
                    lat: lat
                });

                const el = marker.getElement();

                el.style.cursor = "cell";

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> setCursor(getBaseCursor()));

            } else if(canvasTool.type === "marker") {
                const marker = new maplibregl.Marker({
                    draggable: true,
                    color: "red"
                })
                    .setLngLat([lng, lat])
                    .addTo(map);

                createdCanvasObject({
                    type: canvasTool.type,
                    name: canvasTool.name,
                    icon: canvasTool.icon,
                    lng: lng,
                    lat: lat
                })

                const el = marker.getElement();
                el.style.cursor = "cell";

                marker.on("dragstart", ()=> setCursor("grabbing"));
                marker.on("dragend", ()=> setCursor(getBaseCursor()));

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

                const radius = 500; // meters
                const handleLng = lng + (radius / 111320); // rough meters to lng conversation

                const handleMarker = new maplibregl.Marker({
                    draggable: true,
                    color: "blue"
                })
                    .setLngLat([handleLng, lat])
                    .addTo(map);

                handleMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();

                    const dx = handle.lng - center.lng;
                    const dy = handle.lat - center.lat;
                    
                    const distance = Math.sqrt(dx*dx + dy*dy) * 111320;

                    const newCircle = createCircle(center.lng, center.lat, distance);
                    map.getSource(radiusId).setData(newCircle);
                });

                centerMarker.on("drag", ()=> {
                    const center = centerMarker.getLngLat();
                    const handle = handleMarker.getLngLat();

                    const dx = handle.lng - center.lng;
                    const dy = handle.lat - center.lat;
                    
                    const distance = Math.sqrt(dx*dx + dy*dy) * 111320;

                    const newCircle = createCircle(center.lng, center.lat, distance);
                    map.getSource(radiusId).setData(newCircle);
                });

                const el = centerMarker.getElement();
                el.style.cursor = "cell";

                centerMarker.on("dragstart", ()=> setCursor("grabbing"));
                centerMarker.on("dragend", ()=> setCursor(getBaseCursor()));

                createdCanvasObject({
                    id: radiusId,
                    type: "radius",
                    lng: lng,
                    lat: lat,
                    radius: 500
                });
            }
        };

        map.on("click", handleClick);

        return () => {
            map.off("click", handleClick);
        };
    }, [canvasTool, isLoaded]);


    const setCursor = (type) => {
        const canvas = mapInstance.current.getCanvas();
        canvas.style.cursor = type;
        setCursorState(type);
    };


    const getBaseCursor = () => canvasTool?.type ? "crosshair" : "grab";


    function createCircle(lng, lat, radiusMeters) {
        return circle([lng, lat], radiusMeters / 1000, {
            steps: 64,
            unit: "kilometers"
        })
    }


    return (
        <div
            id="map-container"
            className=""
            ref={mapRef}
        />
    )
}