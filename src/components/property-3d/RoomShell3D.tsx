import { Html } from "@react-three/drei";
import { useState } from "react";
import { BuildingUnit } from "../building/types";
import { Balcony3D } from "./Balcony3D";
import { Door3D } from "./Door3D";
import { ROOM_DEPTH, ROOM_WIDTH, WALL_HEIGHT } from "./layout";
import { RoomStatusIndicator } from "./RoomStatusIndicator";
import { WallSection } from "./WallSection";
import { Window3D } from "./Window3D";

type RoomShell3DProps = {
  unit: BuildingUnit;
  position: [number, number, number];
  selected?: boolean;
  focused?: boolean;
  onSelect: (unit: BuildingUnit) => void;
};

export function RoomShell3D({ unit, position, selected = false, focused = false, onSelect }: RoomShell3DProps) {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;
  const shellColor = selected ? "#dbeafe" : hovered ? "#eceff3" : "#ded8cf";
  const labelVisible = focused || active;

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(unit);
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
      <mesh receiveShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[ROOM_WIDTH - 0.08, 0.08, ROOM_DEPTH - 0.08]} />
        <meshStandardMaterial color="#cfc8bf" roughness={0.86} />
      </mesh>
      <WallSection width={ROOM_WIDTH} height={WALL_HEIGHT} depth={0.09} position={[0, WALL_HEIGHT / 2 + 0.08, -ROOM_DEPTH / 2]} material={{ color: shellColor }} />
      <WallSection width={0.09} height={WALL_HEIGHT} depth={ROOM_DEPTH} position={[-ROOM_WIDTH / 2, WALL_HEIGHT / 2 + 0.08, 0]} material={{ color: shellColor }} />
      <WallSection width={0.09} height={WALL_HEIGHT} depth={ROOM_DEPTH} position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2 + 0.08, 0]} material={{ color: shellColor }} />
      <WallSection width={ROOM_WIDTH * 0.28} height={WALL_HEIGHT} depth={0.09} position={[-ROOM_WIDTH * 0.36, WALL_HEIGHT / 2 + 0.08, ROOM_DEPTH / 2]} material={{ color: shellColor }} />
      <WallSection width={ROOM_WIDTH * 0.28} height={WALL_HEIGHT} depth={0.09} position={[ROOM_WIDTH * 0.36, WALL_HEIGHT / 2 + 0.08, ROOM_DEPTH / 2]} material={{ color: shellColor }} />
      {!focused ? (
        <mesh position={[0, WALL_HEIGHT + 0.13, 0]} receiveShadow>
          <boxGeometry args={[ROOM_WIDTH, 0.06, ROOM_DEPTH]} />
          <meshStandardMaterial color="#eee9e2" roughness={0.86} transparent opacity={0.82} />
        </mesh>
      ) : null}
      <Window3D position={[0, 0.78, -ROOM_DEPTH / 2 - 0.03]} />
      <Door3D position={[0, 0.53, ROOM_DEPTH / 2 + 0.03]} selected={selected} />
      <Balcony3D width={Math.min(1.65, ROOM_WIDTH * 0.68)} position={[0, 0.18, -ROOM_DEPTH / 2 - 0.46]} />
      <RoomStatusIndicator unit={unit} position={[ROOM_WIDTH / 2 - 0.18, 0.82, ROOM_DEPTH / 2 + 0.08]} />
      {selected ? (
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[ROOM_WIDTH + 0.05, 0.04, ROOM_DEPTH + 0.05]} />
          <meshStandardMaterial color="#2563eb" transparent opacity={0.22} />
        </mesh>
      ) : null}
      {labelVisible ? (
        <Html position={[0, 1.55, 0.24]} center distanceFactor={8} className="property-3d-label">
          <span>{unit.unitNumber}</span>
        </Html>
      ) : null}
    </group>
  );
}
