import { useMemo } from "react";
import * as THREE from "three";

export default function RoomWalls({ room, stage }) {
    const is3D = stage === "render3d";
    const wallHeight = is3D ? 240 : 30;
    const opacity = is3D ? 0.85 : 0.3;

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(room.width || 100, 0);
        shape.lineTo(room.width || 100, room.height || 100);
        shape.lineTo(0, room.height || 100);
        shape.closePath();

        const extrudeSettings = {
            depth: wallHeight,
            bevelEnabled: false,
        };

        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, [room.width, room.height, wallHeight]);

    const wallColor = room.fill || "#6366f1";

    return (
        <group position={[
            (room.x || 0) + (room.width || 100) / 2,
            0,
            (room.y || 0) + (room.height || 100) / 2,
        ]}>
            <mesh geometry={geometry} castShadow={is3D} receiveShadow={is3D}>
                <meshStandardMaterial
                    color={wallColor}
                    transparent={true}
                    opacity={opacity}
                    side={THREE.DoubleSide}
                    roughness={is3D ? 0.7 : 0.5}
                    metalness={is3D ? 0.1 : 0}
                />
            </mesh>
            {is3D && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
                    <planeGeometry args={[room.width || 100, room.height || 100]} />
                    <meshStandardMaterial
                        color={wallColor}
                        transparent={true}
                        opacity={0.4}
                        roughness={0.8}
                    />
                </mesh>
            )}
        </group>
    );
}
