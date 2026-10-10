import { useMemo } from "react";
import { BuildingFloor, BuildingUnit } from "../building/types";
import { Floor3D } from "./Floor3D";
import { createFloorLayouts, calculateBuildingWidth, FLOOR_HEIGHT, sortFloorsAscending } from "./layout";
import { GroundFloor3D } from "./GroundFloor3D";
import { Roof3D } from "./Roof3D";
import { Staircase3D } from "./Staircase3D";

type Building3DProps = {
  floors: BuildingFloor[];
  selectedFloorId?: string;
  selectedUnitId?: string;
  focusMode: boolean;
  onFloorSelect: (floorId: string) => void;
  onUnitSelect: (unit: BuildingUnit) => void;
};

export function Building3D({ floors, selectedFloorId, selectedUnitId, focusMode, onFloorSelect, onUnitSelect }: Building3DProps) {
  const sortedFloors = useMemo(() => sortFloorsAscending(floors), [floors]);
  const layouts = useMemo(() => createFloorLayouts(floors), [floors]);
  const buildingWidth = useMemo(() => calculateBuildingWidth(floors), [floors]);
  const selectedFloorIndex = sortedFloors.findIndex((floor) => floor.id === selectedFloorId);

  return (
    <group position={[0, 0, 0]}>
      <GroundFloor3D width={buildingWidth} />
      {sortedFloors.map((floor, index) => {
        const layout = layouts.find((item) => item.floorId === floor.id);
        if (!layout) return null;
        const selected = floor.id === selectedFloorId;
        return (
          <Floor3D
            key={floor.id}
            floor={floor}
            layout={layout}
            selected={selected}
            faded={focusMode && !selected}
            selectedUnitId={selectedUnitId}
            onFloorSelect={onFloorSelect}
            onUnitSelect={onUnitSelect}
          />
        );
      })}
      <Staircase3D floors={sortedFloors.length} width={buildingWidth} />
      <Roof3D width={buildingWidth} y={Math.max(0, sortedFloors.length) * FLOOR_HEIGHT + 0.22 + (focusMode && selectedFloorIndex >= 0 ? 0.2 : 0)} />
    </group>
  );
}
