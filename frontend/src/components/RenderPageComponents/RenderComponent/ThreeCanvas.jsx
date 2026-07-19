import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera, OrbitControls, Grid, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import RoomWalls from "./RoomWalls";
import GhostPreview from "./GhostPreview";
import FurnitureObject from "./FurnitureObject";
import ViewportGizmo from "./ViewportGizmo";

const FALLBACK_METERS_PER_PIXEL = 0.01;
const DEFAULT_BLOCK_SIZE = 1;
const DEFAULT_WALL_HEIGHT = 2.4;
const DEFAULT_WALL_THICKNESS = 0.16;

function finiteNumber(value, fallback = 0) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}

function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function sceneMetrics(rooms = [], elements = [], objects = []) {
    const boundsItems = [...rooms, ...elements, ...objects].filter(Boolean);
    if (!boundsItems.length) {
        return {
            center: { x: 0, y: 0 },
            metersPerPixel: FALLBACK_METERS_PER_PIXEL,
            widthMeters: 40,
            depthMeters: 40,
        };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const meterRatios = [];

    boundsItems.forEach(item => {
        if (item.type === "divider_line" && item.x1 != null && item.y1 != null && item.x2 != null && item.y2 != null) {
            minX = Math.min(minX, item.x1, item.x2);
            minY = Math.min(minY, item.y1, item.y2);
            maxX = Math.max(maxX, item.x1, item.x2);
            maxY = Math.max(maxY, item.y1, item.y2);
            return;
        }

        const width = Math.max(finiteNumber(item.width, item.radius ? item.radius * 2 : 1), 1);
        const height = Math.max(finiteNumber(item.height, item.radius ? item.radius * 2 : 1), 1);
        const x = finiteNumber(item.x, 0);
        const y = finiteNumber(item.y, 0);
        const isCenteredObject = item.type === "object";
        minX = Math.min(minX, isCenteredObject ? x - width / 2 : x);
        minY = Math.min(minY, isCenteredObject ? y - height / 2 : y);
        maxX = Math.max(maxX, isCenteredObject ? x + width / 2 : x + width);
        maxY = Math.max(maxY, isCenteredObject ? y + height / 2 : y + height);

        if (item.widthMeters && width) meterRatios.push(Number(item.widthMeters) / width);
        if (item.heightMeters && height) meterRatios.push(Number(item.heightMeters) / height);
    });

    if (!Number.isFinite(minX)) {
        minX = -500;
        minY = -500;
        maxX = 500;
        maxY = 500;
    }

    const validRatios = meterRatios.filter(value => Number.isFinite(value) && value > 0);
    const metersPerPixel = median(validRatios) || FALLBACK_METERS_PER_PIXEL;
    return {
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        metersPerPixel,
        widthMeters: Math.max((maxX - minX) * metersPerPixel, 20),
        depthMeters: Math.max((maxY - minY) * metersPerPixel, 20),
    };
}

function objectSizeMeters(object, metersPerPixel) {
    return {
        width: Math.max(finiteNumber(object.widthMeters, finiteNumber(object.width, 100) * metersPerPixel), 0.05),
        depth: Math.max(finiteNumber(object.heightMeters, finiteNumber(object.height, 100) * metersPerPixel), 0.05),
        height: Math.max(finiteNumber(object.heightMeters3d, finiteNumber(object.height3d, 80) * FALLBACK_METERS_PER_PIXEL), 0.05),
    };
}

function roomSizeMeters(room, metersPerPixel) {
    return {
        width: Math.max(finiteNumber(room.widthMeters, finiteNumber(room.width, 100) * metersPerPixel), 0.1),
        depth: Math.max(finiteNumber(room.heightMeters, finiteNumber(room.height, 100) * metersPerPixel), 0.1),
    };
}

function getRoomPoints(room, center, metersPerPixel) {
    const localPoints = Array.isArray(room._points) && room._points.length >= 3
        ? room._points
        : (Array.isArray(room.points) && room.points.length >= 3 ? room.points : null);
    if (!localPoints) return null;

    const roomX = finiteNumber(room.x, 0);
    const roomY = finiteNumber(room.y, 0);
    const roomWidth = finiteNumber(room.width, 100);
    const roomHeight = finiteNumber(room.height, 100);
    const sceneCenterX = ((roomX + roomWidth / 2) - center.x) * metersPerPixel;
    const sceneCenterZ = ((roomY + roomHeight / 2) - center.y) * metersPerPixel;

    return localPoints
        .filter(point => Array.isArray(point) && point.length >= 2)
        .map(([px, py]) => [
            ((roomX + finiteNumber(px, 0)) - center.x) * metersPerPixel - sceneCenterX,
            ((roomY + finiteNumber(py, 0)) - center.y) * metersPerPixel - sceneCenterZ,
        ]);
}

function normalizeSceneData(rooms = [], elements = [], objects = []) {
    const metrics = sceneMetrics(rooms, elements, objects);
    const { center, metersPerPixel } = metrics;

    const normalizedRooms = rooms.map(room => {
        const width = finiteNumber(room.width, 100);
        const height = finiteNumber(room.height, 100);
        const roomMeters = roomSizeMeters(room, metersPerPixel);
        return {
            ...room,
            sceneX: ((finiteNumber(room.x, 0) + width / 2) - center.x) * metersPerPixel,
            sceneZ: ((finiteNumber(room.y, 0) + height / 2) - center.y) * metersPerPixel,
            sceneWidth: roomMeters.width,
            sceneDepth: roomMeters.depth,
            scenePoints: getRoomPoints(room, center, metersPerPixel),
        };
    });

    const normalizedObjects = objects.map(object => {
        const size = objectSizeMeters(object, metersPerPixel);
        return {
            ...object,
            sceneX: (finiteNumber(object.x, 0) - center.x) * metersPerPixel,
            sceneZ: (finiteNumber(object.y, 0) - center.y) * metersPerPixel,
            sceneWidth: size.width,
            sceneDepth: size.depth,
            sceneHeight: size.height,
            sceneElevation: Math.max(finiteNumber(object.elevation, 0), 0),
        };
    });

    const normalizedElements = elements.map(element => {
        if (element.type === "divider_line" && element.x1 != null && element.y1 != null && element.x2 != null && element.y2 != null) {
            return {
                ...element,
                sceneX1: (finiteNumber(element.x1, 0) - center.x) * metersPerPixel,
                sceneZ1: (finiteNumber(element.y1, 0) - center.y) * metersPerPixel,
                sceneX2: (finiteNumber(element.x2, 0) - center.x) * metersPerPixel,
                sceneZ2: (finiteNumber(element.y2, 0) - center.y) * metersPerPixel,
                sceneThickness: Math.max(finiteNumber(element.wallThicknessMeters, finiteNumber(element.thickness, 4) * metersPerPixel), DEFAULT_WALL_THICKNESS),
            };
        }

        const width = finiteNumber(element.width, 1);
        const height = finiteNumber(element.height, 1);
        return {
            ...element,
            sceneX: ((finiteNumber(element.x, 0) + width / 2) - center.x) * metersPerPixel,
            sceneZ: ((finiteNumber(element.y, 0) + height / 2) - center.y) * metersPerPixel,
            sceneWidth: Math.max(finiteNumber(element.widthMeters, width * metersPerPixel), 0.05),
            sceneDepth: Math.max(finiteNumber(element.heightMeters, height * metersPerPixel), 0.05),
            sceneThickness: Math.max(finiteNumber(element.wallThicknessMeters, finiteNumber(element.wallThickness, finiteNumber(element.thickness, 4)) * metersPerPixel), DEFAULT_WALL_THICKNESS),
        };
    });

    return { normalizedRooms, normalizedObjects, normalizedElements, ...metrics };
}

function DoorWindowMesh({ element, wallHeight = DEFAULT_WALL_HEIGHT }) {
    if (!element) return null;

    const isWindow = element.openingType === "window";
    const openingWidth = Math.max(element.sceneWidth || DEFAULT_WALL_THICKNESS, DEFAULT_WALL_THICKNESS);
    const openingDepth = Math.max(element.sceneDepth || DEFAULT_WALL_THICKNESS, DEFAULT_WALL_THICKNESS);
    const isHorizontal = openingWidth >= openingDepth;
    const visualWidth = isHorizontal ? openingWidth : openingDepth;
    const visualDepth = DEFAULT_WALL_THICKNESS * 0.35;
    const openingHeight = isWindow
        ? Math.min(Math.max(finiteNumber(element.openingHeightMeters, wallHeight * 0.35), 0.4), wallHeight * 0.6)
        : Math.min(Math.max(finiteNumber(element.openingHeightMeters, wallHeight * 0.85), 1.4), wallHeight);
    const y = isWindow ? wallHeight * 0.55 : openingHeight / 2;
    const color = isWindow ? "#38bdf8" : "#f8fafc";

    return (
        <mesh
            position={[element.sceneX || 0, y, element.sceneZ || 0]}
            rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}
            userData={{ appElementId: element.id, exportKind: "opening" }}
        >
            <boxGeometry args={[visualWidth, openingHeight, visualDepth]} />
            <meshStandardMaterial color={color} transparent opacity={0.72} />
        </mesh>
    );
}

