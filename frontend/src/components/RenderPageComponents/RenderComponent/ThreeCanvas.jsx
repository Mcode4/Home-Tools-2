import { Suspense, useCallback, useRef, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera, OrbitControls, Grid, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import RoomWalls from "./RoomWalls";
import GhostPreview from "./GhostPreview";
import FurnitureObject from "./FurnitureObject";
import ViewportGizmo from "./ViewportGizmo";

function DoorWindowMesh({ element, room, wallHeight = 240 }) {
    if (!room) return null;
    
    const isWindow = element.openingType === "window";
    const doorWidth = isWindow ? (element.width || 120) : (element.width || 90);
    const doorHeight = isWindow ? (element.height || 80) : (element.height || 210);
    const color = isWindow ? "#38bdf8" : "#f8fafc";
    
    // Position relative to room center
    const roomCenterX = (room.x || 0) + (room.width || 100) / 2;
    const roomCenterY = (room.y || 0) + (room.height || 100) / 2;
    const relX = (element.x || 0) - roomCenterX + (element.width || 0) / 2;
    const relZ = (element.y || 0) - roomCenterY + (element.height || 0) / 2;
    
    return (
        <mesh position={[relX, doorHeight / 2, relZ]}>
            <boxGeometry args={[doorWidth, doorHeight, 5]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

function WallDividerMesh({ element, wallHeight = 240 }) {
    if (!element) return null;
    
    const isDivider = element.type === "divider_line";
    const color = isDivider ? "#6366f1" : "#475569";
    const thickness = element.thickness || 4;
    
    // Handle divider lines with x1/y1/x2/y2 endpoints
    if (isDivider && element.x1 != null && element.y1 != null && element.x2 != null && element.y2 != null) {
        const x1 = element.x1 || 0;
        const y1 = element.y1 || 0;
        const x2 = element.x2 || 0;
        const y2 = element.y2 || 0;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        
        return (
            <mesh
                position={[centerX, wallHeight / 2, centerY]}
                rotation={[0, -angle, 0]}
            >
                <boxGeometry args={[length, wallHeight, thickness]} />
                <meshStandardMaterial color={color} transparent opacity={0.7} />
            </mesh>
        );
    }
    
    // Handle walls with x/y/width/height
    const wallWidth = element.width || 5;
    const wallDepth = element.thickness || 4;
    
    return (
        <mesh position={[
            (element.x || 0) + wallWidth / 2,
            wallHeight / 2,
            (element.y || 0) + wallDepth / 2
        ]}>
            <boxGeometry args={[wallWidth, wallHeight, wallDepth]} />
            <meshStandardMaterial color={color} transparent opacity={0.7} />
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

function Scene({ stage, rooms, elements, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed, viewMode, wallHeight, sceneRef, onSceneReady, transformMode, onTransformEnd }) {
    const is3D = stage === "render3d";
    const showOutlines = viewMode === "block";
    const transformControlsRef = useRef();

    // Normalize coordinates: compute center of all rooms and offset to origin
    const { normalizedRooms, normalizedObjects, normalizedElements, center } = useMemo(() => {
        if (!rooms || rooms.length === 0) return { normalizedRooms: [], normalizedObjects: [], center: { x: 0, y: 0 } };
        
        // Find bounding box of all rooms
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        rooms.forEach(room => {
            const rx = room.x || 0;
            const ry = room.y || 0;
            const rw = room.width || 100;
            const rh = room.height || 100;
            minX = Math.min(minX, rx);
            minY = Math.min(minY, ry);
            maxX = Math.max(maxX, rx + rw);
            maxY = Math.max(maxY, ry + rh);
        });
        
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        
        // Normalize rooms
        const normRooms = rooms.map(room => ({
            ...room,
            x: (room.x || 0) - cx,
            y: (room.y || 0) - cy,
        }));
        
        // Normalize objects
        const normObjects = (objectsData || []).map(obj => ({
            ...obj,
            x: (obj.x || 0) - cx,
            y: (obj.y || 0) - cy,
        }));
        
        // Normalize openings
        const normElements = (elements || []).map(el => ({
            ...el,
            x: (el.x || 0) - cx,
            y: (el.y || 0) - cy,
        }));
        
        return { normalizedRooms: normRooms, normalizedObjects: normObjects, normalizedElements: normElements, center: { x: cx, y: cy } };
    }, [rooms, objectsData, elements]);

    const handleCanvasClick = useCallback((e) => {
        if (placementState?.isActive) {
            e.stopPropagation();
            const point = e.point;
            onCanvasClick?.({ x: point.x + center.x, y: point.z + center.y });
        }
    }, [placementState, onCanvasClick, center]);

    return (
        <>
            {is3D ? (
                <PerspectiveCamera
                    makeDefault
                    position={[100, 150, 100]}
                    fov={50}
                    near={1}
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
                maxPolarAngle={is3D ? Math.PI / 2.2 : undefined}
            />

            {is3D && <fog attach="fog" args={["#1a1a2e", 200, 800]} />}

            {is3D && showOutlines && (
                <Grid
                    args={[100, 100]}
                    position={[0, -0.05, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    cellSize={1}
                    cellThickness={0.5}
                    cellColor="#4a4a6a"
                    fadeSize={1}
                    fadeStrength={1}
                />
            )}

            <mesh
                position={[0, -0.1, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={handleCanvasClick}
                visible={false}
            >
                <planeGeometry args={[10000, 10000]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {(normalizedRooms || []).map(room => (
                <RoomWalls key={room.id} room={room} stage={stage} wallHeight={wallHeight} />
            ))}

            {(normalizedElements || []).map(element => {
                if (element.type === "wall" || element.type === "divider_line") {
                    return <WallDividerMesh key={element.id} element={element} wallHeight={wallHeight} />;
                }
                // Find the parent room for openings
                const parentRoom = (normalizedRooms || []).find(r => r.id === element.parent_id);
                return (
                    <DoorWindowMesh key={element.id} element={element} room={parentRoom} wallHeight={wallHeight} />
                );
            })}

            <GhostPreview
                position={placementState?.ghostPosition}
                catalogItem={placementState?.catalogItem}
                visible={placementState?.isActive || false}
            />

            {(normalizedObjects || []).map(obj => (
                <FurnitureObject
                    key={obj.id}
                    object={obj}
                    isSelected={obj.id === selectedObjectId}
                    onClick={onObjectClick}
                    useTransformControls={is3D}
                    transformControlsRef={transformControlsRef}
                />
            ))}

            {is3D && selectedObjectId && transformControlsRef.current && (
                <TransformControls
                    ref={transformControlsRef}
                    object={transformControlsRef.current}
                    mode={transformMode || "translate"}
                    size={0.7}
                    onMouseUp={() => {
                        if (transformControlsRef.current) {
                            const pos = transformControlsRef.current.position;
                            const rot = transformControlsRef.current.rotation;
                            const scale = transformControlsRef.current.scale;
                            onTransformEnd?.({
                                id: selectedObjectId,
                                x: pos.x,
                                y: pos.z,
                                rotation: THREE.MathUtils.radToDeg(rot.y),
                                scaleX: scale.x,
                                scaleY: scale.y,
                                scaleZ: scale.z,
                            });
                        }
                    }}
                />
            )}

            <SceneExporter sceneRef={sceneRef} onSceneReady={onSceneReady} />
        </>
    );
}

export default function ThreeCanvas({ stage, rooms, elements, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed, viewMode = "block", wallHeight, sceneRef, onSceneReady, transformMode, onTransformEnd }) {
    const is3D = stage === "render3d";
    
    const handleAxisClick = useCallback((axis) => {
        // Placeholder for camera alignment
        console.log("Align to axis:", axis);
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
                    sceneRef={sceneRef}
                    onSceneReady={onSceneReady}
                    transformMode={transformMode}
                    onTransformEnd={onTransformEnd}
                />
            </Suspense>
        </Canvas>
        {is3D && <ViewportGizmo onAxisClick={handleAxisClick} />}
        </div>
    );
}
