import { KeyboardEvent } from "react";
import { BuildingFloor, BuildingUnit } from "./types";
import { DynamicUnitFacade } from "./DynamicUnitFacade";

export function DynamicBuildingFloor({ floor, y, floorHeight, selected, selectedUnitId, onFloorSelect, onUnitSelect }: { floor: BuildingFloor; y: number; floorHeight: number; selected?: boolean; selectedUnitId?: string; onFloorSelect: (floorId: string) => void; onUnitSelect: (unit: BuildingUnit) => void }) {
  const buildingX = 92;
  const buildingWidth = 548;
  const labelArea = 44;
  const horizontalPadding = 36;
  const gap = 14;
  const availableWidth = buildingWidth - labelArea - horizontalPadding * 2;
  const unitCount = Math.max(1, floor.units.length);
  const unitWidth = Math.max(58, (availableWidth - gap * (unitCount - 1)) / unitCount);
  const startX = buildingX + labelArea + horizontalPadding;

  return (
    <g
      className={`svg-floor ${selected ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Open ${floor.name}`}
      onClick={() => onFloorSelect(floor.id)}
      onKeyDown={(event) => activateWithKeyboard(event, () => onFloorSelect(floor.id))}
    >
      <title>{`${floor.name}: ${floor.units.length} units, ${floor.summary?.occupiedUnits ?? 0} occupied, ${floor.summary?.vacantUnits ?? 0} vacant`}</title>
      <rect x={buildingX} y={y} width={buildingWidth} height={floorHeight - 10} fill="transparent" />
      <rect x={buildingX} y={y + floorHeight - 14} width={buildingWidth} height="10" fill="#C7C2BB" opacity=".92" />
      <rect x="100" y={y + 4} width="12" height={floorHeight - 22} fill="#D6D3D1" opacity=".88" />
      <rect x="620" y={y + 4} width="12" height={floorHeight - 22} fill="#C7C2BB" opacity=".88" />
      {selected ? (
        <>
          <rect x="88" y={y - 2} width="558" height={floorHeight - 2} rx="4" fill="var(--theme-primary, #2563eb)" opacity=".06" />
          <rect x="88" y={y - 2} width="558" height={floorHeight - 2} rx="4" fill="none" stroke="var(--theme-primary, #2563eb)" strokeWidth="2.5" />
          <rect x="112" y={y + 8} width="56" height="20" rx="10" fill="var(--theme-primary, #2563eb)" />
          <text x="140" y={y + 22} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">Selected</text>
        </>
      ) : null}
      <text x="54" y={y + 62} textAnchor="middle" fontSize="12" fill="#475569" fontWeight="700">{floor.name}</text>
      {floor.units.map((unit, index) => (
        <DynamicUnitFacade
          key={unit.id}
          unit={unit}
          selected={unit.id === selectedUnitId}
          x={startX + index * (unitWidth + gap)}
          y={y + 22}
          width={unitWidth}
          onSelect={() => onUnitSelect(unit)}
        />
      ))}
    </g>
  );
}

function activateWithKeyboard(event: KeyboardEvent<SVGGElement>, callback: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
}
