import { MeshStandardMaterialParameters } from "three";

type WallSectionProps = {
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  material?: MeshStandardMaterialParameters;
};

export function WallSection({ width, height, depth, position, rotation, material }: WallSectionProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="#d8d2ca" roughness={0.82} metalness={0.02} {...material} />
    </mesh>
  );
}
