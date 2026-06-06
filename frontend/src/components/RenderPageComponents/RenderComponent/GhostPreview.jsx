import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function GhostPreview({ position, catalogItem, visible }) {
    const meshRef = useRef();

    useFrame((_, delta) => {
        if (meshRef.current && visible) {
            meshRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.02;
        }
    });

    if (!visible || !position || !catalogItem) return null;

    const w = catalogItem.width || 40;
    const h = catalogItem.height3d || 20;
    const d = catalogItem.height || 40;

    return (
        <mesh
            ref={meshRef}
            position={[position.x, h / 2, position.y]}
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
