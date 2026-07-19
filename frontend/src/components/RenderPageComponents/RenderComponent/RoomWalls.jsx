import { useMemo } from "react";
import * as THREE from "three";

const DEFAULT_WALL_HEIGHT = 2.4;
const DEFAULT_WALL_THICKNESS = 0.16;

function makeShape(points) {
    const shape = new THREE.Shape();
    points.forEach(([x, z], index) => {
        if (index === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
    });
    shape.closePath();
    return shape;
}

function edgeMeshes(points, wallHeight, wallThickness, wallColor, wallOpacity, roomId) {
    return points.map((point, index) => {
        const next = points[(index + 1) % points.length];
        const dx = next[0] - point[0];
        const dz = next[1] - point[1];
        const length = Math.max(Math.sqrt(dx * dx + dz * dz), 0.01);
        const angle = Math.atan2(dz, dx);
        return (
            <mesh
                key={`${roomId}-wall-${index}`}
                position={[(point[0] + next[0]) / 2, wallHeight / 2, (point[1] + next[1]) / 2]}
                rotation={[0, -angle, 0]}
                castShadow
                receiveShadow
                userData={{ appRoomId: roomId, exportKind: "room-wall" }}
            >
                <boxGeometry args={[length, wallHeight, wallThickness]} />
                <meshStandardMaterial
                    color={wallColor}
                    transparent
                    opacity={wallOpacity}
                    roughness={0.72}
                    metalness={0.04}
                />
            </mesh>
        );
    });
}

export default function RoomWalls({ room, stage, wallHeight: wallHeightProp, viewMode = "block", blockSize = 1 }) {
    const is3D = stage === "render3d";
    const wallHeight = wallHeightProp || DEFAULT_WALL_HEIGHT;
    const wallThickness = Math.max(Math.min(blockSize * 0.16, 0.28), DEFAULT_WALL_THICKNESS);
    const floorOpacity = viewMode === "block" ? 0.32 : 0.62;
    const wallOpacity = viewMode === "block" ? 0.78 : 0.92;
    const wallColor = room.fill || "#64748b";

    const points = useMemo(() => {
        if (Array.isArray(room.scenePoints) && room.scenePoints.length >= 3) {
            return room.scenePoints;
        }
        const width = Math.max(room.sceneWidth || 1, 0.1);
        const depth = Math.max(room.sceneDepth || 1, 0.1);
        return [
            [-width / 2, -depth / 2],
            [width / 2, -depth / 2],
            [width / 2, depth / 2],
            [-width / 2, depth / 2],
        ];
    }, [room.sceneDepth, room.scenePoints, room.sceneWidth]);

    const floorGeometry = useMemo(() => {
        const geometry = new THREE.ShapeGeometry(makeShape(points));
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }, [points]);

    const edgeHelper = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            ...points.map(([x, z]) => new THREE.Vector3(x, 0.03, z)),
            new THREE.Vector3(points[0][0], 0.03, points[0][1]),
        ]);
        return geometry;
    }, [points]);

    return (
        <group
            position={[room.sceneX || 0, 0, room.sceneZ || 0]}
            userData={{ appRoomId: room.id, exportKind: "room" }}
        >
            <mesh geometry={floorGeometry} receiveShadow={is3D}>
                <meshStandardMaterial
                    color={wallColor}
                    transparent
                    opacity={floorOpacity}
                    side={THREE.DoubleSide}
                    roughness={0.84}
                    metalness={0.02}
                />
            </mesh>
            {is3D && (
                <>
                    {edgeMeshes(points, wallHeight, wallThickness, wallColor, wallOpacity, room.id)}
                    {viewMode === "block" && (
                        <line geometry={edgeHelper}>
                            <lineBasicMaterial color="#e0f2fe" transparent opacity={0.92} />
                        </line>
                    )}
                </>
            )}
        </group>
    );
}
