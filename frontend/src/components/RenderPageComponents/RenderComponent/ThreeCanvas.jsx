import { Suspense, useCallback, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera, OrbitControls, Grid, TransformControls } from "@react-three/drei";
import RoomWalls from "./RoomWalls";
import GhostPreview from "./GhostPreview";
import FurnitureObject from "./FurnitureObject";

function Scene({ stage, rooms, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed, viewMode }) {
    const is3D = stage === "render3d";
    const showOutlines = viewMode === "block";

    const handleCanvasClick = useCallback((e) => {
        if (placementState?.isActive) {
            e.stopPropagation();
            const point = e.point;
            onCanvasClick?.({ x: point.x, y: point.z });
        }
    }, [placementState, onCanvasClick]);

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
                    args={[200, 200]}
                    position={[0, -0.05, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    cellSize={10}
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

            {(rooms || []).map(room => (
                <RoomWalls key={room.id} room={room} stage={stage} />
            ))}

            <GhostPreview
                position={placementState?.ghostPosition}
                catalogItem={placementState?.catalogItem}
                visible={placementState?.isActive || false}
            />

            {(objectsData || []).map(obj => (
                <FurnitureObject
                    key={obj.id}
                    object={obj}
                    isSelected={obj.id === selectedObjectId}
                    onClick={onObjectClick}
                />
            ))}

            {is3D && selectedObjectId && (() => {
                const selectedObj = (objectsData || []).find(o => o.id === selectedObjectId);
                if (!selectedObj) return null;
                const h = selectedObj.height3d || 80;
                return (
                    <TransformControls
                        object={null}
                        mode="translate"
                        size={0.7}
                        onDragEnd={(e) => {
                            if (e?.target?.position) {
                                const pos = e.target.position;
                                onObjectClick?.({ ...selectedObj, x: pos.x, y: pos.z });
                            }
                        }}
                    >
                        <group position={[selectedObj.x, h / 2, selectedObj.y]} />
                    </TransformControls>
                );
            })()}
        </>
    );
}

export default function ThreeCanvas({ stage, rooms, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed, viewMode = "block" }) {
    const is3D = stage === "render3d";

    return (
        <Canvas
            gl={{ alpha: true, antialias: true }}
            shadows={is3D}
            style={{ background: "transparent" }}
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
                    objectsData={objectsData}
                    placementState={placementState}
                    selectedObjectId={selectedObjectId}
                    onObjectClick={onObjectClick}
                    onCanvasClick={onCanvasClick}
                    onPointerMissed={onPointerMissed}
                    viewMode={viewMode}
                />
            </Suspense>
        </Canvas>
    );
}
