import { SLAB_DEPTH } from "./layout";

export function Roof3D({ width, y }: { width: number; y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width + 0.76, 0.2, SLAB_DEPTH + 0.52]} />
        <meshStandardMaterial color="#465568" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.18, -SLAB_DEPTH / 2 - 0.12]}>
        <boxGeometry args={[width + 0.42, 0.28, 0.14]} />
        <meshStandardMaterial color="#334155" roughness={0.74} />
      </mesh>
      <mesh position={[width * 0.28, 0.3, 0.55]}>
        <boxGeometry args={[0.48, 0.22, 0.32]} />
        <meshStandardMaterial color="#64748b" roughness={0.66} />
      </mesh>
    </group>
  );
}
