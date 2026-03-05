import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapComponent() {
    const properties = useSelector(store => store.properties);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const { pathname } = useLocation();
    const id = Number(pathname.split("/").pop());

    useEffect(()=> {
        const property =
            properties.pinned?.find(p => p.id === id) ||
            properties.other?.find(p => p.id === id);

        if(!property) {
            console.log("Property not found at ID:", id);
            return;
        };

        const { lat, lng } = property;

        // const map = new maplibregl.Map({
        //     container: mapRef.current,
        //     style: "https://demotiles.maplibre.org/style.json",
        //     center: [-83.3, 32.5],
        //     zoom: 7
        // })


        
        const map = new maplibregl.Map({
            container: mapRef.current,
            minZoom: 5,
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

            new maplibregl.Marker({color: "red"})
                .setLngLat([lng, lat])
                .addTo(map);

            mapInstance.current.flyTo({
                center: [lng, lat],
                zoom: 16
            });
        });

        return () => map.remove();
    }, [id, properties]);

    const flyToProperty = (mapLng, mapLat) => {
        if(!mapInstance.current) return;

        mapInstance.current.flyTo({
            center: [mapLng, mapLat],
            zoom: 14
        });
    }

    const toggleLayer = (layerToShow) => {
        if(!mapInstance.current) return;

        ["osm-layer", "satellite-layer"].forEach(layer => {
            mapInstance.current.setLayoutProperty(
                layer,
                "visibility",
                layer === layerToShow ? "visible" : "none"
            );
        });
    };
    

    return (
        <div id="app-map">
            <div style={{marginBottom: "10px"}}>
                <button onClick={() => toggleLayer("osm-layer")}>
                    Toggle OSM
                </button>
                <button onClick={() => toggleLayer("satellite-layer")}>
                    Toggle Satellite
                </button>
            </div>

            <div
                className="map-container"
                ref={mapRef}
                style={{ width: "100%", height: "600px" }}
            />
        </div>
    )
}