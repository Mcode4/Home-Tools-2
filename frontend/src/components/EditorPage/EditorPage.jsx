import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
    thunkGetAllProperties,
    thunkCreateProperty,
    thunkEditProperty,
    thunkDeleteProperty
} from "../../redux/properties";
import { thunkGetPoints, thunkCreatePoint, thunkEditPoint, thunkDeletePoint } from "../../redux/points";
import { thunkGetSavedTypes, thunkDeleteSavedType } from "../../redux/savedTypes";
import { handleSearchAddress, reverseLookupAddress } from "../../functions/search/search";
import MapComponent from "./Map";
import CustomPointModal from "../CustomPointModal/CustomPointModal";
import "./EditorPage.css";
import PropertyDetailsSidebar from "./PropertyDetailsSidebar/PropertyDetailsSidebar";
import SettingsPanel from "./SettingsPanel/SettingsPanel";
import { thunkGetSettings } from "../../redux/settings";
import { ModalButton, ModalItem } from "../../context/Modal";
import ManagePointsModal from "../ManagePointsModal";
import { NavigateModal } from "../PopupModals";

// OUTSIDE component — stable across all renders, no stale closures
const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

export default function EditorPage() {
    // LOADING AND STATE
    const { state } = useLocation()
    const propertyStore = useSelector(store => store.properties);
    const pointStore = useSelector(state => state.points);
    const savedTypesStore = useSelector(state => state.savedTypes);
    const settings = useSelector(state => state.settings);
    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [reload, setReload] = useState(0);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyIndexRef = useRef(-1);
    const pendingHistoryRef = useRef(false);
    const savingRef = useRef(false);
    const isSavingAllRef = useRef(false);
    // Refs to latest state so debounced closures never go stale
    const currentCanvasObjectsRef = useRef({});
    const currentDeletedPropertiesRef = useRef([]);
    const currentDeletedPointsRef = useRef([]);
    const [err, setErr] = useState({});

    // MAIN DATA - Staging Area (Diff Set)
    const [canvasObjects, setCanvasObjects] = useState({});

    // DELETION TRACKING
    const [deletedProperties, setDeletedProperties] = useState([])
    const [deletedPoints, setDeletedPoints] = useState([]);

    // MAP VARIABLES
    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [layer, setLayer] = useState("osm-layer");
    const [canvasSelect, setCanvasSelect] = useState({ icon: null, name: null, type: null });

    // SEARCH
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const [searchActive, setSearchActive] = useState(true);

    const mapProperties = useMemo(() => {
        // Redux data filtered by current deletions and staged mods
        const savedProps = (propertyStore.data || []).filter(p => {
            const stagedId = `prop-${p.id}`;
            return !deletedProperties.includes(p.id) && !canvasObjects[stagedId];
        }).map(p => ({ ...p, source: 'db', type: p.type || "home" }));

        // Staged properties from the unified canvasObjects
        const stagedProps = Object.values(canvasObjects)
            .filter(p => ["home", "apartment", "unit"].includes(p.type))
            .map(p => ({ ...p, source: String(p.id).startsWith('temp-') ? 'canvas' : 'prop' }));

        return [...savedProps, ...stagedProps];
    }, [propertyStore.data, canvasObjects, deletedProperties]);

    const mapPoints = useMemo(() => {
        // Redux data filtered by current deletions and staged mods
        const savedPts = (pointStore.data || []).filter(p => {
            const stagedId = `point-${p.id}`;
            return !deletedPoints.includes(p.id) && !canvasObjects[stagedId];
        }).map(p => ({ ...p, source: 'db' }));

        // Staged points from the unified canvasObjects
        const stagedPts = Object.values(canvasObjects)
            .filter(p => !["home", "apartment", "unit"].includes(p.type))
            .map(p => ({ ...p, source: String(p.id).startsWith('temp-') ? 'canvas' : 'point' }));

        return [...savedPts, ...stagedPts];
    }, [pointStore.data, canvasObjects, deletedPoints]);

    // PAGE VARIABLES
    const [popups, setPopups] = useState({});
    const [menuSelects, setMenuSelects] = useState({});
    const [menu, setMenu] = useState("map") // "map", "draw", "teams", "render-page", "exports"
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isPinned, setIsPinned] = useState(false);

    // RE-SYNC MARKERS: Redux arrays are the source of truth; canvas adds / overrides with unsaved items
    const memoMarkers = useMemo(() => {
        const allMarkers = [];

        // 1. Saved Properties from Redux
        (propertyStore.data || []).forEach(p => {
            const stagedId = `prop-${p.id}`;
            if (deletedProperties.includes(p.id) || canvasObjects[stagedId]) return;
            
            allMarkers.push({
                ...p,
                source: 'db',
                type: p.type || "home",
                lngLat: [p.lng, p.lat]
            });
        });

        // 2. Saved Points from Redux
        (pointStore.data || []).forEach(p => {
            const stagedId = `point-${p.id}`;
            if (deletedPoints.includes(p.id) || canvasObjects[stagedId]) return;

            allMarkers.push({
                ...p,
                source: 'db',
                lngLat: [p.lng, p.lat]
            });
        });

        // 3. Staged / Unsaved objects (includes new temp-* and edits to DB items)
        Object.values(canvasObjects).forEach(p => {
            allMarkers.push({
                ...p,
                source: String(p.id).startsWith('temp-') ? 'canvas' : 'mod',
                lngLat: p.lngLat || [p.lng, p.lat]
            });
        });

        return allMarkers;
    }, [propertyStore.data, pointStore.data, canvasObjects, deletedProperties, deletedPoints]);

    // TEMP DATA
    const [buildings, setBuildings] = useState(["A", "B", "C", "D", "E", "F", "G"]);
    const [amenities, setAmenities] = useState([
        { emoji: "🏠", name: "Leasing" }, { emoji: "🗑️", name: "Trash bin" }, { emoji: "🔥", name: "Grill" },
        { emoji: "✉️", name: "Mailboxes" }, { emoji: "🐕", name: "Pet Station" }, { emoji: "🏛️", name: "Clubhouse" },
        { emoji: "🌲", name: "Park" }, { emoji: "💪", name: "Gym" }, { emoji: "🏢", name: "Senior Bldg" },
        { emoji: "🏊", name: "Pool" }, { emoji: "🎠", name: "Playground" },
    ]);
    const [emergencies, setEmergencies] = useState([
        { emoji: "🤢", name: "Contamination" }, { emoji: "🛠️", name: "Maintenance" }, { emoji: "💩", name: "Hazard" },
        { emoji: "🌊", name: "Flood" }, { emoji: "⚠️", name: "Incident" },
    ]);

    // ETC
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handlePointSelect = (point) => {
        setSelectedPoint(point);
        if (point.lngLat) {
            setLngLat([...point.lngLat]);
        } else if (point.lng !== undefined && point.lat !== undefined) {
            setLngLat([point.lng, point.lat]);
        }
    };

    const handleCloseSidebar = () => {
        if (!isPinned) setSelectedPoint(null);
    };

    // Keep latest-state refs always current
    useEffect(() => {
        currentCanvasObjectsRef.current = canvasObjects;
        currentDeletedPropertiesRef.current = deletedProperties;
        currentDeletedPointsRef.current = deletedPoints;
    });

    // LOADING USESTATES
    useEffect(() => {
        const initialData = async () => {
            await dispatch(thunkGetAllProperties());
            dispatch(thunkGetSettings());
            dispatch(thunkGetSavedTypes());
            dispatch(thunkGetPoints());

            let stored = localStorage.getItem("canvasObjects");
            let parsed = stored ? JSON.parse(stored) : null;
            if (parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("canvasObjects");
            }
            else if (parsed?.data) {
                console.log("PARSED STAGING AREA", parsed)
                setCanvasObjects(parsed.data);
            }

            stored = localStorage.getItem("deletedProperties");
            parsed = JSON.parse(stored);
            if (parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("deletedProperties")
            }
            else if (parsed?.data) {
                setDeletedProperties([...parsed?.data]);
            }

            stored = localStorage.getItem("deletedPoints");
            parsed = JSON.parse(stored);
            if (parsed && Date.now() > parsed?.expires) {
                localStorage.removeItem("deletedPoints")
            }
            else if (parsed?.data) {
                setDeletedPoints([...parsed?.data]);
            }

            setInitialized(true);
            setSaving(false);
        }
        initialData()
    }, [reload]);

    // Initial Data Hydration from Redux
    // Merges Redux data as the base, then overlays localStorage edits on top
    // This way local unsaved changes always win over the raw DB values
    useEffect(() => {
        if (!initialized || !propertyStore || !pointStore) return;

        const reduxProperties = {};
        const reduxPoints = {};

        propertyStore?.data?.forEach(prev => {
            const prefixedKey = `prop-${prev.id}`;
            if (deletedProperties.includes(prev.id)) return;
            reduxProperties[prefixedKey] = { ...prev, id: prefixedKey, propertyId: prev.id };
        });

        pointStore?.data?.forEach(prev => {
            const prefixedKey = `point-${prev.id}`;
            if (deletedPoints.includes(prev.id)) return;
            reduxPoints[prefixedKey] = { ...prev, id: prefixedKey, pointId: prev.id };
        });

        // localStorage edits override Redux (user's unsaved changes take priority)
        setLoaded(true);
        setInitialized(false); // Only hydrate once
        pendingHistoryRef.current = false;
    }, [initialized, propertyStore?.data, pointStore?.data]);

    // Reactivity: Sync new properties/points from Redux into local state
    // PERFORMANCE: Debounced History & LocalStorage
    // Uses refs for current state so closures never go stale

    const debouncedSaveToLocal = useRef(debounce((key) => {
        const dataMap = {
            canvasObjects: currentCanvasObjectsRef.current,
            deletedProperties: currentDeletedPropertiesRef.current,
            deletedPoints: currentDeletedPointsRef.current,
        };
        const data = dataMap[key];
        if (data === undefined) return;
        localStorage.setItem(key, JSON.stringify({
            data,
            expires: (Date.now() + (6 * 60 * 60 * 1000))
        }));
    }, 2000)).current;

    const debouncedPushHistory = useRef(debounce(() => {
        const snapshot = {
            canvasObjects: { ...currentCanvasObjectsRef.current },
            deletedProperties: [...currentDeletedPropertiesRef.current],
            deletedPoints: [...currentDeletedPointsRef.current],
        };
        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setHistory(prev => {
            const trimmed = prev.slice(0, newIndex);
            return [...trimmed, snapshot];
        });
    }, 1000)).current;

    // Reactivity: Sync brand-new Redux items (e.g. after Save All) into local state
    // Only adds items that don't exist locally yet — never overwrites local edits
    useEffect(() => {
        if (!loaded) return;

        let changed = false;
        const currentStaging = currentCanvasObjectsRef.current;
        const currentDelProps = currentDeletedPropertiesRef.current;
        const currentDelPts = currentDeletedPointsRef.current;

        const nextStaging = { ...currentStaging };

        propertyStore?.data?.forEach(p => {
            const key = `prop-${p.id}`;
            if (currentDelProps.includes(p.id)) return;
            // No need to inject if it's already staged; if not staged, we don't automatically inject into staging
        });

        if (changed) {
            setCanvasObjects(nextStaging);
        }
    }, [propertyStore?.data?.length, pointStore?.data?.length, loaded]);

    useEffect(() => {
        setSearchResults([]);
        if (!search) return;

        if (search.length > 2) {
            const searchDelay = setTimeout(() => {
                handleSearchAddress(search)
                    .then(data => setSearchResults(data))
                    .catch(err => setErr({ search: err }));
            }, 500);

            return () => {
                clearTimeout(searchDelay);
            };
        }
    }, [search]);

    // Sync state changes to localStorage and push history
    // savingRef prevents this from firing during undo/redo/restore
    useEffect(() => {
        if (!loaded || savingRef.current || isSavingAllRef.current) return;
        debouncedSaveToLocal("canvasObjects");
        if (pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            debouncedPushHistory();
        }
    }, [canvasObjects]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!loaded || savingRef.current || isSavingAllRef.current) return;
        debouncedSaveToLocal("deletedProperties");
    }, [deletedProperties]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!loaded || savingRef.current || isSavingAllRef.current) return;
        debouncedSaveToLocal("deletedPoints");
    }, [deletedPoints]); // eslint-disable-line react-hooks/exhaustive-deps

    const undo = () => {
        console.log("UNDO HIT");
        if (historyIndexRef.current <= 0) return;
        const newIndex = historyIndexRef.current - 1;
        const snapshot = history[newIndex];
        if (!snapshot) return;
        restoreSnapshot(snapshot);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
    }

    const redo = () => {
        console.log("REDO HIT");
        if (historyIndexRef.current >= history.length - 1) return;
        const newIndex = historyIndexRef.current + 1;
        const snapshot = history[newIndex];
        if (!snapshot) return;
        restoreSnapshot(snapshot);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
    }

    const restoreSnapshot = useCallback((snapshot) => {
        console.log("RESTORING SNAPSHOT HIT");
        setCanvasObjects(snapshot.canvasObjects);
        setDeletedProperties(snapshot.deletedProperties);
        setDeletedPoints(snapshot.deletedPoints);

        // Prevent history push loop
        savingRef.current = true;
        setTimeout(() => { savingRef.current = false; }, 100);
    }, []);

    useEffect(() => {
        console.log("HISTORY CHANGED, HISTORY:", history, "INDEX:", historyIndex);
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, historyIndex]);

    function validatePoint(obj) {
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
            "endlng", "endlat",
            "location", "parent_id",
            "extra_info"
        ];
        for (const key of Object.keys(obj)) {
            if (!allowedKeys.includes(key)) {
                throw new Error(`Invalid property: ${key}`);
            };
        }
        if (!obj.pointId && !obj.propertyId && !obj.id) throw new Error("Missing id");
        return true;
    }

    const selectMenu = (e, val) => {
        setCanvasSelect({ type: null, savedTypeId: null, name: "" }); // Deactivate tool on menu switch
        e.preventDefault();
        // No teams now
        ["map", "draw", "render-page", "exports", "settings"].forEach(m => {
            const currMenu = document.getElementById(`menu-${m}`);
            const menuItem = document.getElementById(`menu-item-${m}`);
            const slider = document.getElementById("menu-tools");
            if (m === val) {
                currMenu?.classList.toggle("menu-active");
                menuItem?.classList.toggle("hidden");

                if (menuItem?.className.includes("hidden")) {
                    slider?.classList.toggle("closed", true);
                } else {
                    slider?.classList.toggle("closed", false);
                };
            } else {
                currMenu?.classList.toggle("menu-active", false);
                menuItem?.classList.toggle("hidden", true);
            };
        });
        setMenu(val);
    };


    const selectCanvasAddon = (icon, name, type = "icon") => {
        if (canvasSelect.icon === icon && canvasSelect.name === name) {
            setCanvasSelect({ icon: null, name: null, type: null });
            return;
        }
        setCanvasSelect({ icon, name, type });
    };

    const addCanvasObjects = (obj) => {
        if (!obj || !obj.id) return;
        const idStr = String(obj.id);
        const isNumeric = !isNaN(idStr) && !idStr.includes("-");
        
        let targetId = idStr;
        if (isNumeric) {
            // "Promote" numeric DB IDs to prefixed staging IDs immediately
            const isProp = ["home", "apartment", "unit"].includes(obj.type) || 
                           (propertyStore.data || []).some(p => p.id === Number(idStr));
            targetId = isProp ? `prop-${idStr}` : `point-${idStr}`;
        }

        // Apply default naming
        const finalObj = { ...obj, id: targetId, source: isNumeric ? 'mod' : 'canvas' };
        if (!finalObj.name || finalObj.name === finalObj.type) {
            finalObj.name = (finalObj.type || 'Point').charAt(0).toUpperCase() + (finalObj.type || 'Point').slice(1);
        }

        setCanvasObjects(prev => ({
            ...prev,
            [targetId]: finalObj
        }));
    };

    const deleteCanvasObjects = (id) => {
        if (!id) return;
        const idStr = String(id);
        pendingHistoryRef.current = true;

        const split = idStr.split("-");
        const typePrefix = split[0];
        const numId = Number(split[1] || idStr);

        // 1. Remove from staging
        setCanvasObjects(prev => {
            const copy = { ...prev };
            delete copy[idStr];
            // Also clean up unprefixed/differently-prefixed versions just in case
            delete copy[numId];
            delete copy[`prop-${numId}`];
            delete copy[`point-${numId}`];
            return copy;
        });

        // 2. Add to deletion tracking if it's a DB item
        if (!isNaN(numId) && typePrefix !== "temp") {
            const isProp = ["home", "apartment", "unit", "prop"].includes(typePrefix) || 
                           (propertyStore.data || []).some(p => p.id === numId);
            
            if (isProp) setDeletedProperties(prev => [...prev, numId]);
            else setDeletedPoints(prev => [...prev, numId]);
        }
    };


    const getMetadata = (id) => {
        if (!id) return null;
        const idStr = String(id);
        const split = idStr.split("-");

        const canvas = currentCanvasObjectsRef.current;

        // 1. Check staging area
        if (canvas[idStr]) return canvas[idStr];

        // 2. Check Redux stores if it's a numeric (saved) ID
        const isNumeric = !isNaN(idStr) && !idStr.includes("-");
        if (isNumeric) {
            const numId = Number(idStr);
            const dbProp = (propertyStore.data || []).find(p => p.id === numId);
            if (dbProp) return dbProp;
            const dbPoint = (pointStore.data || []).find(p => p.id === numId);
            if (dbPoint) return dbPoint;
        }

        return null;
    };


    const formatProperty = async (point) => {
        if (!point.name) return false;
        if (!point.lngLat && (!point.lng && !point.lat)) return false;

        const finalLng = point.lng ?? (point.lngLat ? point.lngLat[0] : null);
        const finalLat = point.lat ?? (point.lngLat ? point.lngLat[1] : null);

        const pointObj = {
            type: point.type || "home",
            icon: point.icon || null,
            name: point.name,
            lng: finalLng,
            lat: finalLat,
            address: point.address ?? null,
            city: point.city ?? null,
            county: point.county ?? null,
            state: point.state ?? null,
            country: point.country ?? null,
            zip: point.zip ?? null,
            details: point.extra_info ?? null
        }

        if (
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

        // Sanitize Zip: Convert empty string to null to avoid backend integer errors
        pointObj.zip = pointObj.zip === "" ? null : pointObj.zip;

        const nameSource = point.name || (point.type || "home").charAt(0).toUpperCase() + (point.type || "home").slice(1);
        if (nameSource.includes("(Unsaved)")) {
            pointObj.name = nameSource.split("(Unsaved)")[1].trim();
        } else {
            pointObj.name = nameSource;
        }

        return pointObj;
    }

    const formatPoint = (point) => {
        const lng = point.lng ?? point.lngLat?.[0];
        const lat = point.lat ?? point.lngLat?.[1];

        if (!lng || !lat) {
            console.error("No lng/lat for point", point);
            return false;
        }

        const nameSource = point.name || (point.type || "point").charAt(0).toUpperCase() + (point.type || "point").slice(1);
        const pointObj = {
            type: (point.type === "marker" || point.type === "icon") ? "icon" : point.type,
            name: nameSource.includes("(Unsaved)") ? nameSource.split("(Unsaved)")[1].trim() : nameSource,
            lng,
            lat,
            icon: point.icon || null,
            extra_info: point.extra_info || null,
            parent_id: point.parent_id || null,
        };

        switch (point.type) {
            case "marker":
            case "icon":
                if (!pointObj.icon) {
                    console.error("Icon/Marker type point missing icon field", point);
                    // Don't block save — icon can be null for default marker
                }
                return pointObj;
            case "home":
            case "apartment":
            case "unit":
            case "point":
                return pointObj;
            case "radius":
                if (!point.radius) {
                    console.error("Radius type point missing radius field", point);
                    return false;
                }
                pointObj.radius = point.radius;
                return pointObj;
            case "line":
                if (!point.endLng || !point.endLat) {
                    console.error("Line type point missing endLng/endLat", point);
                    return false;
                }
                pointObj.endLng = point.endLng;
                pointObj.endLat = point.endLat;
                return pointObj;
            default:
                console.error("Unknown point type", point.type);
                return false;
        }
    }

    const handleSaveAll = async (e) => {
        e.preventDefault();
        if (isSavingAllRef.current) return;
        isSavingAllRef.current = true;
        setSaving(true);

        const currentCanvas = { ...currentCanvasObjectsRef.current };
        const currentDeletedProps = [...currentDeletedPropertiesRef.current];
        const currentDeletedPts = [...currentDeletedPointsRef.current];

        try {
            const propCreates = [];
            const propUpdates = [];
            const pointCreates = [];
            const pointUpdates = [];

            Object.values(currentCanvas).forEach(obj => {
                const idStr = String(obj.id);
                const isProperty = ["home", "apartment", "unit"].includes(obj.type);

                if (idStr.startsWith("temp-")) {
                    if (isProperty) propCreates.push(obj);
                    else pointCreates.push(obj);
                } else if (idStr.startsWith("prop-")) {
                    const numId = Number(idStr.split("-")[1]);
                    propUpdates.push({ id: numId, data: obj });
                } else if (idStr.startsWith("point-")) {
                    const numId = Number(idStr.split("-")[1]);
                    pointUpdates.push({ id: numId, data: obj });
                }
            });

            console.log("\npropCreates", propCreates);
            console.log("propUpdates", propUpdates);
            console.log("pointCreates", pointCreates);
            console.log("pointUpdates", pointUpdates, "\n");

            await Promise.all([
                // Deletions first
                ...currentDeletedProps.map(id => dispatch(thunkDeleteProperty(id))),
                ...currentDeletedPts.map(id => dispatch(thunkDeletePoint(id))),
                
                // Property Actions
                ...propCreates.map(async p => {
                    const formatted = await formatProperty(p);
                    if (formatted) return dispatch(thunkCreateProperty(formatted));
                }),
                ...propUpdates.map(async ({ id, data }) => {
                    const formatted = await formatProperty(data);
                    if (formatted) return dispatch(thunkEditProperty(id, formatted));
                }),

                // Point Actions
                ...pointCreates.map(p => {
                    const formatted = formatPoint(p);
                    if (formatted) return dispatch(thunkCreatePoint(formatted));
                }),
                ...pointUpdates.map(({ id, data }) => {
                    const formatted = formatPoint(data);
                    if (formatted) return dispatch(thunkEditPoint(id, formatted));
                })
            ]);

            localStorage.removeItem("canvasObjects");
            localStorage.removeItem("deletedProperties");
            localStorage.removeItem("deletedPoints");
            
            savingRef.current = true;
            setHistory([]);
            setHistoryIndex(-1);
            historyIndexRef.current = -1;
            setDeletedPoints([]);
            setDeletedProperties([]);
            setCanvasObjects({});
            
            await dispatch(thunkGetAllProperties());
            await dispatch(thunkGetPoints());
            savingRef.current = false;
            setInitialized(true);

        } catch (err) {
            console.error("Save All failed:", err);
        } finally {
            isSavingAllRef.current = false;
            setSaving(false);
        }
    };



    return (
        <div className={`editor-app-wrapper theme-${settings.theme}`}>
            {!loaded ? (
                <div className="landing-load">
                    <i className="fa-solid fa-spinner fa-spin-pulse"></i>
                </div>
            ) : (
                <div id="editor">
                    <header id="editor-top">
                        <div className="header-nav-left">
                            <button className="header-btn" onClick={() => navigate("/")}>Home</button>
                            <button
                                className="header-btn save-btn"
                                onClick={handleSaveAll}
                                disabled={Object.keys(canvasObjects).length === 0 && deletedPoints.length === 0 && deletedProperties.length === 0}
                            >Save All</button>
                        </div>

                        <div className="header-nav-center">
                            <div className="search-container" ref={searchRef}>
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Find addresses or points..."
                                    className="app-searchbar"
                                    onFocus={() => setShowSearchResults(true)}
                                />
                                {showSearchResults && search.length > 0 && search.length <= 2 && (
                                    <div className="search-results info-msg">
                                        <p>Type 3+ characters to search...</p>
                                    </div>
                                )}
                                {showSearchResults && search.length > 2 && searchResults.length === 0 && (
                                    <div className="search-results info-msg">
                                        <p>No results found.</p>
                                    </div>
                                )}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="search-results">
                                        {searchResults.map((res, i) => (
                                            <div
                                                key={i}
                                                className="search-result"
                                                onClick={() => {
                                                    setLngLat([res.lng, res.lat]);
                                                    setSearchResults([]);
                                                    setSearch("");
                                                    setShowSearchResults(false);
                                                }}
                                            >
                                                {res.text || res.address || res.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="header-nav-right">
                            <button
                                className="header-btn"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                            >Undo</button>
                            <button
                                className="header-btn"
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                            >Redo</button>
                        </div>
                    </header>

                    <section id="editor-main">
                        <aside className="app-slider">
                            <ul className="menu">
                                <li
                                    id="menu-draw"
                                    className={`user-select-none ${menu === "draw" ? "menu-active" : ""}`}
                                    onClick={(e) => selectMenu(e, "draw")}
                                >
                                    <img src="/icons/brush.svg" alt="Draw" />
                                </li>
                                <li
                                    id="menu-map"
                                    className={`user-select-none ${menu === "map" ? "menu-active" : ""}`}
                                    onClick={(e) => selectMenu(e, "map")}
                                >
                                    <img src="/icons/map.svg" alt="Properties" />
                                </li>
                                <li
                                    id="menu-render"
                                    className="user-select-none"
                                    onClick={() => navigate("/render")}
                                >
                                    <img src="/icons/eye.svg" alt="Render Page" />
                                </li>
                                <li
                                    id="menu-exports"
                                    className={`user-select-none ${menu === "exports" ? "menu-active" : ""}`}
                                    onClick={(e) => selectMenu(e, "exports")}
                                >
                                    <img src="/icons/export.svg" alt="Exports" />
                                </li>
                                <div className="menu-spacer" style={{ flexGrow: 1 }}></div>
                                <li
                                    id="menu-settings"
                                    className={`user-select-none ${menu === "settings" ? "menu-active" : ""}`}
                                    onClick={(e) => selectMenu(e, "settings")}
                                >
                                    <img src="/icons/setting.svg" alt="Settings" />
                                </li>
                            </ul>

                            <ul id="menu-tools">
                                <li className="menu-item-container" id="menu-item-map">
                                    <div className="menu-tools-section">
                                        <div className="menu-item-title-row">
                                            <h4 className="user-select-none">Properties</h4>
                                            <img src="/icons/down-arrow.svg" className="menu-section-icon" alt="Expand" />
                                        </div>
                                        <ul className="tool-list">
                                            {mapProperties.map((p, i) => (
                                                <li key={`map-prop-${p.id}`} className="tool-item map-list-item" onClick={()=> handlePointSelect(p)}>
                                                    <div className="tool-icon">
                                                        {p.type === "home" ? <img src="/icons/home-point.svg" alt="Home" /> : 
                                                         p.type === "apartment" ? <img src="/icons/building-point.svg" alt="Apartment" /> : 
                                                         p.type === "unit" ? <img src="/icons/unit-point.svg" alt="Unit" /> :
                                                         "📍"}
                                                    </div>
                                                    <div className="map-list-item-content">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.name.replace("(Unsaved)", "").trim() || `Property ${p.id}`}
                                                            </span>
                                                            {p.name.includes("(Unsaved)") && (
                                                                <div className="unsaved-dot-marker" style={{ 
                                                                    width: '8px', 
                                                                    height: '8px', 
                                                                    backgroundColor: '#f59e0b', 
                                                                    borderRadius: '50%',
                                                                    flexShrink: 0
                                                                }} title="Unsaved changes" />
                                                            )}
                                                        </div>
                                                        {p.source === "canvas" && <div className="unsaved-dot" title="Unsaved changes"></div>}
                                                        <button className="inline-delete-btn" onClick={(e) => { e.stopPropagation(); deleteCanvasObjects(p.id); }}>🗑️</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="menu-tools-section">
                                        <div className="menu-item-title-row">
                                            <h4 className="user-select-none">Points</h4>
                                            <img src="/icons/down-arrow.svg" className="menu-section-icon" alt="Expand" />
                                        </div>
                                        <ul className="tool-list">
                                            {mapPoints.map((p, i) => (
                                                <li key={`map-point-${p.id}`} className="tool-item map-list-item" onClick={()=> handlePointSelect(p)}>
                                                    <div className="tool-icon">
                                                        {p.type === "radius" ? "⭕" : 
                                                         p.type === "line" ? "📏" : 
                                                         (p.icon && p.icon.includes("/")) ? <img src={p.icon} alt="Marker" style={{width: '20px', height: '20px', display: 'block'}} /> : 
                                                         (p.icon || "📍")}
                                                    </div>
                                                    <div className="map-list-item-content">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white' }}>
                                                                {(p.name || (p.type === "marker" || p.type === "icon" ? "Icon" : `Point ${p.id}`)).replace("(Unsaved)", "").trim()}
                                                            </span>
                                                            {p.name?.includes("(Unsaved)") && (
                                                                <div className="unsaved-dot-marker" style={{ 
                                                                    width: '8px', 
                                                                    height: '8px', 
                                                                    backgroundColor: '#f59e0b', 
                                                                    borderRadius: '50%',
                                                                    flexShrink: 0
                                                                }} title="Unsaved changes" />
                                                            )}
                                                        </div>
                                                        {p.source === "canvas" && <div className="unsaved-dot" title="Unsaved changes"></div>}
                                                        <button className="inline-delete-btn" onClick={(e) => { e.stopPropagation(); deleteCanvasObjects(p.id); }}>🗑️</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>

                                <li className="menu-item-container hidden" id="menu-item-draw">
                                    <div className="menu-tools-section">
                                        <h4 className="user-select-none">Primary Tools</h4>
                                        <ul className="tool-list">
                                            <li className={`tool-item ${(canvasSelect.type === "marker" || canvasSelect.type === "icon") ? "tool-active" : ""}`} onClick={() => selectCanvasAddon("/icons/geo-alt-fill.svg", "Marker", "marker")}>
                                                <div className="tool-icon"><img src="/icons/geo-alt-fill.svg" alt="Marker" /></div>
                                                <span>Marker</span>
                                            </li>
                                            <li className={`tool-item ${canvasSelect.type === "home" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Home", "home")}>
                                                <div className="tool-icon"><img src="/icons/home-point.svg" alt="Home" /></div>
                                                <span>Home</span>
                                            </li>
                                            <li className={`tool-item ${canvasSelect.type === "apartment" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Apartment", "apartment")}>
                                                <div className="tool-icon"><img src="/icons/building-point.svg" alt="Apartment" /></div>
                                                <span>Apartment</span>
                                            </li>
                                            <li className={`tool-item ${canvasSelect.type === "unit" ? "tool-active" : ""}`} onClick={() => selectCanvasAddon(null, "Unit", "unit")}>
                                                <div className="tool-icon"><img src="/icons/unit-point.svg" alt="Unit" /></div>
                                                <span>Unit</span>
                                            </li>

                                            {savedTypesStore.data.map(type => (
                                                <li
                                                    key={`saved-type-${type.id}`}
                                                    className={`tool-item tool-marker ${canvasSelect.savedTypeId === type.id ? "tool-active" : ""}`}
                                                    onClick={() => setCanvasSelect({
                                                        type: "icon",
                                                        savedTypeId: type.id,
                                                        name: type.name,
                                                        icon: type.type
                                                    })}
                                                >
                                                    <div className="tool-icon">
                                                        {type.type.length > 5 ? <img src={type.type} alt={type.name} /> : type.type}
                                                    </div>
                                                    <span className="user-select-none">{type.name}</span>
                                                </li>
                                            ))}

                                            <ModalItem
                                                itemText={
                                                    <li className="tool-item tool-marker add-custom-point">
                                                        <div className="tool-icon">+</div>
                                                        <span className="user-select-none">Custom Icon</span>
                                                    </li>
                                                }
                                                modalComponent={<CustomPointModal />}
                                            />
                                        </ul>
                                    </div>

                                    <div className="menu-tools-section">
                                        <h4 className="user-select-none">Measures</h4>
                                        <ul className="tool-list">
                                            <li
                                                className={`tool-item tool-marker ${canvasSelect.type === "radius" ? "tool-active" : ""}`}
                                                onClick={() => selectCanvasAddon(null, "Radius", "radius")}
                                            >
                                                <div className="tool-icon">⭕</div>
                                                <span className="user-select-none">Radius</span>
                                            </li>
                                            <li
                                                className={`tool-item tool-marker ${canvasSelect.type === "line" ? "tool-active" : ""}`}
                                                onClick={() => selectCanvasAddon(null, "Line", "line")}
                                            >
                                                <div className="tool-icon">📏</div>
                                                <span className="user-select-none">Line</span>
                                            </li>
                                        </ul>
                                    </div>
                                </li>

                                <li className="hidden menu-item-container" id="menu-item-exports">
                                    <div className="menu-tools-section">
                                        <h4>Data Export</h4>
                                        <p className="empty-section-text">Coming Soon...</p>
                                    </div>
                                </li>

                                <li className="hidden menu-item-container" id="menu-item-settings">
                                    {menu === "settings" && <SettingsPanel onClose={(e) => selectMenu(e, "settings")} />}
                                </li>
                            </ul>
                        </aside>

                        {selectedPoint && (
                            <aside className="app-slider-right">
                                <PropertyDetailsSidebar
                                    point={selectedPoint}
                                    onClose={handleCloseSidebar}
                                    onUpdate={addCanvasObjects}
                                    onDelete={(id) => { deleteCanvasObjects(id); setSelectedPoint(null); }}
                                    allPoints={Object.values(canvasObjects)}
                                    isPinned={isPinned}
                                    onPinToggle={() => setIsPinned(!isPinned)}
                                />
                            </aside>
                        )}

                        <MapComponent
                            layer={settings.map_layer}
                            lngLat={lngLat}
                            markers={memoMarkers}
                            canvasTool={canvasSelect}
                            createdCanvasObject={addCanvasObjects}
                            deletedCanvasObject={deleteCanvasObjects}
                            getMetadata={getMetadata}
                            onSelect={handlePointSelect}
                            onCloseSidebar={handleCloseSidebar}
                        />
                    </section>
                </div>
            )}
        </div>
    )
}