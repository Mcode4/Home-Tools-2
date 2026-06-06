import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { handleSearchAddress } from "../../functions/nominatim";
import MapComponent from "../../components/MapPageComponents/Map";
import "./MapPage.css";
import ToolPanel from "./ToolPanel";
import DetailPanel from "./DetailPanel";
import useCanvasStaging from "../../hooks/useMapStaging";

export default function MapPage() {
    const { state } = useLocation()
    const propertyStore = useSelector(store => store.properties);
    const pointStore = useSelector(state => state.points);
    const savedTypesStore = useSelector(state => state.savedTypes);
    const settings = useSelector(state => state.settings);
    const dispatch = useDispatch();

    const {
        canvasObjects,
        deletedProperties,
        deletedPoints,
        history, historyIndex,
        loaded,
        handleSaveAll,
        addCanvasObjects,
        deleteCanvasObjects,
        getMetadata,
        undo, redo,
    } = useCanvasStaging(propertyStore, pointStore, dispatch);

    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [canvasSelect, setCanvasSelect] = useState({ icon: null, name: null, type: null });

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);

    const [menu, setMenu] = useState("map")
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isPinned, setIsPinned] = useState(false);

    const navigate = useNavigate();

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

    useEffect(() => {
        setSearchResults([]);
        if (!search) return;

        if (search.length > 2) {
            const searchDelay = setTimeout(() => {
                handleSearchAddress(search)
                    .then(data => setSearchResults(data))
                    .catch(err => console.log(err));
            }, 500);

            return () => {
                clearTimeout(searchDelay);
            };
        }
    }, [search]);

    const mapProperties = useMemo(() => {
        const savedProps = (propertyStore.data || []).filter(p => {
            const stagedId = `prop-${p.id}`;
            return !deletedProperties.includes(p.id) && !canvasObjects[stagedId];
        }).map(p => ({ ...p, source: 'db', type: p.type || "home" }));

        const stagedProps = Object.values(canvasObjects)
            .filter(p => ["home", "apartment", "unit"].includes(p.type))
            .map(p => ({ ...p, source: String(p.id).startsWith('temp-') ? 'canvas' : 'prop' }));

        return [...savedProps, ...stagedProps];
    }, [propertyStore.data, canvasObjects, deletedProperties]);

    const mapPoints = useMemo(() => {
        const savedPts = (pointStore.data || []).filter(p => {
            const stagedId = `point-${p.id}`;
            return !deletedPoints.includes(p.id) && !canvasObjects[stagedId];
        }).map(p => ({ ...p, source: 'db' }));

        const stagedPts = Object.values(canvasObjects)
            .filter(p => !["home", "apartment", "unit"].includes(p.type))
            .map(p => ({ ...p, source: String(p.id).startsWith('temp-') ? 'canvas' : 'point' }));

        return [...savedPts, ...stagedPts];
    }, [pointStore.data, canvasObjects, deletedPoints]);

    const memoMarkers = useMemo(() => {
        const allMarkers = [];

        (propertyStore.data || []).forEach(p => {
            const stagedId = `prop-${p.id}`;
            if (deletedProperties.includes(p.id) || deletedProperties.includes(Number(p.id)) || deletedProperties.includes(String(p.id)) || canvasObjects[stagedId]) return;
            allMarkers.push({ ...p, source: 'db', type: p.type || "home", lngLat: [p.lng, p.lat] });
        });

        (pointStore.data || []).forEach(p => {
            const stagedId = `point-${p.id}`;
            if (deletedPoints.includes(p.id) || deletedPoints.includes(Number(p.id)) || deletedPoints.includes(String(p.id)) || canvasObjects[stagedId]) return;
            allMarkers.push({ ...p, source: 'db', lngLat: [p.lng, p.lat] });
        });

        Object.values(canvasObjects).forEach(p => {
            allMarkers.push({ ...p, source: String(p.id).startsWith('temp-') ? 'canvas' : 'mod', lngLat: p.lngLat || [p.lng, p.lat] });
        });

        return allMarkers;
    }, [propertyStore.data, pointStore.data, canvasObjects, deletedProperties, deletedPoints]);

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

    const selectMenu = (e, val) => {
        e.preventDefault();
        ["draw", "map", "exports", "settings"].forEach(m => {
            const el = document.getElementById(`menu-item-${m}`);
            if (m === val) {
                el?.classList.toggle("hidden");
            } else {
                el?.classList.add("hidden");
            }
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
                        <ToolPanel
                            menu={menu}
                            selectMenu={selectMenu}
                            canvasSelect={canvasSelect}
                            selectCanvasAddon={selectCanvasAddon}
                            setCanvasSelect={setCanvasSelect}
                            mapProperties={mapProperties}
                            mapPoints={mapPoints}
                            handlePointSelect={handlePointSelect}
                            deleteCanvasObjects={deleteCanvasObjects}
                            savedTypesStore={savedTypesStore}
                            navigate={navigate}
                        />

                        <DetailPanel
                            selectedPoint={selectedPoint}
                            canvasObjects={canvasObjects}
                            addCanvasObjects={addCanvasObjects}
                            deleteCanvasObjects={deleteCanvasObjects}
                            isPinned={isPinned}
                            onPinToggle={() => setIsPinned(!isPinned)}
                            handleCloseSidebar={handleCloseSidebar}
                            setSelectedPoint={setSelectedPoint}
                        />

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
