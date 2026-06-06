import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";

export default function MapLibrePopup({map, lngLat, children, onClose}) {
    const popupRef = useRef(null);
    const containerRef = useRef(document.createElement("div"));
    const isUnmounting = useRef(false);

    useEffect(()=> {
        containerRef.current.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }, [])

    useEffect(()=> {
        if(!map) return;
        const handleMapClick = () => {
            onClose?.()
        };

        map.on("click", handleMapClick);
        return ()=> map.off("click", handleMapClick);
    }, [map, onClose]);

    useEffect(()=> {
        console.log("OPEN MAPPOPUP", {map, lngLat, children, onClose})
        if(!map) return;

        isUnmounting.current = false;
        
        popupRef.current = new maplibregl.Popup({
            offset: 25,
            closeOnClick: true
        })
            .setLngLat(lngLat)
            .setDOMContent(containerRef.current)
            .addTo(map);
        console.log("POPUP REF", popupRef.current)
        
        popupRef.current.on("close", ()=> {
            if(!isUnmounting.current) onClose?.();
        });

        return () => {
            isUnmounting.current = true;
            popupRef.current?.remove();
        }
    }, [map, lngLat]);

    return createPortal(children, containerRef.current);
}