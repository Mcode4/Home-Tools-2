import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function PreviewScene({ rooms, elements }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[50, 100, 50]} intensity={0.8} />
            
            {(rooms || []).map(room => (
                <mesh
                    key={room.id}
                    position={[
                        (room.x || 0) + (room.width || 100) / 2,
                        0,
                        (room.y || 0) + (room.height || 100) / 2,
                    ]}
                >
                    <boxGeometry args={[room.width || 100, 240, room.height || 100]} />
                    <meshStandardMaterial
                        color={room.fill || "#6366f1"}
                        transparent={true}
                        opacity={0.85}
                    />
                </mesh>
            ))}

            {(elements || []).map(element => {
                const isWindow = element.openingType === "window";
                const doorWidth = isWindow ? (element.width || 120) : (element.width || 90);
                const doorHeight = isWindow ? (element.height || 80) : (element.height || 210);
                const color = isWindow ? "#38bdf8" : "#f8fafc";
                
                return (
                    <mesh
                        key={element.id}
                        position={[element.x, doorHeight / 2, element.y]}
                    >
                        <boxGeometry args={[doorWidth, doorHeight, 5]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                );
            })}
        </>
    );
}

export default function RenderPreview({ renderData, onClick }) {
    if (!renderData) return null;

    const rooms = renderData.rooms || [];
    const elements = renderData.elements || [];

    return (
        <div
            onClick={onClick}
            style={{
                width: "120px",
                height: "80px",
                cursor: "pointer",
                borderRadius: "4px",
                overflow: "hidden",
                border: "2px solid #6366f1",
                background: "#1a1a2e",
            }}
        >
            <Canvas
                gl={{ alpha: true, antialias: true }}
                style={{ background: "transparent" }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera
                        makeDefault
                        position={[100, 150, 100]}
                        fov={50}
                    />
                    <PreviewScene rooms={rooms} elements={elements} />
                </Suspense>
            </Canvas>
        </div>
    );
}
