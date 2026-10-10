import { roomStatusTheme } from "../building/status";
import { BuildingUnit } from "../building/types";

export function RoomStatusIndicator({ unit, position }: { unit: BuildingUnit; position: [number, number, number] }) {
  const theme = roomStatusTheme[unit.status] ?? roomStatusTheme.Inactive;
  const due = unit.outstandingBalance > 0;
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.075, 14, 14]} />
        <meshStandardMaterial color={due ? "#dc2626" : theme.color} emissive={due ? "#991b1b" : theme.emissive} emissiveIntensity={0.45} roughness={0.35} />
      </mesh>
    </group>
  );
}
