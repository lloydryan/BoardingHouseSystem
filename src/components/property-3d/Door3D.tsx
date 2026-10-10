export function Door3D({ position, selected = false }: { position: [number, number, number]; selected?: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.44, 0.88, 0.055]} />
        <meshStandardMaterial color={selected ? "#1d4ed8" : "#4b372b"} roughness={0.78} />
      </mesh>
      <mesh position={[0.15, 0.02, 0.038]}>
        <sphereGeometry args={[0.026, 10, 10]} />
        <meshStandardMaterial color="#d6b56d" metalness={0.4} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.47, 0.025]}>
        <boxGeometry args={[0.54, 0.08, 0.07]} />
        <meshStandardMaterial color="#2f2a25" roughness={0.65} />
      </mesh>
    </group>
  );
}