function WallDividerMesh({ element, wallHeight = DEFAULT_WALL_HEIGHT, showDivider = true }) {
    if (!element) return null;

    const isDivider = element.type === "divider_line";
    if (isDivider && !showDivider) return null;

    const color = isDivider ? "#6366f1" : "#475569";
    const thickness = Math.max(element.sceneThickness || DEFAULT_WALL_THICKNESS, 0.04);

    if (isDivider && element.sceneX1 != null && element.sceneZ1 != null && element.sceneX2 != null && element.sceneZ2 != null) {
        const x1 = element.sceneX1;
        const z1 = element.sceneZ1;
        const x2 = element.sceneX2;
        const z2 = element.sceneZ2;
        const length = Math.max(Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2), 0.05);
        const angle = Math.atan2(z2 - z1, x2 - x1);

        return (
            <mesh
                position={[(x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2]}
                rotation={[0, -angle, 0]}
                userData={{ appElementId: element.id, exportKind: "divider" }}
            >
                <boxGeometry args={[length, wallHeight, thickness]} />
                <meshStandardMaterial color={color} transparent opacity={0.28} />
            </mesh>
        );
    }

    const wallWidth = Math.max(element.sceneWidth || DEFAULT_WALL_THICKNESS, DEFAULT_WALL_THICKNESS);
    const wallDepth = Math.max(element.sceneDepth || thickness, thickness);

    return (
        <mesh
            position={[element.sceneX || 0, wallHeight / 2, element.sceneZ || 0]}
            userData={{ appElementId: element.id, exportKind: "wall" }}
        >
            <boxGeometry args={[wallWidth, wallHeight, wallDepth]} />
            <meshStandardMaterial color={element.fill || color} transparent opacity={0.78} />
        </mesh>
    );
}

