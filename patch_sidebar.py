import re

with open('frontend/src/pages/MapEditor/Sidebar/Sidebar.jsx', 'r') as f:
    content = f.read()

sidebar_old = """export default function Sidebar({
    menu, selectMenu,
    canvasSelect, selectCanvasAddon, setCanvasSelect,
    mapProperties, mapPoints, handlePointSelect, deleteCanvasObjects,
    savedTypesStore, navigate
})"""

sidebar_new = """export default function Sidebar({
    menu, selectMenu,
    canvasSelect, selectCanvasAddon, setCanvasSelect,
    mapProperties, mapPoints, handlePointSelect, deleteCanvasObjects,
    addCanvasObjects, mapStore, mapId,
    savedTypesStore, navigate
})"""

content = content.replace(sidebar_old, sidebar_new)

datatab_old = """                {menu === "map" && (
                    <DataTab
                        mapProperties={mapProperties}
                        mapPoints={mapPoints}
                        handlePointSelect={handlePointSelect}
                        deleteCanvasObjects={deleteCanvasObjects}
                    />
                )}"""

datatab_new = """                {menu === "map" && (
                    <DataTab
                        mapProperties={mapProperties}
                        mapPoints={mapPoints}
                        handlePointSelect={handlePointSelect}
                        deleteCanvasObjects={deleteCanvasObjects}
                        addCanvasObjects={addCanvasObjects}
                        mapStore={mapStore}
                        mapId={mapId}
                    />
                )}"""

content = content.replace(datatab_old, datatab_new)

with open('frontend/src/pages/MapEditor/Sidebar/Sidebar.jsx', 'w') as f:
    f.write(content)
