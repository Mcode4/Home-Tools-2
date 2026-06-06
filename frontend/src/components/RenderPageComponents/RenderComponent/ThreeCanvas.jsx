import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera, OrbitControls } from "@react-three/drei";
import RoomWalls from "./RoomWalls";
import GhostPreview from "./GhostPreview";
import FurnitureObject from "./FurnitureObject";

function Scene({ stage, rooms, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed }) {
    const is3D = stage === "render3d";

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
        </>
    );
}

export default function ThreeCanvas({ stage, rooms, objectsData, placementState, selectedObjectId, onObjectClick, onCanvasClick, onPointerMissed }) {
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
                />
            </Suspense>
        </Canvas>
    );
}
