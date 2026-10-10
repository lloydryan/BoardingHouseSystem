export function GroundFloor3D({ width }: { width: number }) {
  return (
    <group position={[0, -0.16, 0.18]}>
      <mesh receiveShadow>
        <boxGeometry args={[width + 1.25, 0.16, 4.55]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.04, 2.95]} receiveShadow>
        <boxGeometry args={[1.5, 0.035, 2.05]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.78} />
      </mesh>
      <mesh position={[-width / 2 - 0.9, 0.02, 0.8]} receiveShadow>
        <boxGeometry args={[1.4, 0.045, 1.1]} />
        <meshStandardMaterial color="#86a778" roughness={0.95} />
      </mesh>
      <mesh position={[width / 2 + 0.9, 0.02, 0.55]} receiveShadow>
        <boxGeometry args={[1.2, 0.045, 1]} />
        <meshStandardMaterial color="#7fa06f" roughness={0.95} />
      </mesh>
    </group>
  );
}
