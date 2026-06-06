import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./RenderMapBackground.css";

function computeZoom(distanceMeters, canvasWidthPx, lat) {
    const metersPerPixel = (2 * distanceMeters) / canvasWidthPx;
    const metersPerPixelAtZ0 = 156543.034 * Math.cos((lat * Math.PI) / 180);
    return Math.log2(metersPerPixelAtZ0 / metersPerPixel);
}

export default function RenderMapBackground({ visible, layer, lng, lat, distance, onDistanceChange, mapRef, onViewChange, panLimitMeters = 500 }) {
    const containerRef = useRef(null);
    const localMapRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(800);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setCanvasWidth(Math.max(100, e.contentRect.width));
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!visible || !containerRef.current) return;
        if (mapRef.current) return;

        const latDelta = panLimitMeters / 111320;
        const lngDelta = panLimitMeters / (111320 * Math.cos((lat * Math.PI) / 180));
        const maxBounds = [
            [lng - lngDelta, lat - latDelta],
            [lng + lngDelta, lat + latDelta],
        ];

        const map = new maplibregl.Map({
            container: containerRef.current,
            center: [lng, lat],
            zoom: 14,
            minZoom: 18.5,
            maxZoom: 24,
            maxBounds,
            interactive: true,
            attributionControl: false,
            dragPan: true,
            scrollZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            touchZoomRotate: true,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: "raster",
                        tiles: [
                            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
                        ],
                        tileSize: 256,
                        maxzoom: 19,
                    },
                    satellite: {
                        type: "raster",
                        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                        tileSize: 256,
                        maxzoom: 18,
                    },
                },
                layers: [
                    { id: "osm-layer", type: "raster", source: "osm", paint: { "raster-resampling": "nearest" } },
                    { id: "satellite-layer", type: "raster", source: "satellite", layout: { visibility: "none" }, paint: { "raster-resampling": "nearest" } },
                ],
            },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        localMapRef.current = map;
        if (mapRef) mapRef.current = map;
        map.on("load", () => setMapReady(true));
        const emitChange = () => onViewChange && onViewChange();
        map.on("move", emitChange);
        map.on("zoom", emitChange);
        map.on("moveend", emitChange);
        return () => {
            map.remove();
            localMapRef.current = null;
            if (mapRef) mapRef.current = null;
            setMapReady(false);
        };
    }, [visible, lng, lat]);

    useEffect(() => {
        const map = localMapRef.current;
        if (!map || !mapReady) return;
        const z = Math.max(12, Math.min(20, computeZoom(distance, canvasWidth, lat)));
        map.jumpTo({ center: [lng, lat], zoom: z });
    }, [distance, lng, lat, canvasWidth, mapReady]);

    useEffect(() => {
        const map = localMapRef.current;
        if (!map || !mapReady) return;
        const want = layer === "satellite" ? "satellite-layer" : "osm-layer";
        ["osm-layer", "satellite-layer"].forEach(lId => {
            if (map.getLayer(lId)) map.setLayoutProperty(lId, "visibility", lId === want ? "visible" : "none");
        });
    }, [layer, mapReady]);

    if (!visible) return null;
    return <div id="render-map-background" ref={containerRef} />;
}
