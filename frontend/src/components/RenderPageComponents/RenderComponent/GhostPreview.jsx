import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const LEGACY_OBJECT_PX_TO_METERS = 0.01;

export default function GhostPreview({ position, catalogItem, visible }) {
    const meshRef = useRef();

    useFrame((_, delta) => {
        if (meshRef.current && visible) {
            meshRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.02;
        }
    });

    if (!visible || !position || !catalogItem) return null;

    const w = catalogItem.widthMeters || (catalogItem.width || 100) * LEGACY_OBJECT_PX_TO_METERS;
    const h = catalogItem.heightMeters3d || (catalogItem.height3d || 80) * LEGACY_OBJECT_PX_TO_METERS;
    const d = catalogItem.heightMeters || (catalogItem.height || 100) * LEGACY_OBJECT_PX_TO_METERS;

    return (
        <mesh
            ref={meshRef}
            position={[position.x, h / 2, position.z ?? position.y ?? 0]}
        >
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
                color={catalogItem.fill || "#888"}
                transparent={true}
                opacity={0.5}
            />
        </mesh>
    );
}
