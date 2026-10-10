import { Html } from "@react-three/drei";
import { useMemo, useState } from "react";
import { BuildingFloor, BuildingUnit } from "../building/types";
import { Corridor3D } from "./Corridor3D";
import { FloorLayout, SLAB_DEPTH } from "./layout";
import { RoomShell3D } from "./RoomShell3D";

type Floor3DProps = {
  floor: BuildingFloor;
  layout: FloorLayout;
  selected?: boolean;
  faded?: boolean;
  selectedUnitId?: string;
  onFloorSelect: (floorId: string) => void;
  onUnitSelect: (unit: BuildingUnit) => void;
};

export function Floor3D({ floor, layout, selected = false, faded = false, selectedUnitId, onFloorSelect, onUnitSelect }: Floor3DProps) {
  const [hovered, setHovered] = useState(false);
  const occupied = floor.summary?.occupiedUnits ?? floor.units.filter((unit) => unit.status === "Occupied").length;
  const vacant = floor.summary?.vacantUnits ?? floor.units.filter((unit) => unit.status === "Vacant").length;
  const opacity = faded ? 0.28 : 1;
  const zOffset = selected ? 0.44 : hovered ? 0.12 : 0;
  const slabColor = selected ? "#d9e7f8" : hovered ? "#e6e9ed" : "#d4cec5";
  const roomByIndex = useMemo(() => floor.units, [floor.units]);

  return (
    <group
      position={[0, layout.y, zOffset]}
      onClick={(event) => {
        event.stopPropagation();
        onFloorSelect(floor.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[layout.width + 0.38, 0.16, SLAB_DEPTH]} />
        <meshStandardMaterial color={slabColor} roughness={0.84} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.08, -SLAB_DEPTH / 2 - 0.04]}>
        <boxGeometry args={[layout.width + 0.48, 0.26, 0.12]} />
        <meshStandardMaterial color="#f2f0eb" roughness={0.82} transparent opacity={opacity} />
      </mesh>
      <Corridor3D width={layout.width} />
      {layout.roomLayouts.map((roomLayout, index) => {
        const unit = roomByIndex[index];
        if (!unit) return null;
        return (
          <RoomShell3D
            key={unit.id}
            unit={unit}
            position={[roomLayout.x, 0.1, roomLayout.z]}
            selected={selectedUnitId === unit.id}
            focused={selected}
            onSelect={onUnitSelect}
          />
        );
      })}
      {(hovered || selected) ? (
        <Html position={[-layout.width / 2 - 0.55, 1.35, 0.2]} center distanceFactor={9} className="property-3d-floor-label">
          <strong>{floor.name}</strong>
          <span>{floor.units.length} Units</span>
          <span>{occupied} Occupied / {vacant} Vacant</span>
        </Html>
      ) : null}
    </group>
  );
}
