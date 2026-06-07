import { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function GizmoScene({ onAxisClick }) {
    const { camera } = useThree();
    
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            
            {/* X axis (red) */}
            <group onClick={(e) => { e.stopPropagation(); onAxisClick?.("x"); }}>
                <mesh position={[1.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                    <meshBasicMaterial color="#ff4444" />
                </mesh>
                <mesh position={[2.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshBasicMaterial color="#ff4444" />
                </mesh>
            </group>
            
            {/* Y axis (green) */}
            <group onClick={(e) => { e.stopPropagation(); onAxisClick?.("y"); }}>
                <mesh position={[0, 1.5, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                    <meshBasicMaterial color="#44ff44" />
                </mesh>
                <mesh position={[0, 2.6, 0]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshBasicMaterial color="#44ff44" />
                </mesh>
            </group>
            
            {/* Z axis (blue) */}
            <group onClick={(e) => { e.stopPropagation(); onAxisClick?.("z"); }}>
                <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                    <meshBasicMaterial color="#4444ff" />
                </mesh>
                <mesh position={[0, 0, 2.6]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshBasicMaterial color="#4444ff" />
                </mesh>
            </group>
            
            {/* Axis labels */}
            <group position={[2.8, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshBasicMaterial color="#ff4444" />
                </mesh>
            </group>
            <group position={[0, 2.8, 0]}>
                <mesh>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshBasicMaterial color="#44ff44" />
                </mesh>
            </group>
            <group position={[0, 0, 2.8]}>
                <mesh>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshBasicMaterial color="#4444ff" />
                </mesh>
            </group>
        </>
    );
}

export default function ViewportGizmo({ onAxisClick }) {
    return (
        <div style={{
            position: "absolute",
            top: 60,
            right: 20,
            width: 100,
            height: 100,
            zIndex: 15,
            pointerEvents: "auto",
        }}>
            <Canvas
                gl={{ alpha: true, antialias: true }}
                style={{ background: "transparent" }}
            >
                <GizmoScene onAxisClick={onAxisClick} />
            </Canvas>
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-around",
                fontSize: 10,
                color: "var(--text-dim)",
            }}>
                <span style={{ color: "#ff4444" }}>X</span>
                <span style={{ color: "#44ff44" }}>Y</span>
                <span style={{ color: "#4444ff" }}>Z</span>
            </div>
        </div>
    );
}
