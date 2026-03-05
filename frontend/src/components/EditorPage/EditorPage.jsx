import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { thunkGetAllProperties } from "../../redux/properties";

import MapComponent from "./Map";
import "./EditorPage.css";

export default function EditorPage() {
    const properties = useSelector(store => store.properties);
    const { pathname } = useLocation();
    const id = Number(pathname.split("/").pop());
    const [loaded, setLoaded] = useState(false);
    const [mapPopup, setMapPopup] = useState({
        display: true,
        layer: "osm-layer"
    });
    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [markers, setMarkers] = useState([]); // [{id: propertyId: int(1), lngLat: [lng, lat]}, {...}]
    const dispatch = useDispatch();

    // TESTING
    useEffect(()=> {
        console.log("MAP POPUP CHANGED", mapPopup);
    }, [mapPopup]);

    useEffect(()=> {
        console.log("LNG LAT CHANGED", lngLat);
    }, [lngLat]);

    // On Load/Properties Changed
    useEffect(()=> {
        if(properties.pinned.length || properties.other.length) return;
        dispatch(thunkGetAllProperties());
    }, [dispatch]);

    useEffect(()=> {
        console.log("Properties", properties);
        if(!properties.pinned.length && !properties.other.length) return;
        
        let property;
        const allMarkers = [];

        [...properties.pinned, ...properties.other].forEach(p => {
            if(p.id === id) property = p;
            const {lng, lat} = p;
            allMarkers.push({ propertyId: p.id, lngLat: [lng, lat] });
        });

        setMarkers(allMarkers);

        if(property) {
            setLngLat([property.lng, property.lat]);
        };
        
        setLoaded(true);
    }, [properties]);
    
    return (<>
    {loaded && (
    <div id="editor">
        <div id="editor-top">
            <input 
                type="text" 
                name="search" 
                id="app-searchbar"
                placeholder="🔍 Search Location..." 
            />
        </div>
        <div id="editor-main">
            <div className="app-slider">
                <ul className="menu"></ul>
                <ul className="menu-tools"></ul>
            </div>

            <span className="popup-span">
                <div className="popup">
                    <div className="popup-controls">
                        <button 
                            onClick={()=> setMapPopup(m => ({
                                ...m,
                                display: !m.display
                            }))}
                        >-</button>
                    </div>

                    <div className="popup-radio">
                        <div className="map-layer-option">
                            <label htmlFor="base-map-radio">Toggle OSM</label>
                            <input 
                                type="radio" 
                                name="base-map-radio" 
                                id="base-map-radio"
                                value={"osm-layer"}
                                checked={mapPopup.layer === "osm-layer" ? true : false}
                                onChange={(e)=> setMapPopup(m=> ({
                                    ...m,
                                    layer: e.target.value
                                }))} 
                            />
                        </div>

                        <div className="map-layer-option">
                            <label htmlFor="base-map-radio">Toggle Satellite</label>
                            <input 
                                type="radio" 
                                name="satellite-map-radio" 
                                id="satellite-map-radio"
                                value={"satellite-layer"}
                                checked={mapPopup.layer === "satellite-layer" ? true : false}
                                onChange={(e)=> setMapPopup(m=> ({
                                    ...m,
                                    layer: e.target.value
                                }))} 
                            />
                        </div>
                    </div>
                </div>
            </span>

            <MapComponent 
                layer={mapPopup.layer} 
                lngLat={lngLat} 
                markers={markers} 
            />             
        </div>
    </div>
    )}
    </>)
}