import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { thunkGetPoints } from "../../redux/points";
import { thunkGetAllProperties } from "../../redux/properties";
import { thunkGetAllMaps, thunkCreateMap, thunkUpdateMap, thunkDeleteMap } from "../../redux/maps";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search as SearchIcon, Share2, Plus, ChevronDown, Check, Edit2 } from "lucide-react";
import { handleSearchAddress } from "../../functions/nominatim";
import MapComponent from "../../components/MapPageComponents/Map";
import Sidebar from "./Sidebar";
import DetailPanel from "./DetailPanel";
import useCanvasStaging from "../../hooks/useMapStaging";
import { useModal } from "../../context/Modal";
import MapForm from "../../components/Forms/MapForm/MapForm";

export default function MapEditor() {
    const { mapId } = useParams();
    const { state } = useLocation();
    const propertyStore = useSelector(store => store.properties);
    const pointStore = useSelector(state => state.points);
    const mapStore = useSelector(state => state.maps);
    const savedTypesStore = useSelector(state => state.savedTypes);
    const settings = useSelector(state => state.settings);
    const overlaysStore = useSelector(state => state.overlays);
    const dispatch = useDispatch();
    const { setModalContent } = useModal();

    const {
        canvasObjects,
        deletedProperties,
        deletedPoints,
        hasUnsavedChanges,
        history, historyIndex,
        loaded,
        saving,
        handleSaveAll,
        addCanvasObjects,
        deleteCanvasObjects,
        getMetadata,
        undo, redo,
    } = useCanvasStaging(propertyStore, pointStore, dispatch, false, mapId);

    const [lngLat, setLngLat] = useState([-83.5, 32.9]);
    const [canvasSelect, setCanvasSelect] = useState({ icon: null, name: null, type: null });

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);

    const [mapDropdownOpen, setMapDropdownOpen] = useState(false);
    const mapDropdownRef = useRef(null);

    const contextMenuRef = useRef(null);

    const [menu, setMenu] = useState("map")
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isPinned, setIsPinned] = useState(false);

    const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, type: null, data: null });

    const navigate = useNavigate();

    useEffect(() => {
        if (!mapId) {
            navigate("/dashboard");
        } else {
            dispatch(thunkGetAllMaps());
        }
    }, [mapId, navigate, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
            if (mapDropdownRef.current && !mapDropdownRef.current.contains(event.target)) {
                setMapDropdownOpen(false);
            }
            if (contextMenu.isOpen && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setContextMenu(prev => ({ ...prev, isOpen: false }));
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

        (overlaysStore.activeMapIds || []).forEach(oMapId => {
            const oPoints = overlaysStore.points[oMapId] || [];
            const oProps = overlaysStore.properties[oMapId] || [];

            oProps.forEach(p => {
                allMarkers.push({ ...p, id: `overlay-${oMapId}-prop-${p.id}`, source: 'db', type: p.type || "home", lngLat: [p.lng, p.lat], isOverlay: true, overlayMapId: oMapId });
            });

            oPoints.forEach(p => {
                allMarkers.push({ ...p, id: `overlay-${oMapId}-point-${p.id}`, source: 'db', lngLat: [p.lng, p.lat], isOverlay: true, overlayMapId: oMapId });
            });
        });

        return allMarkers;
    }, [propertyStore.data, pointStore.data, canvasObjects, deletedProperties, deletedPoints, overlaysStore]);

    const handlePointSelect = (point) => {
        if (point.isOverlay) {
            const newId = `temp-${point.type || "point"}-${Date.now()}`;
            const importedPoint = { 
                ...point, 
                id: newId, 
                source: "canvas" 
            };
            delete importedPoint.isOverlay;
            delete importedPoint.overlayMapId;
            addCanvasObjects(importedPoint);
            return;
        }

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
        setMenu(prev => prev === val ? "" : val);
    };

    const selectCanvasAddon = (icon, name, type = "icon") => {
        if (canvasSelect.icon === icon && canvasSelect.name === name) {
            setCanvasSelect({ icon: null, name: null, type: null });
            return;
        }
        setCanvasSelect({ icon, name, type });
    };

    return (
        <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-col">
            {!loaded ? (
                <div className="flex-1 flex items-center justify-center">
                    <i className="fa-solid fa-spinner fa-spin-pulse text-4xl"></i>
                </div>
            ) : (
                <div id="editor" className="flex flex-col h-full w-full">
                    <header className="flex items-center justify-between px-4 py-2 bg-card border-b z-50">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleSaveAll}
                                disabled={!hasUnsavedChanges || saving}
                            >{saving ? "Saving..." : "Save All"}</Button>

                            <div className="relative ml-4" ref={mapDropdownRef}>
                                <button
                                    onClick={() => setMapDropdownOpen(!mapDropdownOpen)}
                                    className="flex items-center justify-between h-8 bg-input border border-border text-foreground text-sm rounded-md px-3 min-w-[200px] hover:bg-accent/50 transition-colors"
                                >
                                    <span className="truncate max-w-[150px]">
                                        {mapStore.data.find(m => String(m.id) === String(mapId))?.name || "Select Map..."}
                                    </span>
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </button>
                                
                                {mapDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-[250px] max-h-80 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
                                        {(mapStore.data || []).map(m => (
                                            <div
                                                key={m.id}
                                                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground ${String(m.id) === String(mapId) ? 'bg-accent/50 font-medium' : ''}`}
                                                onClick={() => {
                                                    if (String(m.id) === String(mapId)) {
                                                        setMapDropdownOpen(false);
                                                        return;
                                                    }
                                                    if (hasUnsavedChanges) {
                                                        if (!window.confirm("You have unsaved changes. Change map anyway?")) return;
                                                    }
                                                    setMapDropdownOpen(false);
                                                    navigate(`/editor/${m.id}`);
                                                }}
                                                onContextMenu={async (e) => {
                                                    e.preventDefault();
                                                    setContextMenu({
                                                        isOpen: true,
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        type: 'map',
                                                        data: m
                                                    });
                                                }}
                                                title="Right-click for options"
                                            >
                                                <span className="truncate">{m.name}</span>
                                                {String(m.id) === String(mapId) && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
                                            </div>
                                        ))}
                                        
                                        <div className="h-px bg-border my-1" />
                                        
                                        <div
                                            className="flex items-center px-3 py-2 text-sm cursor-pointer rounded-sm hover:bg-primary/10 text-primary font-medium"
                                            onClick={() => {
                                                setMapDropdownOpen(false);
                                                setModalContent(<MapForm onSuccess={(data) => {
                                                    if (Object.keys(canvasObjects).length > 0) {
                                                        if (!window.confirm("You have unsaved changes. Change map anyway?")) return;
                                                    }
                                                    navigate(`/editor/${data.id}`);
                                                }} />);
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Create New Map
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 flex justify-center px-4">
                            <div className="relative w-full max-w-md flex items-center" ref={searchRef}>
                                <SearchIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Find addresses or points..."
                                    className="pl-9 w-full bg-input/50 border-input"
                                    onFocus={() => setShowSearchResults(true)}
                                />
                                {showSearchResults && search.length > 0 && search.length <= 2 && (
                                    <div className="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 p-3 text-sm">
                                        <p>Type 3+ characters to search...</p>
                                    </div>
                                )}
                                {showSearchResults && search.length > 2 && searchResults.length === 0 && (
                                    <div className="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 p-3 text-sm">
                                        <p>No results found.</p>
                                    </div>
                                )}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-60 overflow-y-auto z-50 flex flex-col py-1">
                                        {searchResults.map((res, i) => (
                                            <div
                                                key={i}
                                                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => {
                                                    setLngLat([res.lng, res.lat]);
                                                    setSearch("");
                                                    setShowSearchResults(false);
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setContextMenu({
                                                        isOpen: true,
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        type: 'search',
                                                        data: res
                                                    });
                                                }}
                                                title="Right-click for options"
                                            >
                                                {res.text || res.address || res.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                            >Undo</Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                            >Redo</Button>
                            
                            <Button variant="outline" size="sm" className="ml-2 gap-2" onClick={() => alert("Share Map coming soon!")}>
                                <Share2 className="w-4 h-4" /> Share
                            </Button>
                        </div>
                    </header>

                    <section className="flex flex-1 overflow-hidden relative">
                        <Sidebar
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

                        {contextMenu.isOpen && (
                            <div 
                                ref={contextMenuRef}
                                className="fixed z-[100] w-48 bg-popover text-popover-foreground border border-border rounded-md shadow-md py-1 text-sm animate-in fade-in zoom-in-95 duration-100"
                                style={{ top: contextMenu.y, left: contextMenu.x }}
                            >
                                {contextMenu.type === 'search' && (
                                    <>
                                        <div 
                                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center"
                                            onClick={() => {
                                                setLngLat([contextMenu.data.lng, contextMenu.data.lat]);
                                                setSearch(""); setShowSearchResults(false);
                                                setContextMenu({ ...contextMenu, isOpen: false });
                                            }}
                                        >
                                            Go to Location
                                        </div>
                                        <div className="h-px bg-border my-1" />
                                        <div 
                                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center"
                                            onClick={() => {
                                                const id = `temp-point-${Date.now()}`;
                                                const name = contextMenu.data.name || contextMenu.data.address || contextMenu.data.city || "Marker";
                                                addCanvasObjects({ id, name, lng: Number(contextMenu.data.lng), lat: Number(contextMenu.data.lat), lngLat: [Number(contextMenu.data.lng), Number(contextMenu.data.lat)], type: 'point', source: "canvas" });
                                                setLngLat([contextMenu.data.lng, contextMenu.data.lat]);
                                                setSearch(""); setShowSearchResults(false);
                                                setContextMenu({ ...contextMenu, isOpen: false });
                                            }}
                                        >
                                            Place Point
                                        </div>
                                        <div 
                                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center"
                                            onClick={() => {
                                                const id = `temp-home-${Date.now()}`;
                                                const name = contextMenu.data.name || contextMenu.data.address || contextMenu.data.city || "Home";
                                                addCanvasObjects({ id, name, lng: Number(contextMenu.data.lng), lat: Number(contextMenu.data.lat), lngLat: [Number(contextMenu.data.lng), Number(contextMenu.data.lat)], type: 'home', source: "canvas" });
                                                setLngLat([contextMenu.data.lng, contextMenu.data.lat]);
                                                setSearch(""); setShowSearchResults(false);
                                                setContextMenu({ ...contextMenu, isOpen: false });
                                            }}
                                        >
                                            Place Property (Home)
                                        </div>
                                        <div 
                                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center"
                                            onClick={() => {
                                                const id = `temp-unit-${Date.now()}`;
                                                const name = contextMenu.data.name || contextMenu.data.address || contextMenu.data.city || "Unit";
                                                addCanvasObjects({ id, name, lng: Number(contextMenu.data.lng), lat: Number(contextMenu.data.lat), lngLat: [Number(contextMenu.data.lng), Number(contextMenu.data.lat)], type: 'unit', source: "canvas" });
                                                setLngLat([contextMenu.data.lng, contextMenu.data.lat]);
                                                setSearch(""); setShowSearchResults(false);
                                                setContextMenu({ ...contextMenu, isOpen: false });
                                            }}
                                        >
                                            Place Property (Unit)
                                        </div>
                                        <div 
                                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center"
                                            onClick={() => {
                                                const id = `temp-apartment-${Date.now()}`;
                                                const name = contextMenu.data.name || contextMenu.data.address || contextMenu.data.city || "Apartment";
                                                addCanvasObjects({ id, name, lng: Number(contextMenu.data.lng), lat: Number(contextMenu.data.lat), lngLat: [Number(contextMenu.data.lng), Number(contextMenu.data.lat)], type: 'apartment', source: "canvas" });
                                                setLngLat([contextMenu.data.lng, contextMenu.data.lat]);
                                                setSearch(""); setShowSearchResults(false);
                                                setContextMenu({ ...contextMenu, isOpen: false });
                                            }}
                                        >
                                            Place Property (Apartment)
                                        </div>
                                    </>
                                )}
                                {contextMenu.type === 'map' && (
                                    <div 
                                        className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                                        onClick={() => {
                                            setContextMenu({ ...contextMenu, isOpen: false });
                                            setMapDropdownOpen(false);
                                            setModalContent(<MapForm mapId={contextMenu.data.id} initialData={contextMenu.data} />);
                                        }}
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Map Info
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    )
}
