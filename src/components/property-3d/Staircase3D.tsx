import { FLOOR_HEIGHT, SLAB_DEPTH } from "./layout";

export function Staircase3D({ floors, width }: { floors: number; width: number }) {
  return (
    <group position={[width / 2 + 0.55, 0.1, SLAB_DEPTH / 2 - 0.85]}>
      {Array.from({ length: Math.max(1, floors * 4) }).map((_, index) => (
        <mesh key={index} position={[0, index * (FLOOR_HEIGHT / 4), -index * 0.075]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.055, 0.18]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.82} />
        </mesh>
      ))}
      <mesh position={[0.46, (floors * FLOOR_HEIGHT) / 2, -0.42]}>
        <boxGeometry args={[0.045, floors * FLOOR_HEIGHT, 0.045]} />
        <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.42} />
      </mesh>
    </group>
  );
}
