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
import { ModalButton } from "../../context/Modal";
import ManagePointsModal from "../ManagePointsModal";

export default function EditorPage() {
    // LOADING AND STATE
    const { state } = useLocation()
    const propertyStore = useSelector(store => store.properties);
    const pointStore = useSelector(store => store.points);
    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [err, setErr] = useState({});

    // MAIN DATA
    const [otherProperties, setOtherProperties] = useState({});
    const [pinnedProperties, setPinnedProperties] = useState({});
    const [points, setPoints] = useState({});
    const [canvasObjects, setCanvasObjects] = useState({});

    // DELETION TRACKING
    const [deletedProperties, setDeletedProperties] = useState({pinned: [], other: []})
    const [deletedPoints, setDeletedPoints] = useState([]);

    // MAP VARIABLES
    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [markers, setMarkers] = useState([]); // [{id: propertyId: int(1), lngLat: [lng, lat]}, {...}]
    const [layer, setLayer] = useState("osm-layer");
    const [canvasSelect, setCanvasSelect] = useState({icon: null, name: null, type: null});
    const [pointChange, setPointChange] = useState({});

    // SEARCH
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchActive, setSearchActive] = useState(true);

    // PAGE VARIABLES
    const [popups, setPopups] = useState({});
    const [menuSelects, setMenuSelects] = useState({});
    const [menu, setMenu] = useState("map") // "map", "draw", "teams", "render-page", "exports"
    
    // TEMP DATA
    const [buildings, setBuildings] = useState(["A", "B", "C", "D", "E", "F", "G"]);
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
    
    // ETC
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
        console.log("INITIALIZED CHANGED", initialized);
    }, [initialized]);

    // LOADING USESTATES
    useEffect(()=> {
        const initialData = async () => {
            await dispatch(thunkGetAllProperties());
            await dispatch(thunkGetAllPoints());

            let stored = localStorage.getItem("pinnedProperties");
            let parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("pinnedProperties");
            }
            else if(parsed) {
                console.log("PARSED PINNED", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setPinnedProperties(parsed.data);
            }

            stored = localStorage.getItem("otherProperties");
            parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("otherProperties");
            }
            else if(parsed) {
                console.log("PARSED OTHER", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setOtherProperties(parsed.data);
            }

            stored = localStorage.getItem("points");
            parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("points");
            }
            else if(parsed) {
                console.log("PARSED points", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setPoints(parsed.data);
            }

            stored = localStorage.getItem("canvasObjects");
            parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("canvasObjects");
            }
            else if(parsed) {
                console.log("PARSED CANVAS OBJS", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setCanvasObjects(parsed.data);
            }

            setInitialized(true);
        }
        initialData();
    }, []);

    useEffect(()=> {
        console.log("Properties", propertyStore);
        console.log("SAVED PROP FROM LOCAL", otherProperties);
        console.log("POINTS from STORE", pointStore);
        console.log("SAVED POINTS", points);
        console.log("DELETE TESSSSSSSSSSSSSSSSTT", Object.keys(canvasObjects).length)
        if(!initialized) {
            console.error("Not Initialized")
            return;
        }

        if (
            !propertyStore?.pinned.length && 
            !propertyStore?.other.length &&
            !pointStore?.data.length &&
            !Object.keys(canvasObjects)?.length
        ) {    
            setLoaded(true);
            return;
        }
        
        const allMarkers = [];

        propertyStore?.pinned.forEach(prev => {
            let p;
            if(pinnedProperties[prev.id]) {
                p = pinnedProperties[prev.id];
            }
            else {
                p = {...prev};
                pinnedProperties[p.id] = p;
            }
            console.log("P PINNED", p)
            const {lng, lat} = p;
            if(state?.id && p.id === state?.id) setLngLat([lng, lat]);
            
            allMarkers.push({ 
                propertyId: p.id, 
                pinned: true,
                lngLat: [lng, lat] 
            });

            if(!p.name.includes("-")) {
                pinnedProperties[prev.id].propertyId = p.id;
                pinnedProperties[prev.id].id = `prop-${p.id}`;
            };
        });

        propertyStore?.other.forEach(prev => {
            let p;
            if(otherProperties[prev.id]) {
                p = otherProperties[prev.id];
            }
            else {
                p = {...prev};
                otherProperties[p.id] = p;
            }
            console.log("P OTHER", p)
            const {lng, lat} = p;
            if(state?.id && p.id === state?.id) setLngLat([lng, lat]);
            
            allMarkers.push({ 
                propertyId: p.id, 
                pinned: true,
                lngLat: [lng, lat] 
            });

            if(!p.name.includes("-")) {
                console.log("OTHER PROP CHANGE")
                otherProperties[prev.id].propertyId = p.id;
                otherProperties[prev.id].id = `prop-${p.id}`;
            };
        });

        pointStore?.data.forEach(prev => {
            let p;
            if(points[prev.id]) {
                p = points[prev.id];
            } else {
                p = {...prev};
                points[prev.id] = p;
            }
            const pointObj = {
                pointId: p.id,
                type: p.type,
                name: p.name,
                lngLat: [p.lng, p.lat]
            }

            switch(p.type) {
                case "marker":
                    allMarkers.push(pointObj);
                    break
                case "icon":
                    pointObj.icon = p.icon
                    allMarkers.push(pointObj);
                    break
                case "radius":
                    pointObj.radius = p.radius;
                    allMarkers.push(pointObj);
                    break
            }

            if(!p.name.includes("-")) {
                console.log("POINT CHANGE")
                points[prev.id].pointId = p.id;
                points[prev.id].id = `${p.type}-${p.id}`;
            };
        });
        
        if(Object.keys(canvasObjects ?? {}).length > 0) {
            Object.values(canvasObjects).forEach(p => {
                const pointObj = {
                    id: p.id,
                    type: p.type,
                    name: p.name,
                    lngLat: [p.lng, p.lat]
                }

                switch(p.type) {
                    case "marker":
                        allMarkers.push(pointObj);
                        break
                    case "icon":
                        pointObj.icon = p.icon
                        allMarkers.push(pointObj);
                        break
                    case "radius":
                        pointObj.radius = p.radius;
                        allMarkers.push(pointObj);
                        break
                };
            });
        };
        
        setLoaded(true);
        setMarkers(allMarkers);
    }, [initialized]);

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

    useEffect(()=> {
        if(!loaded) return;
        localStorage.setItem("canvasObjects", JSON.stringify({
            data: canvasObjects,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
    }, [canvasObjects]);

    function validatePoint(obj) {
        const allowedKeys = [
            "pointId",
            "propertyId",
            "id",
            "type",
            "name",
            "lng",
            "lat",
            "icon",
            "radius"
        ];
        for(const key of Object.keys(obj)) {
            if(!allowedKeys.includes(key)) {
                throw new Error(`Invalid property: ${key}`);
            };
        }
        if(!obj.pointId && !obj.propertyId && !obj.id) throw new Error("Missing id");
        if (!obj.lng) throw new Error("Missing lng");
        if (!obj.lat) throw new Error("Missing lat");
        if (typeof obj.lng !== "number") throw new Error("lng must be number");
        if (typeof obj.lat !== "number") throw new Error("lat must be number");
    }
    

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
        validatePoint(obj);
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
                const existing = p[obj.pointId];
                const updated = existing
                    ? {...existing, ...obj}
                    : {...obj};
                
                if(!updated.name?.includes("(Unsaved)")) {
                    updated.name = "(Unsaved) " + updated.name;
                }
                // console.log("COPY SET", copy);
                return {
                    ...p,
                    [obj.pointId]: updated
                };
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
        // console.log("AT DELETION OTHER PROPERTIES", otherProperties);
        // console.log("AT DELETION POINTS", points);
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
                        other: [...p.other, p_id]
                    }));
                    setOtherProperties(p => {
                        const copy = {...p};
                        delete copy[p_id];
                        return copy;
                    });
                };
                return;
            case "icon":
            case "marker":
            case "radius":
                console.log("POINT DETECT")
                const p_id = Number(split[1])
                setDeletedPoints(p => [...p, p_id]);
                setPoints(p => {
                    const copy = {...p};
                    console.log("P DELETE", copy)
                    delete copy[p_id];
                    return copy;
                });
                return;
        };
    };

    const handleSaveAll = async (e) => {
        console.log("SAVING HIT")
        e.preventDefault();

        const storedPinnedProps = localStorage.getItem("pinnedProperties");
        const storedOtherProps = localStorage.getItem("otherProperties");
        const storedCanvasObjs = localStorage.getItem("canvasObjects");
        let parsed = storedPinnedProps ? JSON.parse(storedPinnedProps) : null;

        if(parsed?.data) {
            try {
                const createProp = {...parsed?.data};
                console.log("SAVE PINNED PROP DATA", createProp);
                await Promise.all(
                    propertyStore.pinned.map(p => {
                        if(createProp[`prop-${p.id}`]) {
                            if(createProp[`prop-${p.id}`].name.includes("(Unsaved)")) {
                                createProp[`prop-${p.id}`].name = createProp[`prop-${p.id}`].name
                                    .split("(Unsaved)")[1]
                                    .trim();
                            }
                            const edit = dispatch(thunkEditProperty(p.id, createProp[`prop-${p.id}`]));
                            delete createProp[`prop-${p.id}`];
                            return edit;
                        };
                    })
                );
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
                if(deletedProperties.pinned.length > 0) {
                    await Promise.all(
                        deletedProperties.pinned.map(id => { 
                            return dispatch(thunkDeleteProperty(id))
                        })
                    );
                }
                localStorage.removeItem("pinnedProperties");
            } catch(e) {
                console.error("Failed to save other properties, quitting before other properties, and points", e);
                return;
            };
        };

        parsed = storedOtherProps ? JSON.parse(storedOtherProps) : null;
        if(parsed?.data) {
            try{
                const createProp = {...parsed?.data};
                console.log("SAVE OTHER PROP DATA", createProp);
                await Promise.all(
                    propertyStore.other.map(p => {
                        if(createProp[`prop-${p.id}`]) {
                            if(createProp[`prop-${p.id}`].name.includes("(Unsaved)")) {
                                createProp[`prop-${p.id}`].name = createProp[`prop-${p.id}`].name
                                    .split("(Unsaved)")[1]
                                    .trim();
                            }
                            const edit = dispatch(thunkEditProperty(p.id, createProp[`prop-${p.id}`]));
                            delete createProp[`prop-${p.id}`];
                            return edit;
                        };
                    })
                );
                if(Object.keys(createProp ?? {}).length) {
                    await Promise.all(
                        Object.values(createProp).map(p => {
                            if(p.name.includes("(Unsaved)")) {
                                p.name = p.name.split("(Unsaved)")[1].trim();
                            }
                            return dispatch(thunkCreateProperty(p));
                        })
                    );
                };
                if(deletedProperties.other.length > 0) {
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
            };
        };
        
        parsed = storedCanvasObjs ? JSON.parse(storedCanvasObjs) : null;

        if(parsed?.data) {
            try {
                const createPoint = {...parsed?.data};
                console.log("SAVE OTHER PROP DATA", createPoint);
                await Promise.all(
                    pointStore.data.map(p => {
                        console.log("P IN MAP", p)
                        console.log("POINT IN MAP", createPoint)
                        if(createPoint[`${p.type}-${p.id}`]) {
                            if(createPoint[`${p.type}-${p.id}`].name.includes("(Unsaved)")) {
                                createPoint[`${p.type}-${p.id}`].name = createPoint[`${p.type}-${p.id}`].name
                                    .split("(Unsaved)")[1]
                                    .trim();
                            }
                            const edit = dispatch(thunkEditPoint(p.id, createPoint[`${p.type}-${p.id}`]));
                            delete createPoint[`${p.type}-${p.id}`];
                            return edit;
                        };
                    })
                );
                console.log("SAVED EDIT POINTS PASSED, CURRENT:", createPoint)
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
                console.log("SAVED CREATE POINTS PASSED, CURRENT:", createPoint)
                if(deletedPoints.length > 0) {
                    await Promise.all(
                        deletedPoints.map(id => {
                            return dispatch(thunkDeletePoint(id));
                        })
                    );
                };
                console.log("SAVED DELETE POINTS PASSED, CURRENT:", createPoint)
                localStorage.removeItem("points");
            } catch(e) {
                console.error("Failed to save points", e);
                return;
            };
        };
        setCanvasObjects({});
        setDeletedPoints([]);
        setDeletedProperties([{ pinned: [], other: [] }]);
    };

    function signalPointUpdate(id, changesObj) {
        console.log("ICON CHANGED SIGNAL 2: EDITOR")
        return setPointChange({id: id, updates: changesObj});
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
                    onClick={handleSaveAll}
                    // disabled={
                    //     Object.keys(canvasObjects ?? {}).length === 0 &&
                    //     deletedProperties.pinned.length === 0 &&
                    //     deletedProperties.other.length === 0 &&
                    //     deletedPoints.length === 0
                    //  }
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

                        {Object.keys(pinnedProperties ?? {}).length > 0 && (
                            <div className={`${menuSelects[0] ? "" : "hidden"}`}>
                            {Object.values(pinnedProperties).map((p, i) => (
                            <div className="menu-item-1 user-select-none" key={`props-${i}`}>
                                <p>{p.name}</p>
                                <div className="menu-item-1-actions user-select-none">
                                    <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                        <img src="/icons/location.svg" alt="Manage" />
                                    </button>
                                    <ModalButton 
                                        itemText={<img src="/icons/setting.svg" alt="Manage" />}
                                        modalComponent={<ManagePointsModal 
                                            point={p}
                                            isSaved={true}
                                            addFunc={addCanvasObjects}
                                            deleteFunc={deleteCanvasObjects}
                                            changeFunc={signalPointUpdate}
                                        />}
                                    />
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
                        {Object.keys(otherProperties ?? {}).length > 0 && (
                            <div className={`${menuSelects[1] ? "" : "hidden"}`}>
                            {Object.values(otherProperties).map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`props-${i}`}>
                                    <p>{p.name}</p>
                                    <div className="menu-item-1-actions user-select-none">
                                        <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                            <img src="/icons/location.svg" alt="Manage" />
                                        </button>
                                        <ModalButton 
                                            itemText={<img src="/icons/setting.svg" alt="Manage" />}
                                            modalComponent={<ManagePointsModal 
                                               point={p}
                                               isSaved={true}
                                               addFunc={addCanvasObjects}
                                               deleteFunc={deleteCanvasObjects}
                                               changeFunc={signalPointUpdate}
                                            />}
                                        />
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
                        {Object.keys(points ?? {}).length > 0 && (
                            <div className={`${menuSelects[2] ? "" : "hidden"}`}>
                                {Object.values(points).map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`unsaved-p-${i}`}>
                                    <p>{p.name}</p>
                                    <div className="menu-item-1-actions user-select-none">
                                        <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                            <img src="/icons/location.svg" alt="Manage" />
                                        </button>
                                        <ModalButton 
                                            itemText={<img src="/icons/setting.svg" alt="Manage" />}
                                            modalComponent={<ManagePointsModal 
                                               point={p}
                                               isSaved={true}
                                               addFunc={addCanvasObjects}
                                               deleteFunc={deleteCanvasObjects}
                                               changeFunc={signalPointUpdate}
                                            />}
                                        />
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
                                {Object.values(canvasObjects)?.map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`unsaved-p-${i}`}>
                                    <p>{p.name}</p>
                                    <div className="menu-item-1-actions user-select-none">
                                        <button onClick={()=> setLngLat([p.lng, p.lat])}>
                                            <img src="/icons/location.svg" alt="Go to" />
                                        </button>
                                        <ModalButton 
                                            itemText={<img src="/icons/setting.svg" alt="Manage" />}
                                            modalComponent={<ManagePointsModal 
                                               point={p}
                                               isSaved={false}
                                               addFunc={addCanvasObjects}
                                               deleteFunc={deleteCanvasObjects}
                                               changeFunc={signalPointUpdate}
                                            />}
                                        />
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
                updateObject={pointChange}
            />             
        </div>
    </div>
    )}
    </>)
}