import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import "./MapComponent.css"

export default function MapComponent({ layer, lngLat, markers }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRefs = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);

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
    }, [lngLat, isLoaded])

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

    return (
        <div
            className="map-container"
            ref={mapRef}
        />
    )
}