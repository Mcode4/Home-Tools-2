import { Suspense, forwardRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function GLBModel({ url, width, height, depth }) {
    const { scene } = useGLTF(url);
    const { clone, scale, offset } = useMemo(() => {
        const next = scene.clone(true);
        const box = new THREE.Box3().setFromObject(next);
        const size = new THREE.Vector3();
        box.getSize(size);
        const safeSize = {
            x: size.x || 1,
            y: size.y || 1,
            z: size.z || 1,
        };
        const fitScale = Math.min(width / safeSize.x, height / safeSize.y, depth / safeSize.z);
        const center = new THREE.Vector3();
        box.getCenter(center);
        return {
            clone: next,
            scale: fitScale,
            offset: [
                -center.x * fitScale,
                -height / 2 - box.min.y * fitScale,
                -center.z * fitScale,
            ],
        };
    }, [depth, height, scene, width]);

    useEffect(() => {
        clone.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [clone]);

    return <primitive object={clone} scale={[scale, scale, scale]} position={offset} />;
}

function BoxFurniture({ object }) {
    const w = object.sceneWidth || object.widthMeters || 1;
    const h = object.sceneHeight || object.heightMeters3d || 0.6;
    const d = object.sceneDepth || object.heightMeters || 1;

    return (
        <mesh castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={object.fill || "#8b5cf6"} roughness={0.68} metalness={0.06} />
        </mesh>
    );
}

const FurnitureObject = forwardRef(function FurnitureObject({ object, isSelected, onClick }, ref) {
    if (!object) return null;

    const rotation = (object.rotation || 0) * (Math.PI / 180);
    const w = object.sceneWidth || object.widthMeters || 1;
    const h = object.sceneHeight || object.heightMeters3d || 0.6;
    const d = object.sceneDepth || object.heightMeters || 1;
    const elevation = object.sceneElevation || object.elevation || 0;

    return (
        <group
            ref={ref}
            name={`object-${object.id}`}
            userData={{ appObjectId: object.id, exportKind: "furniture" }}
            position={[object.sceneX || 0, elevation + h / 2, object.sceneZ || 0]}
            rotation={[0, rotation, 0]}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(object.id);
            }}
        >
            {object.modelUrl ? (
                <Suspense fallback={null}>
                    <GLBModel url={object.modelUrl} width={w} height={h} depth={d} />
                </Suspense>
            ) : (
                <BoxFurniture object={object} />
            )}
            {isSelected && (
                <mesh>
                    <boxGeometry args={[w + 0.08, h + 0.08, d + 0.08]} />
                    <meshBasicMaterial color="#22c55e" wireframe={true} />
                </mesh>
            )}
            {isSelected && (
                <mesh position={[0, h / 2 + 0.18, 0]}>
                    <sphereGeometry args={[0.08, 12, 12]} />
                    <meshBasicMaterial color="#22c55e" />
                </mesh>
            )}
        </group>
    );
});

export default FurnitureObject;