function SceneExporter({ sceneRef, onSceneReady }) {
    const { scene } = useThree();
    
    useEffect(() => {
        if (scene) {
            sceneRef.current = scene;
            onSceneReady?.(scene);
        }
    }, [scene, sceneRef, onSceneReady]);
    
    return null;
}

function CameraController({ request, sceneSize, controlsRef }) {
    const { camera } = useThree();

    useEffect(() => {
        if (!request?.axis || !camera) return;
        const span = Math.max(sceneSize.widthMeters, sceneSize.depthMeters, 20);
        const distance = span * 1.35;
        const positions = {
            iso: [distance, distance * 0.75, distance],
            top: [0, distance * 1.35, 0.001],
            front: [0, distance * 0.55, distance],
            back: [0, distance * 0.55, -distance],
            left: [-distance, distance * 0.55, 0],
            right: [distance, distance * 0.55, 0],
        };
        const next = positions[request.axis] || positions.iso;
        camera.position.set(...next);
        camera.lookAt(0, 0, 0);
        if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
        }
    }, [camera, controlsRef, request, sceneSize]);

    return null;
}

function Scene({ stage, rooms, elements, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed, viewMode, wallHeight, blockSize, sceneRef, onSceneReady, transformMode, onTransformEnd, cameraViewRequest }) {
    const is3D = stage === "render3d";
    const showOutlines = viewMode === "block";
    const controlsRef = useRef(null);
    const [transformTarget, setTransformTarget] = useState(null);
    const [ghostPosition, setGhostPosition] = useState(null);

    const {
        normalizedRooms,
        normalizedObjects,
        normalizedElements,
        center,
        metersPerPixel,
        widthMeters,
        depthMeters,
    } = useMemo(() => {
        return normalizeSceneData(rooms || [], elements || [], objectsData || []);
    }, [rooms, objectsData, elements]);

    const selectedObject = useMemo(
        () => (normalizedObjects || []).find(obj => obj.id === selectedObjectId) || null,
        [normalizedObjects, selectedObjectId]
    );

    useEffect(() => {
        if (!selectedObjectId) setTransformTarget(null);
    }, [selectedObjectId]);

    const handleCanvasClick = useCallback((e) => {
        if (placementState?.active || placementState?.isActive) {
            e.stopPropagation();
            const point = e.point;
            onCanvasClick?.({
                x: point.x / metersPerPixel + center.x,
                y: point.z / metersPerPixel + center.y,
            });
        }
    }, [placementState, onCanvasClick, center, metersPerPixel]);

    const handleCanvasPointerMove = useCallback((e) => {
        if (!placementState?.active && !placementState?.isActive) return;
        setGhostPosition({ x: e.point.x, z: e.point.z });
    }, [placementState]);

    const handleTransformEnd = useCallback(() => {
        if (!transformTarget || !selectedObject) return;
        const widthBase = Math.max(selectedObject.sceneWidth || 1, 0.05);
        const depthBase = Math.max(selectedObject.sceneDepth || 1, 0.05);
        const heightBase = Math.max(selectedObject.sceneHeight || 1, 0.05);
        const widthMeters = Math.max(widthBase * transformTarget.scale.x, 0.05);
        const heightMeters = Math.max(depthBase * transformTarget.scale.z, 0.05);
        const heightMeters3d = Math.max(heightBase * transformTarget.scale.y, 0.05);

        onTransformEnd?.({
            id: selectedObject.id,
            x: transformTarget.position.x / metersPerPixel + center.x,
            y: transformTarget.position.z / metersPerPixel + center.y,
            rotation: THREE.MathUtils.radToDeg(transformTarget.rotation.y),
            elevation: Math.max(transformTarget.position.y - heightMeters3d / 2, 0),
            widthMeters,
            heightMeters,
            heightMeters3d,
        });
    }, [center, metersPerPixel, onTransformEnd, selectedObject, transformTarget]);

    return (
        <>
            {is3D ? (
                <PerspectiveCamera
                    makeDefault
                    position={[Math.max(widthMeters, 20), Math.max(widthMeters, depthMeters, 20) * 0.85, Math.max(depthMeters, 20)]}
                    fov={50}
                    near={0.01}
                    far={2000}
                />
            ) : (
                <OrthographicCamera
                    makeDefault
                    position={[0, 100, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    zoom={1}
                />
            )}

            {is3D && (
                <CameraController
                    request={cameraViewRequest}
                    sceneSize={{ widthMeters, depthMeters }}
                    controlsRef={controlsRef}
                />
            )}

            <ambientLight intensity={is3D ? 0.4 : 0.6} />
            <directionalLight
                position={[50, 100, 50]}
                intensity={is3D ? 1.0 : 0.8}
                castShadow={is3D}
            />
            {is3D && (
                <directionalLight
                    position={[-50, 80, -30]}
                    intensity={0.3}
                />
            )}

            <OrbitControls
                ref={controlsRef}
                enableRotate={is3D}
                enablePan={true}
                enableZoom={true}
                screenSpacePanning={true}
                mouseButtons={{
                    LEFT: 2,
                    MIDDLE: 1,
                }}
                enableDamping={is3D}
                dampingFactor={0.1}
                maxPolarAngle={is3D ? Math.PI / 2.05 : undefined}
            />

            {is3D && viewMode === "pure" && <fog attach="fog" args={["#172033", 80, 260]} />}

            {is3D && showOutlines && (
                <Grid
                    args={[
                        Math.ceil(Math.max(widthMeters, depthMeters, 20) + (blockSize || DEFAULT_BLOCK_SIZE) * 8),
                        Math.ceil(Math.max(widthMeters, depthMeters, 20) + (blockSize || DEFAULT_BLOCK_SIZE) * 8),
                    ]}
                    position={[0, -0.05, 0]}
                    cellSize={Math.max(blockSize || DEFAULT_BLOCK_SIZE, 0.25)}
                    cellThickness={0.55}
                    cellColor="#3b82f6"
                    sectionSize={Math.max((blockSize || DEFAULT_BLOCK_SIZE) * 5, 1)}
                    sectionThickness={1.2}
                    sectionColor="#22d3ee"
                    fadeDistance={Math.max(widthMeters, depthMeters, 20)}
                    fadeStrength={0.7}
                />
            )}

            <mesh
                position={[0, -0.1, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={handleCanvasClick}
                onPointerMove={handleCanvasPointerMove}
                visible={false}
            >
                <planeGeometry args={[10000, 10000]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {(normalizedRooms || []).map(room => (
                <RoomWalls
                    key={room.id}
                    room={room}
                    stage={stage}
                    wallHeight={wallHeight || DEFAULT_WALL_HEIGHT}
                    viewMode={viewMode}
                    blockSize={blockSize || DEFAULT_BLOCK_SIZE}
                />
            ))}

            {(normalizedElements || []).map(element => {
                if (element.type === "wall" || element.type === "divider_line") {
                    return (
                        <WallDividerMesh
                            key={element.id}
                            element={element}
                            wallHeight={wallHeight || DEFAULT_WALL_HEIGHT}
                            showDivider={showOutlines}
                        />
                    );
                }
                return (
                    <DoorWindowMesh
                        key={element.id}
                        element={element}
                        wallHeight={wallHeight || DEFAULT_WALL_HEIGHT}
                    />
                );
            })}

            <GhostPreview
                position={ghostPosition}
                catalogItem={placementState?.catalogItem || placementState?.item}
                visible={placementState?.active || placementState?.isActive || false}
            />

            {(normalizedObjects || []).map(obj => (
                <FurnitureObject
                    key={obj.id}
                    object={obj}
                    isSelected={obj.id === selectedObjectId}
                    onClick={onObjectClick}
                    ref={obj.id === selectedObjectId ? setTransformTarget : null}
                />
            ))}

            {is3D && selectedObjectId && transformTarget && (
                <TransformControls
                    object={transformTarget}
                    mode={transformMode || "translate"}
                    size={0.7}
                    onMouseDown={() => { if (controlsRef.current) controlsRef.current.enabled = false; }}
                    onMouseUp={() => {
                        if (controlsRef.current) controlsRef.current.enabled = true;
                        handleTransformEnd();
                    }}
                />
            )}

            <SceneExporter sceneRef={sceneRef} onSceneReady={onSceneReady} />
        </>
    );
}

export default function ThreeCanvas({ stage, rooms, elements, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed, viewMode = "block", wallHeight, blockSize = DEFAULT_BLOCK_SIZE, sceneRef, onSceneReady, transformMode, onTransformEnd }) {
    const is3D = stage === "render3d";
    const [cameraViewRequest, setCameraViewRequest] = useState({ axis: "iso", nonce: 0 });

    const handleAxisClick = useCallback((axis) => {
        setCameraViewRequest({ axis, nonce: Date.now() });
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Canvas
                gl={{ alpha: !is3D, antialias: true }}
                shadows={is3D}
                style={{ background: is3D ? "#1a1a2e" : "transparent" }}
                orthographic={!is3D}
            camera={{
                position: is3D ? [100, 150, 100] : [0, 100, 0],
                zoom: is3D ? undefined : 1,
            }}
            onPointerMissed={onPointerMissed}
        >
            <Suspense fallback={null}>
                <Scene
                    stage={stage}
                    rooms={rooms}
                    elements={elements}
                    objectsData={objectsData}
                    placementState={placementState}
                    selectedObjectId={selectedObjectId}
                    onObjectClick={onObjectClick}
                    onCanvasClick={onCanvasClick}
                    onPointerMissed={onPointerMissed}
	                    viewMode={viewMode}
	                    wallHeight={wallHeight}
	                    blockSize={blockSize}
	                    sceneRef={sceneRef}
	                    onSceneReady={onSceneReady}
	                    transformMode={transformMode}
	                    onTransformEnd={onTransformEnd}
	                    cameraViewRequest={cameraViewRequest}
	                />
	            </Suspense>
	        </Canvas>
        {is3D && <ViewportGizmo onAxisClick={handleAxisClick} />}
        </div>
    );
}
