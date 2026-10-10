export function Window3D({ width = 0.88, height = 0.54, position }: { width?: number; height?: number; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.016]}>
        <boxGeometry args={[width + 0.14, height + 0.14, 0.045]} />
        <meshStandardMaterial color="#475569" roughness={0.58} />
      </mesh>
      <mesh>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color="#a7d8f0" roughness={0.22} metalness={0.05} transparent opacity={0.72} emissive="#fef3c7" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[-width * 0.18, height * 0.04, 0.03]}>
        <boxGeometry args={[0.035, height * 0.86, 0.035]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[width * 0.92, 0.025, 0.035]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
    </group>
  );
}
