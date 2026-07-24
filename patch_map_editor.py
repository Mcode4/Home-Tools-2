import re

with open('frontend/src/pages/MapEditor/MapEditor.jsx', 'r') as f:
    content = f.read()

# 1. Update useCanvasStaging
content = content.replace(
    "useCanvasStaging(propertyStore, pointStore, dispatch, false, mapId)",
    "useCanvasStaging(propertyStore, pointStore, overlaysStore, dispatch, false, mapId)"
)

# 2. Update mapProperties
content = re.sub(
    r'(const stagedProps = Object\.values\(canvasObjects\)\s*\.filter\(p => \["home", "apartment", "unit"\]\.includes\(p\.type\)\))(\s*\.map)',
    r'\1\n            .filter(p => String(p.map_id) === String(mapId) || (overlaysStore.visibleMapIds || []).includes(p.map_id))\2',
    content
)
content = content.replace(
    "}, [propertyStore.data, canvasObjects, deletedProperties]);",
    "}, [propertyStore.data, canvasObjects, deletedProperties, mapId, overlaysStore.visibleMapIds]);"
)

# 3. Update mapPoints
content = re.sub(
    r'(const stagedPts = Object\.values\(canvasObjects\)\s*\.filter\(p => !\["home", "apartment", "unit"\]\.includes\(p\.type\)\))(\s*\.map)',
    r'\1\n            .filter(p => String(p.map_id) === String(mapId) || (overlaysStore.visibleMapIds || []).includes(p.map_id))\2',
    content
)
content = content.replace(
    "}, [pointStore.data, canvasObjects, deletedPoints]);",
    "}, [pointStore.data, canvasObjects, deletedPoints, mapId, overlaysStore.visibleMapIds]);"
)

# 4. Update memoMarkers
memo_markers_new = """    const memoMarkers = useMemo(() => {
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
            if (String(p.map_id) !== String(mapId) && !(overlaysStore.visibleMapIds || []).includes(p.map_id)) return;
            
            allMarkers.push({ 
                ...p, 
                source: String(p.id).startsWith('temp-') ? 'canvas' : 'mod', 
                lngLat: p.lngLat || [p.lng, p.lat],
                isOverlay: String(p.map_id) !== String(mapId)
            });
        });

        return allMarkers;
    }, [propertyStore.data, pointStore.data, canvasObjects, deletedProperties, deletedPoints, mapId, overlaysStore.visibleMapIds]);"""

content = re.sub(
    r'const memoMarkers = useMemo\(\(\) => \{.*?\}, \[.*?\]\);',
    memo_markers_new,
    content,
    flags=re.DOTALL
)

# 5. Update Sidebar props
sidebar_old = """                            setCanvasSelect={setCanvasSelect}
                            mapProperties={mapProperties}
                            mapPoints={mapPoints}
                            handlePointSelect={handlePointSelect}
                            deleteCanvasObjects={deleteCanvasObjects}
                            savedTypesStore={savedTypesStore}
                            navigate={navigate}
                        />"""

sidebar_new = """                            setCanvasSelect={setCanvasSelect}
                            mapProperties={mapProperties}
                            mapPoints={mapPoints}
                            handlePointSelect={handlePointSelect}
                            deleteCanvasObjects={deleteCanvasObjects}
                            addCanvasObjects={addCanvasObjects}
                            mapStore={mapStore}
                            mapId={mapId}
                            savedTypesStore={savedTypesStore}
                            navigate={navigate}
                        />"""

content = content.replace(sidebar_old, sidebar_new)

with open('frontend/src/pages/MapEditor/MapEditor.jsx', 'w') as f:
    f.write(content)
