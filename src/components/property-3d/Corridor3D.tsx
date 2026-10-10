import { SLAB_DEPTH } from "./layout";

export function Corridor3D({ width }: { width: number }) {
  return (
    <group>
      <mesh position={[0, 0.055, SLAB_DEPTH / 2 - 0.7]} receiveShadow>
        <boxGeometry args={[width - 0.5, 0.045, 0.72]} />
        <meshStandardMaterial color="#bfc6ce" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.43, SLAB_DEPTH / 2 - 1.08]}>
        <boxGeometry args={[width - 0.7, 0.045, 0.04]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.22} />
      </mesh>
      {Array.from({ length: Math.max(2, Math.floor(width / 1.4)) }).map((_, index, items) => {
        const x = -width / 2 + 0.48 + (index * (width - 0.96)) / Math.max(1, items.length - 1);
        return (
          <mesh key={index} position={[x, 0.24, SLAB_DEPTH / 2 - 1.08]}>
            <boxGeometry args={[0.035, 0.36, 0.035]} />
            <meshStandardMaterial color="#64748b" roughness={0.42} metalness={0.18} />
          </mesh>
        );
      })}
    </group>
  );
}
