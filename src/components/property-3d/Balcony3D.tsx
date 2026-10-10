export function Balcony3D({ width = 1.55, position }: { width?: number; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, 0.62]} />
        <meshStandardMaterial color="#c8c2b8" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.34, -0.31]}>
        <boxGeometry args={[width, 0.055, 0.04]} />
        <meshStandardMaterial color="#64748b" roughness={0.38} metalness={0.25} />
      </mesh>
      {[-0.43, 0, 0.43].map((x) => (
        <mesh key={x} position={[x * width, 0.18, -0.31]}>
          <boxGeometry args={[0.035, 0.36, 0.035]} />
          <meshStandardMaterial color="#64748b" roughness={0.38} metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.335]}>
        <boxGeometry args={[width * 0.92, 0.28, 0.025]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.18} transparent opacity={0.42} />
      </mesh>
    </group>
  );
}
