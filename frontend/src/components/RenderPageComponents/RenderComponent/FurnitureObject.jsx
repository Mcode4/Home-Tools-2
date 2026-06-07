import { Suspense, useRef, useEffect } from "react";
import { useGLTF, TransformControls } from "@react-three/drei";
import * as THREE from "three";

function GLBModel({ url, scale = 1 }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene.clone()} scale={[scale, scale, scale]} />;
}

function BoxFurniture({ object }) {
    const w = object.width || 40;
    const h = object.height3d || 20;
    const d = object.height || 40;

    return (
        <mesh castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={object.fill || "#888"} />
        </mesh>
    );
}

export default function FurnitureObject({ object, isSelected, onClick, useTransformControls = false }) {
    if (!object) return null;

    const rotation = (object.rotation || 0) * (Math.PI / 180);
    const h = object.height3d || 20;

    const content = (
        <group
            position={[object.x, h / 2, object.y]}
            rotation={[0, rotation, 0]}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(object.id);
            }}
        >
            {object.modelUrl && object.modelUrl.startsWith("data:") ? (
                <Suspense fallback={null}>
                    <GLBModel url={object.modelUrl} />
                </Suspense>
            ) : (
                <BoxFurniture object={object} />
            )}
            {isSelected && (
                <mesh>
                    <boxGeometry args={[(object.width || 40) + 2, h + 2, (object.height || 40) + 2]} />
                    <meshBasicMaterial color="#22c55e" wireframe={true} />
                </mesh>
            )}
            {isSelected && (
                <mesh position={[0, h / 2 + 5, 0]}>
                    <sphereGeometry args={[3, 8, 8]} />
                    <meshBasicMaterial color="#22c55e" />
                </mesh>
            )}
            {isSelected && (
                <group position={[0, h / 2, 0]}>
                    {/* X axis arrow (red) */}
                    <mesh position={[15, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                        <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
                        <meshBasicMaterial color="#ff4444" />
                    </mesh>
                    <mesh position={[26, 0, 0]}>
                        <coneGeometry args={[2, 4, 8]} />
                        <meshBasicMaterial color="#ff4444" />
                    </mesh>
                    {/* Y axis arrow (green) */}
                    <mesh position={[0, 15, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
                        <meshBasicMaterial color="#44ff44" />
                    </mesh>
                    <mesh position={[0, 26, 0]}>
                        <coneGeometry args={[2, 4, 8]} />
                        <meshBasicMaterial color="#44ff44" />
                    </mesh>
                    {/* Z axis arrow (blue) */}
                    <mesh position={[0, 0, 15]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 20, 8]} />
                        <meshBasicMaterial color="#4444ff" />
                    </mesh>
                    <mesh position={[0, 0, 26]} rotation={[Math.PI / 2, 0, 0]}>
                        <coneGeometry args={[2, 4, 8]} />
                        <meshBasicMaterial color="#4444ff" />
                    </mesh>
                </group>
            )}
        </group>
    );

    return content;
}
