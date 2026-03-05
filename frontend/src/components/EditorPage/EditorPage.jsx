import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { thunkGetAllProperties } from "../../redux/properties";
import { handleSearchAddress } from "../../functions/search/search";

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
    const [menu, setMenu] = useState("map") // "map", "draw", "screen", "teams"
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchActive, setSearchActive] = useState(true);
    const [err, setErr] = useState({});
    const searchRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // TESTING
    useEffect(()=> {
        console.log("MAP POPUP CHANGED", mapPopup);
    }, [mapPopup]);

    useEffect(()=> {
        console.log("LNG LAT CHANGED", lngLat);
    }, [lngLat]);

    useEffect(()=> {
        console.log("MENU CHANGED", menu);
    }, [menu]);

    useEffect(()=> {
        console.log("SEARCH REF CHANGED", searchRef);
    }, [searchRef]);

    // On Load/Properties Changed
    useEffect(()=> {
        const handleClickOutside = (e) => {
            if(searchRef.current) {
                if(!searchRef.current.contains(e.target)) {
                    setSearchActive(false);
                } else {
                    setSearchActive(true);
                };
            };
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [])
    useEffect(()=> {
        if(properties.pinned.length || properties.other.length) return;
        dispatch(thunkGetAllProperties());
    }, [dispatch]);

    useEffect(()=> {
        console.log("Properties", properties);
        if (!properties.pinned.length && !properties.other.length) return;
        
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

    useEffect(()=> {
        setSearchResults([]);
        if(!search) return;

        if(search.length > 2) {
            const searchDelay = setTimeout(()=> {
                handleSearchAddress(search)
                    .then(data => setSearchResults(data))
                    .catch(err => setErr({search: err}));
            }, 500);

            return () => {
                clearTimeout(searchDelay);
            };
        }
    }, [search]);

    const selectMenu = (e, val) => {
        e.preventDefault();
        
        ["map", "draw", "view", "teams"].forEach(m => {
            const currMenu = document.getElementById(`menu-${m}`);
            const menuItem = document.getElementById(`menu-item-${m}`);
            const slider = document.getElementById("menu-tools");

            if(m === val) {
                currMenu.classList.toggle("menu-active");
                menuItem.classList.toggle("hidden");

                if(menuItem.className === "hidden") {
                    slider.classList.toggle("closed", true);
                } else {
                    slider.classList.toggle("closed", false);
                };
            } else {
                currMenu.classList.toggle("menu-active", false);
                menuItem.classList.toggle("hidden", true);
            };
        })
    }


    
    return (<>
    {loaded && (
    <div id="editor">
        <div id="editor-top">
            <div className="editor-search" ref={searchRef}>
                <input 
                    type="text" 
                    name="search" 
                    className="app-searchbar"
                    placeholder="🔍 Search Location..."
                    value={search}
                    onChange={(e)=> setSearch(e.target.value)}
                />
                {search.length > 0 && searchActive && (
                    <div className="search-results">
                        {search.length > 2 ? (
                            <>
                            {searchResults?.length > 0 ? searchResults.map((result, i) => (
                                <div 
                                    key={`search-${i}`}
                                    className="search-result"
                                    onClick={()=> {
                                        setLngLat([result.lng, result.lat]);
                                        setSearchActive(false);
                                    }}
                                >
                                    {result.text}
                                </div>
                            )) : (
                                <p>Searching...</p>
                            )}
                            </>
                        ) : (
                            <p>Searching after 3 characters...</p>
                        )}
                    </div>
                )}
            </div>

            <div className="editor-controls">
                <button>Save All</button>
                <button onClick={()=> navigate("/home")}>Exit to Dashboard</button>
            </div>
        </div>

        <div id="editor-main">
            <div className="app-slider">
                <ul className="menu">
                    <li 
                        id="menu-map"
                        className="menu-active"
                        onClick={(e)=> selectMenu(e, "map")}
                    >
                        <img src="/icons/map.svg" alt="Map" />
                    </li>
                    <li 
                        id="menu-draw"
                        className=""
                        onClick={(e)=> selectMenu(e, "draw")}
                    >
                        <img src="/icons/paint.svg" alt="Draw" />
                    </li>
                    <li 
                        id="menu-view"
                        className=""
                        onClick={(e)=> selectMenu(e, "view")}
                    >
                        <img src="/icons/screen.svg" alt="View" />
                    </li>
                    <li 
                        id="menu-teams"
                        className=""
                        onClick={(e)=> selectMenu(e, "teams")}
                    >
                        <img src="/icons/team.svg" alt="Teams" />
                    </li>
                </ul>

                <ul id="menu-tools">
                    <li 
                        className=""
                        id="menu-item-map"
                    >
                        <div className="menu-item-section">
                            <div className="menu-item-title">Maps</div>
                            {properties?.pinned.length > 0 || properties?.other.length > 0 ? (
                                <>
                                {properties?.pinned.length > 0 && (
                                    <>
                                    <div className="menu-item-subtitle">Pinned</div>
                                    {properties?.pinned.map((p, i) => (
                                        <div className="menu-item-1" key={`pinned-${i}`}>
                                            <p>{p.name}</p>
                                            <button>Config</button>
                                        </div>
                                    ))}
                                    </>
                                )}

                                {properties?.other.length > 0 && (
                                    <>
                                    <div className="menu-item-subtitle">Properties</div>
                                    {properties?.other.map((p, i) => (
                                        <div className="menu-item-1" key={`props-${i}`}>
                                            <p>{p.name}</p>
                                            <button>Config</button>
                                        </div>
                                    ))}
                                    </>
                                )}
                                </>
                            ) : (
                                <p>No Properties Made Yet.</p>
                            )}
                        </div>
                    </li>
                    <li
                        className="hidden"
                        id="menu-item-draw"
                    >2</li>
                    <li 
                        className="hidden"
                        id="menu-item-view"
                    >3</li>
                    <li 
                        className="hidden"
                        id="menu-item-teams"
                    >4</li>
                </ul>
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