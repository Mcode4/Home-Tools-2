import { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    thunkGetAllProperties, 
    thunkCreateProperty,
    thunkEditProperty,
    thunkDeleteProperty 
} from "../../redux/properties";
import { 
    thunkGetAllPoints ,
    thunkCreatePoint,
    thunkEditPoint,
    thunkDeletePoint
} from "../../redux/points";
import { handleSearchAddress } from "../../functions/search/search";

import MapComponent from "./Map";
import "./EditorPage.css";

export default function EditorPage() {
    const { state } = useLocation()
    const propertyStore = useSelector(store => store.properties);
    const pointStore = useSelector(store => store.points);
    const [otherProperties, setOtherProperties] = useState(()=> {
        const stored = localStorage.getItem("otherProperties");
        const parsed = JSON.parse(stored);
        if(parsed && Date.now() > parsed?.expires) {
            localStorage.removeItem("canvasObjects");
            return {};
        };
        return parsed?.data || {};
    });
    const [pinnedProperties, setPinnedProperties] = useState(()=> {
        const stored = localStorage.getItem("pinnedProperties");
        const parsed = JSON.parse(stored);
        if(parsed && Date.now() > parsed?.expires) {
            localStorage.removeItem("canvasObjects");
            return {};
        }
        return parsed?.data || {};
    });
    const [points, setPoints] = useState(()=> {
        const stored = localStorage.getItem("points");
        const parsed = JSON.parse(stored);
        if(parsed && Date.now() > parsed?.expires) {
            localStorage.removeItem("points");
            return {};
        }
        return parsed?.data || {};
    });
    const [loaded, setLoaded] = useState(false);
    const [layer, setLayer] = useState("osm-layer");
    const [popups, setPopups] = useState({});
    const [menuSelects, setMenuSelects] = useState({});
    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [markers, setMarkers] = useState([]); // [{id: propertyId: int(1), lngLat: [lng, lat]}, {...}]
    const [menu, setMenu] = useState("map") // "map", "draw", "teams", "render-page", "exports"
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchActive, setSearchActive] = useState(true);
    const [amenities, setAmenities] = useState([
        {emoji: "🏠", name: "Leasing"}, {emoji: "🗑️", name: "Trash bin"}, {emoji: "🔥", name: "Grill"}, 
        {emoji: "✉️", name: "Mailboxes"}, {emoji: "🐕", name: "Pet Station"}, {emoji: "🏛️", name: "Clubhouse"}, 
        {emoji: "🌲", name: "Park"}, {emoji: "💪", name: "Gym"}, {emoji: "🏢", name: "Senior Bldg"}, 
        {emoji: "🏊", name: "Pool"}, {emoji: "🎠", name: "Playground"}, 
    ]);
    const [emergencies, setEmergencies] = useState([
        {emoji: "🤢", name: "Contamination"}, {emoji: "🛠️", name: "Maintenance"}, {emoji: "💩", name: "Hazard"}, 
        {emoji: "🌊", name: "Flood"}, {emoji: "⚠️", name: "Incident"},
    ]);
    const [buildings, setBuildings] = useState(["A", "B", "C", "D", "E", "F", "G"]);
    const [canvasSelect, setCanvasSelect] = useState({icon: null, name: null, type: null});
    const [canvasObjects, setCanvasObjects] = useState({})
    const [err, setErr] = useState({});
    const [deletedProperties, setDeletedProperties] = useState({pinned: [], other: []})
    const [deletedPoints, setDeletedPoints] = useState([]);
    const searchRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // TESTING
    useEffect(()=> {
        console.log("LNG LAT CHANGED", lngLat);
    }, [lngLat]);

    useEffect(()=> {
        console.log("MENU CHANGED", menu);
    }, [menu]);

    useEffect(()=> {
        console.log("PROPERTIES CHANGED", 
            "PINNED:", pinnedProperties,
            "OTHER:", otherProperties
        );
    }, [pinnedProperties, otherProperties]);

    useEffect(()=> {
        console.log("SEARCH REF CHANGED", searchRef);
    }, [searchRef]);

    useEffect(()=> {
        console.log("CANVAS OBJECTS CHANGED", canvasObjects);
    }, [canvasObjects]);

    useEffect(()=> {
        if(!propertyStore.pinned.length || !propertyStore.other.length) {
            dispatch(thunkGetAllProperties());
        }
        if(!pointStore.data.length)  {
            dispatch(thunkGetAllPoints());
        }
        
    }, [dispatch]);

    useEffect(()=> {
        console.log("Properties", propertyStore);
        console.log("SAVED PROP FROM LOCAL", otherProperties);
        console.log("POINTS from STORE", pointStore);
        console.log("SAVED POINTS", points);
        if (!propertyStore.pinned.length && !propertyStore.other.length) {    
            setLoaded(true);
            return;
        }
        
        const allMarkers = [];

        propertyStore.pinned.forEach(p => {
            if(state?.id && p.id === state?.id) {
                if(!pinnedProperties[p.id]) setLngLat([p.lng, p.lat]);
                else setLngLat([pinnedProperties[p.id].lng, pinnedProperties[p.id].lat]);
            }
            const {lng, lat} = p;
            if(!pinnedProperties[p.id]) {
                allMarkers.push({ 
                    propertyId: p.id, 
                    pinned: true,
                    lngLat: [lng, lat] 
                });
                pinnedProperties[p.id] = {...p};
            } else {
                allMarkers.push({ 
                    propertyId: p.id, 
                    pinnned: true,
                    lngLat: [pinnedProperties[p.id].lng, pinnedProperties[p.id].lat] 
                });
            };
        });

        propertyStore.other.forEach(p => {
            if(state?.id && p.id === state?.id) {
                if(!otherProperties[p.id]) setLngLat([p.lng, p.lat]);
                else setLngLat([otherProperties[p.id].lng, otherProperties[p.id].lat]);
            }
            const {lng, lat} = p;
            if(!otherProperties[p.id]) {
                allMarkers.push({ 
                    propertyId: p.id, 
                    pinned: false,
                    lngLat: [lng, lat] 
                });
                otherProperties[p.id] = {...p};
            } else {
                allMarkers.push({ 
                    propertyId: p.id, 
                    pinned: false,
                    lngLat: [otherProperties[p.id].lng, otherProperties[p.id].lat] 
                });
                console.log("PROP HAS ID:", p.id, " PROP:", otherProperties)
            };
        });

        if(pointStore?.data.length) {
            console.log("POINTS DATA ADDING", pointStore?.data);

            pointStore.data.map(prev => {
                let p;
                if(points[prev.id]) {
                    console.log("USING PREVIOUS POINT", points[prev])
                    p = points[prev.id];
                } else {
                    console.log("USING UNSAVED POINT", prev)
                    points[prev.id] = prev;
                    p = prev;
                }

                switch(p.type) {
                    case "icon":
                        allMarkers.push({
                            pointId: p.id,
                            type: p.type,
                            name: p.name,
                            icon: p.icon,
                            lngLat: [p.lng, p.lat]
                        });
                        break
                    case "marker":
                        allMarkers.push({
                            pointId: p.id,
                            type: p.type,
                            name: p.name,
                            lngLat: [p.lng, p.lat]
                        });
                        break
                    case "radius":
                        allMarkers.push({
                            pointId: p.id,
                            type: p.type,
                            name: p.name,
                            radius: p.radius,
                            lngLat: [p.lng, p.lat]
                        });
                        break
                }
            });
        }

        const stored = localStorage.getItem("canvasObjects");
        const parsed = JSON.parse(stored)
        if(parsed && Date.now() > parsed?.expires) {
            localStorage.removeItem("canvasObjects");
        }
        console.log("PARSED OBJ DATA:", parsed?.data)
        
        if(parsed?.data) {
            setCanvasObjects(parsed?.data);
            console.log("PARSED OBJ VALUES:", Object.values(parsed?.data))
            Object.values(parsed?.data).map(p => {
                switch(p.type) {
                    case "icon":
                        allMarkers.push({
                            id: p.id,
                            type: p.type,
                            name: p.name,
                            icon: p.icon,
                            lngLat: [p.lng, p.lat]
                        });
                        break
                    case "marker":
                        allMarkers.push({
                            id: p.id,
                            type: p.type,
                            name: p.name,
                            lngLat: [p.lng, p.lat]
                        });
                        break
                    case "radius":
                        allMarkers.push({
                            id: p.id,
                            type: p.type,
                            name: p.name,
                            radius: p.radius,
                            lngLat: [p.lng, p.lat]
                        });
                        break
                }
            })
        }
        setLoaded(true);
        setMarkers(allMarkers);
    }, [propertyStore, pointStore]);

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


    useEffect(()=> {
        if(!loaded) return;
        localStorage.setItem("canvasObjects", JSON.stringify({
            data: canvasObjects,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
    }, [canvasObjects]);

    useEffect(()=> {
        if(!loaded) return;
        localStorage.setItem("pinnedProperties", JSON.stringify({
            data: pinnedProperties,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
    }, [pinnedProperties]);

    useEffect(()=> {
        if(!loaded) return;
        localStorage.setItem("otherProperties", JSON.stringify({
            data: otherProperties,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
    }, [otherProperties]);

    useEffect(()=> {
        if(!loaded) return;
        localStorage.setItem("points", JSON.stringify({
            data: points,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
    }, [points]);
    

    const selectMenu = (e, val) => {
        e.preventDefault();
        
        // No teams now
        ["map", "draw", "render-page", "exports"].forEach(m => {
            const currMenu = document.getElementById(`menu-${m}`);
            const menuItem = document.getElementById(`menu-item-${m}`);
            const slider = document.getElementById("menu-tools");

            if(m === val) {
                currMenu.classList.toggle("menu-active");
                menuItem.classList.toggle("hidden");

                if(menuItem.className.includes("hidden")) {
                    slider.classList.toggle("closed", true);
                } else {
                    slider.classList.toggle("closed", false);
                };
            } else {
                currMenu.classList.toggle("menu-active", false);
                menuItem.classList.toggle("hidden", true);
            };
        });
    };

    const selectCanvasAddon = (icon, name, type="icon") => {
        if(canvasSelect.icon === icon && canvasSelect.name === name) {
            setCanvasSelect({icon: null, name: null, type: null});
            return;
        };

        setCanvasSelect({icon, name, type});
    };

    const addCanvasObjects = (obj) => {
        if(obj.propertyId) {
            console.log("PROPERTIES CHANGE HITT")
            if(pinnedProperties[obj.propertyId]) {
                console.log("SETTING NEW/UNSAVED PINNED PROPERTY ID:", obj.propertyId,
                    " PINNED PROPETIES:", pinnedProperties,
                    "OBJECT:", obj
                )
                setPinnedProperties(p => {
                    const copy = {...p};
                    const update = copy[obj.propertyId]
                    if(!update.name.includes("(Unsaved)")) {
                        update.name = "(Unsaved) " + update.name;
                    }
                    update.lat = obj.lat;
                    update.lng = obj.lng;
                    return copy
                });
            } else if(otherProperties[obj.propertyId]) {
                console.log("SETTING NEW/UNSAVED OTHER PROPERTY ID:", obj.propertyId,
                    " OTHER PROPETIES:", otherProperties,
                    "OBJECT:", obj
                )
                setOtherProperties(p => {
                    const copy = {...p};
                    const update = copy[obj.propertyId]
                    if(!update.name.includes("(Unsaved)")) {
                        update.name = "(Unsaved) " + update.name;
                    }
                    update.lat = obj.lat;
                    update.lng = obj.lng;
                    return copy
                });
            };
            return;
        } else if(obj.pointId) {
            return setPoints(p => {
                const copy = {...p};

                if(copy[obj.pointId]) {
                    copy[obj.pointId].lng = obj.lng;
                    copy[obj.pointId].lat = obj.lat;
                    if(!copy[obj.pointId].name.includes("(Unsaved")) {
                        copy[obj.pointId].name = "(Unsaved) " + copy[obj.pointId].name;
                    };
                    if(copy[obj.pointId].type === "radius") {
                        copy[obj.pointId].radius = obj.radius;
                    };
                } else {
                    switch(copy[obj.pointId].type) {
                        case "icon":
                            copy[obj.pointId] = {
                                pointId: obj.id,
                                type: obj.type,
                                name: obj.name,
                                icon: obj.icon,
                                lng: obj.lng,
                                lat: obj.lat
                            };
                            break;
                        case "marker":
                            copy[obj.pointId] = {
                                pointId: obj.id,
                                type: obj.type,
                                name: obj.name,
                                lng: obj.lng,
                                lat: obj.lat
                            };
                            break;
                        case "radius":
                            copy[obj.pointId] = {
                                pointId: obj.id,
                                type: obj.type,
                                name: obj.name,
                                radius: obj.radius,
                                lng: obj.lng,
                                lat: obj.lat
                            };
                            break;
                    };
                };
                // console.log("COPY SET", copy[obj.pointId]);
                return copy;
            });
        };
        
        setCanvasObjects(prev => {
            const copy = {...prev};

            console.log("CANVAS RECIEVED OBJECT", obj);

            if(copy[obj.id]) {
                copy[obj.id].lng = obj.lng;
                copy[obj.id].lat = obj.lat;
                if(copy[obj.id] === "radius") {
                    copy[obj.id].radius = obj.radius;
                };
            } else {
                copy[obj.id] = {...obj};
                copy[obj.id].name = "New " + obj.type;
            };
            console.log("FINISHED CANVAS OBJECT", copy[obj.id])
            return copy;
        });
    };

    const deleteCanvasObjects = (id) => {
        console.log("DELETION ID", id);
        console.log("AT DELETION OTHER PROPERTIES", otherProperties);
        console.log("AT DELETION POINTS", points);
        const split = id.split("-");
        console.log("SPLIT ID:", split)

        switch(split[0]) {
            case "temp":
                setCanvasObjects(prev => {
                    const copy = {...prev};
                    delete copy[id];
                    return copy;
                });
                return;
            case "prop":
                if(pinnedProperties[split[1]]) {
                    const p_id = Number(split[1])
                    setDeletedProperties(p => ({
                        ...p,
                        pinned: [...p.pinned, p_id]
                    }));
                    setPinnedProperties(p => {
                        const copy = {...p};
                        delete copy[p_id];
                        return copy;
                    });
                } else if (otherProperties[split[1]]) {
                    console.log("OTHER PROP")
                    const p_id = Number(split[1])
                    setDeletedProperties(p => ({
                        ...p,
                        other: [...p.pinned, p_id]
                    }));
                    setOtherProperties(p => {
                        const copy = {...p};
                        delete copy[p_id];
                        return copy;
                    });
                }
                return;
            case "icon":
            case "marker":
            case "radius":
                console.log("POINT DETECT")
                const p_id = Number(split[1])
                setDeletedPoints(p => [...p, p_id]);
                setPoints(p => {
                    const copy = {...p};
                    delete copy[p_id];
                    return copy;
                })
                return;
        }
    }

    const handleSave = async (e) => {
        console.log("SAVING HIT")
        e.preventDefault();

        const storedPinnedProps = localStorage.getItem("pinnedProperties");
        const storedOtherProps = localStorage.getItem("otherProperties");
        const storedCanvasObjs = localStorage.getItem("canvasObjects");
        let parsed = JSON.parse(storedPinnedProps);

        if(parsed?.data) {
            try {
                const createProp = {...parsed?.data};
                await Promise.all(
                    propertyStore.pinned.map(p => {
                        if(createProp[p.id]) {
                            if(createProp[p.id].name.includes("(Unsaved)")) {
                                createProp[p.id].name = createProp[p.id].name
                                    .split("(Unsaved)")[1]
                                    .trim();
                            }
                            const edit = dispatch(thunkEditProperty(p.id, createProp[p.id]));
                            delete createProp[p.id];
                            return edit;
                        };
                    })
                )
                if(Object.keys(createProp).length) {
                    await Promise.all(
                        Object.values(createProp).map(p=> {
                            if(p.name.includes("(Unsaved)")) {
                                p.name = p.name.split("(Unsaved)")[1].trim();
                            }
                            return dispatch(thunkCreateProperty(p))
                        })
                    );
                }
                if(deletedProperties.pinned.length) {
                    await Promise.all(
                        deletedProperties.pinned.map(id => { 
                            return dispatch(thunkDeleteProperty(id)) 
                        })
                    );
                }
                localStorage.removeItem("pinnedProperty");
            } catch(e) {
                console.error("Failed to save other properties, quitting before other properties, and points", e);
                return;
            }
        }
        parsed = JSON.parse(storedOtherProps);

        if(parsed?.data) {
            try{
                const createProp = {...parsed?.data};
                await Promise.all(
                    propertyStore.other.map(p => {
                        if(createProp[p.id]) {
                            if(createProp[p.id].name.includes("(Unsaved)")) {
                                createProp[p.id].name = createProp[p.id].name
                                    .split("(Unsaved)")[1]
                                    .trim();
                            }
                            const edit = dispatch(thunkEditProperty(p.id, createProp[p.id]));
                            delete createProp[p.id];
                            return edit;
                        };
                    })
                );
                if(Object.keys(createProp).length) {
                    await Promise.all(
                        Object.values.map(p => {
                            if(p.name.includes("(Unsaved)")) {
                                p.name = p.name.split("(Unsaved)")[1].trim();
                            }
                            return dispatch(thunkCreateProperty(p));
                        })
                    );
                };
                if(deletedProperties.other.length) {
                    await Promise.all(
                        deletedProperties.other.map(id => { 
                            return dispatch(thunkDeleteProperty(id)) 
                        })
                    );
                }
                localStorage.removeItem("otherProperties");
            }
            catch(e) {
                console.error("Failed to save other properties, quitting before points", e);
                return;
            }
        }
        
        parsed = JSON.parse(storedCanvasObjs);

        if(parsed?.data) {
            try {
                const createPoint = {...parsed?.data};
                await Promise.all(
                    pointStore.data.map(p => {
                        if(createPoint[p.id]) {
                            if(createPoint[p.id].name.includes("(Unsaved)")) {
                                createPoint[p.id].name = createPoint[p.id].name
                                    .split("(Unsaved)")[1]
                                    .trim();
                            }
                            const edit = dispatch(thunkEditPoint(p.id, createPoint[p.id]));
                            delete createPoint[p.id];
                            return edit;
                        };
                    })
                );
                if(Object.keys(createPoint).length) {
                    await Promise.all(
                        Object.values(createPoint).map(p => {
                            if(p.name.includes("(Unsaved)")) {
                                p.name = p.name.split("(Unsaved)")[1].trim();
                            }
                            return dispatch(thunkCreatePoint(p));
                        })
                    )
                };
                if(deletedPoints.length) {
                    await Promise.all(
                        deletedPoints.map(id => {
                            return dispatch(thunkDeletePoint(id));
                        })
                    );
                };
                localStorage.removeItem("points");
            } catch(e) {
                console.error("Failed to save points", e);
                return;
            }
        }

        setCanvasObjects({});
    }

    return (<>
    {loaded && (
    <div id="editor" className="user-select-none">
        <div id="editor-top">
            <div className="editor-search" ref={searchRef}>
                <input 
                    type="text" 
                    name="search" 
                    className="app-searchbar user-select-none"
                    placeholder="🔍 Search Location..."
                    value={search}
                    onFocus={()=> setSearchActive(true)}
                    onBlur={()=> setSearchActive(false)}
                    onChange={(e)=> setSearch(e.target.value)}
                />
                {searchActive && search.length > 0 && (
                    <div className="search-results">
                        {search?.length > 2 ? (
                            <>
                            {searchResults?.length > 0 ? searchResults?.map((result, i) => (
                                <div 
                                    key={`search-${i}`}
                                    className="search-result"
                                    onMouseDown={()=> {
                                        setLngLat([result.lng, result.lat]);
                                        setSearchActive(false);
                                    }}
                                >
                                    {result.text}
                                </div>
                            )) : (
                                <p className="user-select-none">Searching...</p>
                            )}
                            </>
                        ) : (
                            <p className="user-select-none">Searching after 3 characters...</p>
                        )}
                    </div>
                )}
            </div>

            <div className="editor-controls">
                <button
                    className="user-select-none"
                    onClick={handleSave}
                    disabled={!Object.keys(otherProperties) && !Object.keys(pinnedProperties) && !canvasObjects.length}
                >Save All</button>

                <button 
                    className="user-select-none" 
                    onClick={()=> navigate("/dashboard")}
                >Exit to Dashboard</button>
            </div>
        </div>

        <div id="editor-main">
            <div className="app-slider">
                <ul className="menu">
                    <li 
                        id="menu-map"
                        className="menu-active user-select-none"
                        onClick={(e)=> selectMenu(e, "map")}
                    >
                        <img src="/icons/map.svg" alt="Map" />
                    </li>
                    <li 
                        id="menu-draw"
                        className="user-select-none"
                        onClick={(e)=> selectMenu(e, "draw")}
                    >
                        <img src="/icons/design.svg" alt="Draw" />
                    </li>
                    <li
                        id="menu-render-page"
                        className="user-select-none"
                        onClick={(e)=> selectMenu(e, "render-page")}
                    >
                        <img src="/icons/home.svg" alt="Render Page" />
                    </li>
                    <li 
                        id="menu-exports"
                        className="user-select-none"
                        onClick={(e)=> selectMenu(e, "exports")}
                    >
                        <img src="/icons/export.svg" alt="Exports" />
                    </li>
                    {/* <li 
                        id="menu-teams"
                        className="user-select-none"
                        onClick={(e)=> selectMenu(e, "teams")}
                    >
                        <img src="/icons/team.svg" alt="Teams" />
                    </li> */}
                </ul>

                <ul id={`menu-tools`}>
                    <li 
                        className="menu-item-container"
                        id="menu-item-map"
                    >
                        <div className="menu-item-title user-select-none">Maps</div>
                        <div className="menu-item-1-subtitle user-select-none">
                            Pinned
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 0: !m[0]}) )}
                            >
                                {menuSelects[0] ? "V" : "𐌡"}
                            </button>
                        </div>

                        {Object.keys(pinnedProperties).length > 0 && (
                            <div className={`${menuSelects[0] ? "" : "hidden"}`}>
                            {Object.values(pinnedProperties).map((p, i) => (
                            <div className="menu-item-1 user-select-none" key={`props-${i}`}>
                                <p>{p.name}</p>
                                <div className="menu-item-1-actions user-select-none">
                                    <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                        <img src="/icons/location.svg" alt="View" />
                                    </button>
                                    <button>
                                        <img src="/icons/setting.svg" alt="View" />
                                    </button>
                                </div>
                            </div>
                            ))}
                            </div>
                        )}

                        <div className="menu-item-1-subtitle user-select-none">
                            Properties
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 1: !m[1]}) )}
                            >
                                {menuSelects[1] ? "V" : "𐌡"}
                            </button>
                        </div>
                        {Object.keys(otherProperties).length > 0 && (
                            <div className={`${menuSelects[1] ? "" : "hidden"}`}>
                            {Object.values(otherProperties).map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`props-${i}`}>
                                    <p>{p.name}</p>
                                    <div className="menu-item-1-actions user-select-none">
                                        <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                            <img src="/icons/location.svg" alt="View" />
                                        </button>
                                        <button>
                                            <img src="/icons/setting.svg" alt="View" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}
                        <div className="menu-item-1-subtitle user-select-none">
                            Points
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 2: !m[2]}))}
                            >
                                {menuSelects[2] ? "V" : "𐌡"}
                            </button>
                        </div>
                        {Object.keys(points)?.length > 0 && (
                            <div className={`${menuSelects[2] ? "" : "hidden"}`}>
                                {Object.values(points).map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`unsaved-p-${i}`}>
                                    <p>{p.name}</p>
                                    <div className="menu-item-1-actions user-select-none">
                                        <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                            <img src="/icons/location.svg" alt="View" />
                                        </button>
                                        <button>
                                            <img src="/icons/setting.svg" alt="View" />
                                        </button>
                                    </div>
                                </div>
                                ))}
                            </div>
                        )}
                        <div className="menu-item-1-subtitle user-select-none">
                            Unsaved Points
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 3: !m[3]}))}
                            >
                                {menuSelects[3] ? "V" : "𐌡"}
                            </button>
                        </div>
                        {Object.keys(canvasObjects)?.length > 0 && (
                            <div className={`${menuSelects[3] ? "" : "hidden"}`}>
                                {Object.values(canvasObjects).map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`unsaved-p-${i}`}>
                                    <p>{p.name}</p>
                                    <div className="menu-item-1-actions user-select-none">
                                        <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                            <img src="/icons/location.svg" alt="View" />
                                        </button>
                                        <button>
                                            <img src="/icons/setting.svg" alt="View" />
                                        </button>
                                    </div>
                                </div>
                                ))}
                            </div>
                        )}
                    </li>
                    <li
                        className="menu-item-container hidden"
                        id="menu-item-draw"
                    >
                        <div className="menu-item-title user-select-none">Draw</div>

                        <div className="menu-item-1-subtitle user-select-none">
                            Basic Tools
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 2: !m[2]}))}
                            >
                                {menuSelects[2] ? "V" : "𐌡"}
                            </button>
                        </div>

                        <div className={`menu-item-2-container ${menuSelects[2] ? "" : "hidden"}`}>
                            <div 
                                className={`menu-item-2 ${
                                    canvasSelect.name === "marker" &&
                                    canvasSelect.type === "marker" ? "selected" : ""
                                }`}
                                onClick={()=> selectCanvasAddon(null, "marker", "marker")}
                            >
                                <img src="/icons/point.svg" alt="Marker" />
                                <p>Marker</p>
                            </div>

                            <div 
                                className={`menu-item-2 ${
                                    canvasSelect.name === "radius" &&
                                    canvasSelect.type === "radius" ? "selected" : ""
                                }`}
                                onClick={()=> selectCanvasAddon(null, "radius", "radius", {size: "6"})}
                            >
                                <img src="/icons/radius.svg" alt="Radius" />
                                <p>Radius</p>
                            </div>
                        </div>

                        <div className="menu-item-1-subtitle user-select-none">
                            Amenities
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 3: !m[3]}) )}
                            >
                                {menuSelects[3] ? "V" : "𐌡"}
                            </button>
                        </div>

                        <div className={`menu-item-2-container ${menuSelects[3] ? "" : "hidden"}`}>
                            {amenities?.map((a, i) => (
                                <div 
                                    className={`menu-item-2 ${
                                        canvasSelect.icon === a.emoji && 
                                        canvasSelect.name === a.name ? "selected" : ""
                                    }`}
                                    key={`amentity-${i}`}
                                    onClick={()=> selectCanvasAddon(a.emoji, a.name)}
                                >
                                    <p>{a.emoji}</p>
                                    <p>{a.name}</p>
                                </div>
                            ))}
                        </div>

                        <div className="menu-item-1-subtitle user-select-none">
                            Emergencies
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 4: !m[4]}) )}
                            >
                                {menuSelects[4] ? "V" : "𐌡"}
                            </button>
                        </div>

                        <div className={`menu-item-2-container ${menuSelects[4] ? "" : "hidden"}`}>
                            {emergencies?.map((e, i) => (
                                <div 
                                    className={`menu-item-2 ${
                                        canvasSelect.icon === e.emoji && 
                                        canvasSelect.name === e.name ? "selected" : ""
                                    }`}
                                    key={`emergency-${i}`}
                                    onClick={()=> selectCanvasAddon(e.emoji, e.name)}
                                >
                                    <p>{e.emoji}</p>
                                    <p>{e.name}</p>
                                </div>
                            ))}
                        </div>

                        <div className="menu-item-1-subtitle user-select-none">
                            Buildings
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 5: !m[5]}) )}
                            >
                                {menuSelects[5] ? "V" : "𐌡"}
                            </button>
                        </div>

                        <div className={`menu-item-2-container ${menuSelects[5] ? "" : "hidden"}`}>
                            {buildings?.map((b, i) => (
                                <div 
                                    className={`menu-item-2 ${
                                        canvasSelect.icon === b && 
                                        canvasSelect.name === "building" ? "selected" : ""
                                    }`}
                                    key={`build-${i}`}
                                    onClick={()=> selectCanvasAddon(b, "building")}
                                >
                                    {b}
                                </div>
                            ))}
                        </div>
                    </li>
                    <li 
                        className="hidden menu-item-container"
                        id="menu-item-render-page"
                    >3</li>
                    <li 
                        className="hidden menu-item-container"
                        id="menu-item-exports"
                    >4</li>
                    {/* <li 
                        className="hidden menu-item-container"
                        id="menu-item-teams"
                    >5</li> */}
                </ul>
            </div>

            <span className="popup-span">
                <div className="popup">

                    <div className="popup-controls">
                        <p className="popup-title user-select-none">Map Layers</p>
                        <button 
                            className="popup-minimize user-select-none"
                            onClick={()=> setPopups(p => ({...p, 0: !p[0] }) )}
                        >{popups[0] ? "V" : "𐌡"}</button>
                    </div>

                    <div className={`popup-screen ${popups[0] ? "" : "hidden"}`}>
                        <div className="popup-radio">
                            <div className="map-layer-option">
                                <label 
                                    htmlFor="base-map-radio"
                                    className="user-select-none"
                                >Toggle OSM</label>
                                <input 
                                    type="radio" 
                                    name="base-map-radio" 
                                    id="base-map-radio"
                                    checked={layer === "osm-layer"}
                                    onChange={()=> setLayer("osm-layer")} 
                                />
                            </div>

                            <div className="map-layer-option">
                                <label 
                                    htmlFor="base-map-radio"
                                    className="user-select-none"
                                >Toggle Satellite</label>
                                <input 
                                    type="radio" 
                                    name="satellite-map-radio" 
                                    id="satellite-map-radio"
                                    checked={layer === "satellite-layer"}
                                    onChange={()=> setLayer("satellite-layer")} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </span>

            <MapComponent 
                layer={layer} 
                lngLat={lngLat} 
                markers={markers} 
                canvasTool={canvasSelect}
                createdCanvasObject={addCanvasObjects}
                deletedCanvasObject={deleteCanvasObjects}
            />             
        </div>
    </div>
    )}
    </>)
}