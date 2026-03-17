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
import { handleSearchAddress, reverseLookupAddress } from "../../functions/search/search";

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
    const [reload, setReload] = useState(0);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyIndexRef = useRef(-1);
    const pendingHistoryRef = useRef(true);
    const [err, setErr] = useState({});

    // MAIN DATA
    const [properties, setProperties] = useState({});
    const [points, setPoints] = useState({});
    const [canvasObjects, setCanvasObjects] = useState({});

    // DELETION TRACKING
    const [deletedProperties, setDeletedProperties] = useState([])
    const [deletedPoints, setDeletedPoints] = useState([]);

    // MAP VARIABLES
    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [markers, setMarkers] = useState([]); // [{id: propertyId: int(1), lngLat: [lng, lat]}, {...}]
    const [layer, setLayer] = useState("osm-layer");
    const [canvasSelect, setCanvasSelect] = useState({icon: null, name: null, type: null});
    const [pointChange, setPointChange] = useState({});
    const [pointDelete, setPointDelete] = useState({});
    const [contextPoint, setContextPoint] = useState(null);

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
        console.log("SEARCH REF CHANGED", searchRef);
    }, [searchRef]);

    useEffect(()=> {
        console.log("CANVAS OBJECTS CHANGED", canvasObjects);
    }, [canvasObjects]);

    useEffect(()=> {
        console.log("INITIALIZED CHANGED", initialized);
    }, [initialized]);
    
    // EVENT LISTENERS
    useEffect(()=> {
        const closeMenu = () => {
            hideContextMenu();
        }
        document.addEventListener("click", closeMenu);
        return () => document.removeEventListener("click", closeMenu);
    }, [])

    // LOADING USESTATES
    useEffect(()=> {
        const initialData = async () => {
            await dispatch(thunkGetAllProperties());
            await dispatch(thunkGetAllPoints());

            let stored = localStorage.getItem("properties");
            let parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("properties");
            }
            else if(parsed?.data) {
                console.log("PARSED PINNED", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setProperties(parsed.data);
            }

            stored = localStorage.getItem("points");
            parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("points");
            }
            else if(parsed?.data) {
                console.log("PARSED points", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setPoints(parsed.data);
            }

            stored = localStorage.getItem("canvasObjects");
            parsed = stored ? JSON.parse(stored) : null;
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("canvasObjects");
            }
            else if(parsed?.data) {
                console.log("PARSED CANVAS OBJS", parsed)
                Object.values(parsed.data).forEach(p => validatePoint(p));
                setCanvasObjects(parsed.data);
            }

            stored = localStorage.getItem("deletedProperties");
            parsed = JSON.parse(stored);
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("deletedProperties")
            }
            else if (parsed?.data) {
                console.log("PARSED DELETED PROPS", parsed);
                setDeletedProperties([...parsed?.data]);
            }

            stored = localStorage.getItem("deletedPoints");
            parsed = JSON.parse(stored);
            if(parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("deletedPoints")
            }
            else if (parsed?.data) {
                console.log("PARSED DELETED POINTS", parsed);
                setDeletedPoints([...parsed?.data]);
            }

            setInitialized(true);
            setSaving(false);
        }
        initialData()
    }, [reload]);

    useEffect(()=> {
        console.log("Properties", propertyStore);
        console.log("SAVED PROP FROM LOCAL", properties);
        console.log("POINTS from STORE", pointStore);
        console.log("SAVED POINTS", points);
        console.log("DELETE TESSSSSSSSSSSSSSSSTT", Object.keys(canvasObjects).length)
        if(!initialized) {
            console.error("Not Initialized")
            return;
        }

        if (
            !propertyStore?.data.length && 
            !pointStore?.data.length &&
            !Object.keys(canvasObjects)?.length
        ) {    
            const initSnapshot = {
                properties: {...properties},
                points: {...points},
                canvasObjects: {...canvasObjects},
                deletedProperties: [...deletedProperties],
                deletedPoints: [...deletedPoints]
            };
            setHistory([initSnapshot]);
            historyIndexRef.current = 0;
            setHistoryIndex(0);
            setLoaded(true);
            return;
        }
        
        const allMarkers = [];
        const seenInStore = new Set();
        let newProperties = {...properties};
        let newPoints = {...points};
        let newCanvasObjects = {...canvasObjects};
        let newDeleteProperties = [...deletedProperties];
        let newDeletePoints = [...deletedPoints];

        propertyStore?.data.forEach(prev => {
            const prefixedKey = `prop-${prev.id}`;
            seenInStore.add(prefixedKey);

            if (!newProperties[prefixedKey]) {
                newProperties[prefixedKey] = {...prev, id: prefixedKey, propertyId: prev.id};
            };

            const p = newProperties[prefixedKey];
            const {lng, lat} = p;
            if(state?.id && p.id === state?.id) setLngLat([lng, lat]);
            
            allMarkers.push({ 
                id: prefixedKey,
                name: p.name,
                propertyId: prev.id,
                lngLat: [lng, lat] 
            });
        });

        pointStore?.data.forEach(prev => {
            const prefixedKey = `${prev.type}-${prev.id}`;
            seenInStore.add(prefixedKey);

            if (!newPoints[prefixedKey]) {
                newPoints[prefixedKey] = {...prev, id: prefixedKey, pointId: prev.id};
            };

            if(newCanvasObjects[prefixedKey]) delete newCanvasObjects[prefixedKey];

            const p = newPoints[prefixedKey];
            const pointObj = {
                id: prefixedKey,
                pointId: prev.id,
                type: prev.type,
                name: prev.name,
                lngLat: [p.lng, p.lat]
            };

            switch(p.type) {
                case "marker": allMarkers.push(pointObj); break;
                case "icon":
                    if(p.icon) {pointObj.icon = p.icon; allMarkers.push(pointObj);} 
                    else {
                        console.warn(`No icon detected on ${p.name}. Deleting on next save.`);
                        setDeletedPoints(prev => [...prev, p.id]);
                    }
                    break;
                case "radius":
                    if(p.radius) {pointObj.radius = p.radius; allMarkers.push(pointObj);} 
                    else {
                        console.warn(`No radius detected on ${p.name}. Deleting on next save.`);
                        setDeletedPoints(prev => [...prev, p.id]);
                    }
                    break;
                case "line":
                    if ((p.endLng && p.endLat) || (p.endlng && p.endlat)) {
                        pointObj.endLng = p.endlng ?? p.endLng;
                        pointObj.endLat = p.endlat ?? p.endLat;
                        allMarkers.push(pointObj);
                    } else {
                        console.warn(`No endLng or endLat detected on ${p.name}. Deleting on next save.`);
                        setDeletedPoints(prev => [...prev, p.id]);
                    }
                    break;
            };
        });
        
        Object.values(canvasObjects)
            .filter(p => !seenInStore.has(p))
            .forEach(p => {
                const pointObj = {
                    id: p.id,
                    type: p.type,
                    name: p.name,
                    lngLat: [p.lng, p.lat]
                }

                switch(p.type) {
                    case "marker": allMarkers.push(pointObj); break;
                    case "icon":
                        if(p.icon) {pointObj.icon = p.icon; allMarkers.push(pointObj);} 
                        else {
                            console.warn(`No icon detected on ${p.name}. Deleting on next save.`);
                            setDeletedPoints(prev => [...prev, p.id]);
                        }
                        break;
                    case "radius":
                        if(p.radius) {pointObj.radius = p.radius; allMarkers.push(pointObj);} 
                        else {
                            console.warn(`No radius detected on ${p.name}. Deleting on next save.`);
                            setDeletedPoints(prev => [...prev, p.id]);
                        }
                        break;
                    case "line":
                        if ((p.endLng && p.endLat) || (p.endlng && p.endlat)) {
                            pointObj.endLng = p.endlng ?? p.endLng;
                            pointObj.endLat = p.endlat ?? p.endLat;
                            allMarkers.push(pointObj);
                        } else {
                            console.warn(`No endLng or endLat detected on ${p.name}. Deleting on next save.`);
                            setDeletedPoints(prev => [...prev, p.id]);
                        }
                        break;
                };
            });

        const initSnapshot = {
            properties: {...properties},
            points: {...points},
            canvasObjects: {...canvasObjects},
            deletedProperties: [...deletedProperties],
            deletedPoints: [...deletedPoints]
        };
        setProperties(newProperties);
        setPoints(newPoints);
        setCanvasObjects(newCanvasObjects);
        setDeletedPoints(newDeletePoints);
        setHistory([initSnapshot]);
        historyIndexRef.current = 0;
        setHistoryIndex(0);
        setLoaded(true);
        setInitialized(false);
        setMarkers(allMarkers);
        console.log("SENDING MARKERS:", allMarkers, "BASE DATA:", {
            pinned: propertyStore?.pinned,
            other: propertyStore?.other,
            points: pointStore?.data,
            canvasObjects
        })
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
        if(!loaded || saving) return;
        localStorage.setItem("properties", JSON.stringify({
            data: properties,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
        if(pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            pushHistory()
        }
    }, [properties]);

    useEffect(()=> {
        if(!loaded || saving) return;
        console.log("SAVING POINTS HIT:", points);
        localStorage.setItem("points", JSON.stringify({
            data: points,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
        if(pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            pushHistory()
        }
    }, [points]);

    useEffect(()=> {
        if(!loaded || saving) return;
        localStorage.setItem("canvasObjects", JSON.stringify({
            data: canvasObjects,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
        if(pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            pushHistory()
        }
    }, [canvasObjects]);

    useEffect(()=> {
        if(!loaded || saving) return;
        console.log("SAVING POINTS HIT:", points);
        localStorage.setItem("deletedProperties", JSON.stringify({
            data: deletedProperties,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
        if(pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            pushHistory()
        }
    }, [deletedProperties]);

    useEffect(()=> {
        if(!loaded || saving) return;
        console.log("SAVING POINTS HIT:", points);
        localStorage.setItem("deletedPoints", JSON.stringify({
            data: deletedPoints,
            expires: (Date.now() + (6 * 60 * 60 * 1000)) //Date now + 6 hours
        }));
        if(pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            pushHistory()
        }
    }, [deletedPoints]);

    useEffect(()=> {
        console.log("HISTORY CHANGED, HISTORY:", history, "INDEX:", historyIndex);
        const handleKeyDown = (e) => {
            if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if(e.shiftKey) redo();
                else undo();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, historyIndex]);

    function buildMarkersFromState(propsData, ptsData, canvasObjs) {
        const allMarkers = [];
        propsData.forEach(p => {
            allMarkers.push({id: p.id, propertyId: p.propertyId, lngLat: [p.lng, p.lat]});
        });
        ptsData.forEach(p => {
            const obj = {id: p.id, pointId: p.pointId, type: p.type, name: p.name, lngLat: [p.lng, p.lat]};
            if(p.type === "icon" && p.icon) {obj.icon = p.icon; allMarkers.push(obj)}
            else if(p.type === "radius" && p.radius) {obj.radius = p.radius; allMarkers.push(obj)}
            else if(p.type === "marker") allMarkers.push(obj)
            else if(p.type === "line" && (p.endLng || p.enlng)) {
                obj.endLng = p.endLng ?? p.endlng;
                obj.endLat = p.endLat ?? p.endlat;
                allMarkers.push(obj);
            }
        });
        canvasObjs.forEach(p => {
            const obj = {id: p.id, type: p.type, name: p.name, lngLat: [p.lng, p.lat]};
            if(p.type === "icon" && p.icon) {obj.icon = p.icon; allMarkers.push(obj)}
            else if(p.type === "radius" && p.radius) {obj.radius = p.radius; allMarkers.push(obj)}
            else if(p.type === "marker") allMarkers.push(obj)
            else if(p.type === "line" && (p.endLng || p.enlng)) {
                obj.endLng = p.endLng ?? p.endlng;
                obj.endLat = p.endLat ?? p.endlat;
                allMarkers.push(obj);
            }
        });
        return allMarkers;
    }

    const buildSnapshot = () => ({
        properties: {...properties},
        points: {...points},
        canvasObjects: {...canvasObjects},
        deletedProperties: [...deletedProperties],
        deletedPoints: [...deletedPoints]
    })
    
    const restoreSnapshot = (snapshot) => {
        console.log("RESTORING SNAPSHOT HIT");
        setProperties(snapshot.properties);
        setPoints(snapshot.points);
        setCanvasObjects(snapshot.canvasObjects);
        setDeletedProperties(snapshot.deletedProperties);
        setDeletedPoints(snapshot.deletedPoints);
        const restored = buildMarkersFromState(
            Object.values(snapshot.properties),
            Object.values(snapshot.points),
            Object.values(snapshot.canvasObjects)
        )
        setMarkers(restored);
    }

    const pushHistory = () => {
        console.log("PUSH HISTORY HIT");
        const snapshot = buildSnapshot();
        const newIndex = historyIndexRef.current + 1;

        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setHistory(prev => {
            const trimmed = prev.slice(0, newIndex);
            return [...trimmed, snapshot];
        });
    }

    const undo = () => {
        console.log("UNDO HIT");
        if(historyIndexRef.current <= 0) return;
        const newIndex = historyIndexRef.current - 1;
        const snapshot = history[newIndex];
        if(!snapshot) return;
        restoreSnapshot(snapshot);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
    }

    const redo = () => {
        console.log("REDO HIT");
        if(historyIndexRef.current >= history.length - 1) return;
        const newIndex = historyIndexRef.current + 1;
        const snapshot = history[newIndex];
        if(!snapshot) return;
        restoreSnapshot(snapshot);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
    }

    function validatePoint(obj) {
        console.log("VALIDATING POINT", obj)
        const allowedKeys = [
            "pointId", "details",
            "propertyId", "created_at",
            "id", "group_id",
            "type", "pinned",
            "name", "updated_at",
            "lng", "zip",
            "lat", "address",
            "icon", "state",
            "radius", "county",
            "owner_id", "country",
            "city", "endLng",
            "endLat", "length",
            "endlng", "endlat"
        ];
        for(const key of Object.keys(obj)) {
            if(!allowedKeys.includes(key)) {
                throw new Error(`Invalid property: ${key}`);
            };
        }
        if(!obj.pointId && !obj.propertyId && !obj.id) throw new Error("Missing id");
        return true;
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

    const showPointContextMenu = (x, y, id) => {
        showDefaultHoverContext(false);
        const menu = document.getElementById("marker-context");
        if(!menu) return;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.remove("hidden");

        const obj =
            Object.values(properties).find(p => p.id === id) ||
            Object.values(points).find(p => p.id === id) ||
            Object.values(canvasObjects).find(p => p.id === id);
        
        setContextPoint(obj ? {...obj, id} : {id})

        document.getElementById("marker-delete-action").onclick = () => {
            signalPointDelete(id);
            hideContextMenu();
        }
    }

    function hideContextMenu() {
        const menu = document.getElementById("marker-context");
        if(menu) menu.classList.add("hidden");
    }

    const showDefaultHoverContext = (visible, x=null, y=null) => {
        const hoverEl = document.getElementById("hover-element");
        if(!hoverEl) return;

        if(!visible) hoverEl.classList.toggle("hidden", true);
        else if(x && y) {
            hoverEl.classList.toggle("hidden", false);
            hoverEl.style.left = `${x}px`;
            hoverEl.style.top = `${y}px`;
        }
    }

    const selectCanvasAddon = (icon, name, type="icon") => {
        if(canvasSelect.icon === icon && canvasSelect.name === name) {
            setCanvasSelect({icon: null, name: null, type: null});
            return;
        };
        setCanvasSelect({icon, name, type});
    };

    const addCanvasObjects = (obj) => {
        if (!validatePoint(obj)) return;
        pendingHistoryRef.current = true;

        if(obj.propertyId) {
            console.log("PROPERTIES CHANGE HITT")
            const key = typeof obj.pointId === "string"
                ? obj.propertyId
                : `prop-${obj.propertyId}`;

            setProperties(p => {
                const existing = p[key];
                const updated = existing
                    ? {...existing, ...obj}
                    : {...obj};

                if(!updated.name?.includes("(Unsaved")) {
                    updated.name = "(Unsaved) "  + (updated.name ?? updated.type);
                }
                
                return {
                    ...p,
                    [key]: updated
                }
            });
        } 
        
        else if(obj.pointId) {
            console.log("POINT CHANGE HITT", obj);

            const key = typeof obj.pointId === "string"
                ? obj.pointId
                : `${obj.type}-${obj.pointId}`;

            setPoints(p => {
                console.log("ADDING EXISTING POINT TO P:", p);
                console.log("POINT ID:", obj.pointId, "KEY", key);
                const existing = p[key];
                const updated = existing
                    ? {...existing, ...obj}
                    : {...obj};
                
                if(!updated.name?.includes("(Unsaved)")) {
                    updated.name = "(Unsaved) " + (updated.name ?? updated.type);
                }
                console.log("SET POINT RESULTS", updated);
                return {
                    ...p,
                    [key]: updated
                };
            });
        }
        
        else {
            setCanvasObjects(p => {
                console.log("CANVAS RECIEVED OBJECT", obj);
                const existing = p[obj.id];
                const updated = existing
                    ? {...existing, ...obj}
                    : {...obj};
                if(!updated.name || updated.name === updated.type) {
                    updated.name = "New " + updated.type;
                };
                console.log("FINISHED CANVAS OBJECT", updated);
                return {
                    ...p,
                    [obj.id]: updated
                };
            });
        }
    };

    const deleteCanvasObjects = (id) => {
        console.log("DELETION ID", id);
        // console.log("AT DELETION OTHER PROPERTIES", otherProperties);
        // console.log("AT DELETION POINTS", points);
        const split = id.split("-");
        console.log("SPLIT ID:", split)

        switch(split[0]) {
            case "temp":
                pendingHistoryRef.current = true;
                setCanvasObjects(prev => { const copy = {...prev}; delete copy[id]; return copy; });
                return;
            case "prop":
                if(properties[id]) {
                    pendingHistoryRef.current = true;
                    const numberId = Number(split[1])
                    setDeletedProperties(p => [...p, numberId]);
                    setProperties(p => { const copy = {...p}; delete copy[id]; return copy; });
                }
                return;
            case "icon":
            case "marker":
            case "radius":
            case "line":
                pendingHistoryRef.current = true;
                console.log("POINT DETECT")
                const numberId = Number(split[1])
                setDeletedPoints(p => [...p, numberId]);
                setPoints(p => { const copy = {...p}; delete copy[id]; return copy; });
                return;
        };
    };

    const getMetadata = (id) => {
        const split = id.split("-");
        console.log("SPLIT ID:", split)

        switch(split[0]) {
            case "temp":
                return canvasObjects[id] ?? null;
            case "prop":
                return properties[id] ?? null;
            case "icon":
            case "marker":
            case "radius":
            case "line":
                return points[id] ?? null;
        };
    }

    function signalPointUpdate(id, changesObj) {
        console.log("ICON CHANGED SIGNAL 2: EDITOR")
        return setPointChange({id: id, updates: changesObj});
    }

    function signalPointDelete(id) {
        return setPointDelete({id})
    }

    const formatProperty = async (point) => {
        console.log("FORMAT PROPERTY", point);
        if(!point.name) return false;
        if(!point.lngLat && (!point.lng && !point.lat)) return false;

        const pointObj = {
            name: point.name,
            lng: point.lngLat[0] ?? point.lng,
            lat: point.lngLat[1] ?? point.lat,
            address: point.address ?? null,
            city: point.city ?? null,
            county: point.county ?? null,
            state: point.state ?? null,
            country: point.country ?? null,
            zip: point.zip ?? null
        }

        if(
            !pointObj.city && !pointObj.address &&
            !pointObj.county && !pointObj.state &&
            !pointObj.country && !pointObj.zip
        ) {
            const addressObj = await reverseLookupAddress(pointObj.lng, pointObj.lat);
            pointObj.address = addressObj.address ?? null;
            pointObj.city = addressObj.city ?? null;
            pointObj.county = addressObj.county ?? null;
            pointObj.state = addressObj.state ?? null;
            pointObj.country = addressObj.country ?? null;
            pointObj.zip = addressObj.zip ?? null;
        }

        if(point.name.includes("(Unsaved)")) {
            pointObj.name = pointObj.name.split("(Unsaved)")[1].trim();
        }

        return pointObj;
    }

    const formatPoint = (point) => {
        console.log("FORMAT POINT", point);
        if(!point.name) {
            console.error("No name for formatted point", point);
            return false;
        }
        if(!point.lngLat && (!point.lng && !point.lat)) {
            console.error("No lng and lat for formatted point", point);
            return false;
        }

        const pointObj = {
            type: point.type,
            name: point.name,
            lng: point.lng ?? point.lngLat[0],
            lat:  point.lat ?? point.lngLat[1]
        }

        if(point.name.includes("(Unsaved)")) {
            pointObj.name = pointObj.name.split("(Unsaved)")[1].trim();
        }

        for(const key in pointObj) {
            if(!point[key]) {
                console.error(`Error: Point doesn't have a key: ${key}`);
                return false;
            }
        }

        switch(point.type) {
            case "marker":
                return pointObj;
            case "icon":
                if(point.icon) {
                    pointObj.icon = point.icon;
                    return pointObj;
                }
                console.error(`Error: Point doesn't have a key: icon`);
                return false;
            case "radius":
                if(point.radius) {
                    pointObj.radius = point.radius;
                    return pointObj;
                }
                console.error(`Error: Point doesn't have a key: radius`);
                return false;
            case "line":
                if(point.endLng && point.endLat) {
                    pointObj.endLng = point.endLng;
                    pointObj.endLat = point.endLat;
                    return pointObj;
                }
                console.error(`Error: Point doesn't have one or both keys: endLng, endLat`);
                return false;
        }
    }

    const handleSaveAll = async (e) => {
        console.log("SAVING HIT")
        e.preventDefault();
        setSaving(true);

        const storedProperties = localStorage.getItem("properties");
        const storedPoints = localStorage.getItem("points");
        const storedCanvasObjs = localStorage.getItem("canvasObjects");
        let parsed = storedProperties ? JSON.parse(storedProperties) : null;

        if(parsed?.data) {
            try {
                const createProp = {...parsed?.data};
                console.log("SAVED PROPERTY DATA", createProp);
                await Promise.all(
                    propertyStore.data.map(async (p) => {
                        if(createProp[`prop-${p.id}`]) {
                            const newProp = await formatProperty(createProp[`prop-${p.id}`]); // Async returns promise unfilled
                            console.log("FORMAT PROPERTY COMPLETE", newProp);
                            if(newProp) {
                                const edit = dispatch(thunkEditProperty(p.id, newProp));
                                delete createProp[`prop-${p.id}`];
                                return edit;
                            }
                        };
                        return Promise.resolve();
                    })
                );
                if(Object.keys(createProp).length) {
                    await Promise.all(
                        Object.values(createProp).map(p=> {
                            if(p.name.includes("(Unsaved)")) {
                                p.name = p.name.split("(Unsaved)")[1].trim();
                                setProperties(prev => ({...prev, p}))
                            }
                            return dispatch(thunkCreateProperty(p))
                        })
                    );
                }
                if(deletedProperties.length > 0) {
                    await Promise.all(
                        deletedProperties.forEach(id => { 
                            return dispatch(thunkDeleteProperty(id))
                        })
                    );
                }
                localStorage.removeItem("properties");
            } catch(e) {
                console.error("Failed to save properties, quitting before other properties, and points ", e);
                return;
            };
        };

        parsed = storedPoints ? JSON.parse(storedPoints) : null;
        if(parsed?.data) {
            try {
                const createPoint = {...parsed?.data};
                console.log("SAVE OTHER PROP DATA", createPoint);
                await Promise.all(
                    pointStore.data.map(p => {
                        console.log("EDIT POINT P IN MAP", p)
                        console.log("EDIT POINT IN MAP", createPoint)
                        if(createPoint[`${p.type}-${p.id}`]) {
                            const newPoint = formatPoint(createPoint[`${p.type}-${p.id}`]);
                            if(newPoint) {
                                const edit = dispatch(thunkEditPoint(p.id, newPoint));
                                delete createPoint[`${p.type}-${p.id}`];
                                return edit;
                            }
                        };
                        return Promise.resolve();
                    })
                );
                console.log("SAVED EDIT POINTS PASSED, CURRENT:", createPoint)
                if(Object.keys(createPoint).length) {
                    await Promise.all(
                        Object.values(createPoint).map(p => {
                            console.log("CREATE POINTS PASSED, P:", p)
                            if(p.name.includes("(Unsaved)")) {
                                p.name = p.name.split("(Unsaved)")[1].trim();
                            }
                            return dispatch(thunkCreatePoint(p));
                        })
                    )
                };
                console.log("SAVED CREATE POINTS PASSED, CURRENT:", createPoint)
                if(deletedPoints.length > 0) {
                    console.log("DELETING POINTS:", deletedPoints);
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
        
        parsed = storedCanvasObjs ? JSON.parse(storedCanvasObjs) : null;
        if(parsed?.data) {
            try {
                const createPoint = {...parsed?.data};
                console.log("SAVED EDIT POINTS PASSED, CURRENT:", createPoint)
                if(Object.keys(createPoint).length) {
                    await Promise.all(
                        Object.values(createPoint).map(p => {
                            if(["marker", "icon", "radius", "line"].includes(p.type)) {
                                return dispatch(thunkCreatePoint(p))
                            }
                            return Promise.resolve();
                        })
                    )
                };
                localStorage.removeItem("canvasObjects");
            } catch(e) {
                console.error("Failed to save canvas objects", e);
                return;
            };
        };

        setHistory([]);
        setHistoryIndex(-1);
        historyIndexRef.current = -1;
        setProperties({});
        setPoints({});
        setCanvasObjects({});
        setDeletedPoints([]);
        setDeletedProperties([]);
        setReload(r => r += 1);
    };

    return (<>
    {loaded && (
    <div id="editor" className="user-select-none">
        <div className={`loading-mask ${saving ? "active" : ""}`} />

        <div id="editor-top">
            <div className="editor-controls">
                <button
                    onClick={()=> undo()}
                    disabled={historyIndex <= 0}
                >Undo</button>

                <button
                    onClick={()=> redo()}
                    disabled={historyIndex >= history.length - 1}
                >Redo</button>
            </div>

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

            <div className="editor-controls-2">
                <button
                    className="user-select-none"
                    onClick={handleSaveAll}
                    disabled={historyIndex <= 0}
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
                            Properties
                            <button
                                onClick={()=> setMenuSelects(m => ({...m, 1: !m[1]}) )}
                            >
                                {menuSelects[1] ? "V" : "𐌡"}
                            </button>
                        </div>
                        {Object.keys(properties ?? {}).length > 0 && (
                            <div className={`${menuSelects[1] ? "" : "hidden"}`}>
                            {Object.values(properties).map((p, i) => (
                                <div className="menu-item-1 user-select-none" key={`props-${i}`}>
                                    <p
                                        className="point-menu-button"
                                        onMouseDown={()=> setLngLat([p?.lng, p?.lat])}
                                        onMouseEnter={(e)=> showDefaultHoverContext(true, e.clientX, e.clientY)}
                                        onMouseLeave={()=> showDefaultHoverContext(false)}
                                        onContextMenu={(e)=> {
                                            e.preventDefault();
                                            showPointContextMenu(e.clientX, e.clientY, p.id);
                                        }}
                                    >{p?.name}</p>
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
                                    <p
                                        className="point-menu-button"
                                        onMouseDown={()=> setLngLat([p?.lng, p?.lat])}
                                        onMouseEnter={(e)=> showDefaultHoverContext(true, e.clientX, e.clientY)}
                                        onMouseLeave={()=> showDefaultHoverContext(false)}
                                        onContextMenu={(e)=> {
                                            e.preventDefault();
                                            showPointContextMenu(e.clientX, e.clientY, p.id);
                                        }}
                                    >{p?.name}</p>
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
                                    <p
                                        className="point-menu-button"
                                        onMouseDown={()=> setLngLat([p?.lng, p?.lat])}
                                        onMouseEnter={(e)=> showDefaultHoverContext(true, e.clientX, e.clientY)}
                                        onMouseLeave={()=> showDefaultHoverContext(false)}
                                        onContextMenu={(e)=> {
                                            e.preventDefault();
                                            showPointContextMenu(e.clientX, e.clientY, p.id);
                                        }}
                                    >{p?.name}</p>
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

                            <div 
                                className={`menu-item-2 ${
                                    canvasSelect.name === "line" &&
                                    canvasSelect.type === "line" ? "selected" : ""
                                }`}
                                onClick={()=> selectCanvasAddon(null, "line", "line", {size: "6"})}
                            >
                                <img src="/icons/line.svg" alt="Radius" />
                                <p>Line</p>
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

            <div id="marker-context" className="marker-context hidden">
                <ModalButton
                    itemText="Edit"
                    modalComponent={
                    <ManagePointsModal 
                        point={contextPoint}
                        isSaved={contextPoint?.propertyId || contextPoint?.pointId}
                        addFunc={addCanvasObjects}
                        deleteFunc={deleteCanvasObjects}
                        changeFunc={signalPointUpdate}
                    />}
                />
                <button id="marker-delete-action">Delete</button>
            </div>

            <div id="hover-element" className="hover-element hidden">
                <p>Left-Click to Go To | Right Click to Edit/Delete</p>
            </div>

            <MapComponent 
                layer={layer} 
                lngLat={lngLat} 
                markers={markers} 
                canvasTool={canvasSelect}
                createdCanvasObject={addCanvasObjects}
                deletedCanvasObject={deleteCanvasObjects}
                updateObject={pointChange}
                onPointChange={signalPointUpdate}
                deleteSignal={pointDelete}
                getMetadata={getMetadata}
            />             
        </div>
    </div>
    )}
    </>)
}