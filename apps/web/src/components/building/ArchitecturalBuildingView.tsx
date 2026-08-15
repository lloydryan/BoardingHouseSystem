import { BuildingFloor, BuildingProperty, BuildingUnit } from "./types";
import { DynamicBuildingFloor } from "./DynamicBuildingFloor";

const templatePalettes: Record<string, { wallA: string; wallB: string; wallC: string; side: string; roof: string; fascia: string; base: string; sign: string }> = {
  "modern-apartment": {
    wallA: "#F5F5F4",
    wallB: "#E7E5E4",
    wallC: "#D6D3D1",
    side: "#C9C4BD",
    roof: "#475569",
    fascia: "#E7E5E4",
    base: "#A8A29E",
    sign: "#334155"
  },
  "contemporary-condo": {
    wallA: "#F8FAFC",
    wallB: "#E2E8F0",
    wallC: "#CBD5E1",
    side: "#94A3B8",
    roof: "#1E293B",
    fascia: "#E0F2FE",
    base: "#64748B",
    sign: "#0F172A"
  },
  "compact-boarding-house": {
    wallA: "#FEF7ED",
    wallB: "#E7E5E4",
    wallC: "#C7BFB8",
    side: "#A8A29E",
    roof: "#3F3F46",
    fascia: "#F5F5F4",
    base: "#78716C",
    sign: "#44403C"
  },
  "minimalist-directory": {
    wallA: "#FFFFFF",
    wallB: "#F1F5F9",
    wallC: "#E2E8F0",
    side: "#CBD5E1",
    roof: "#334155",
    fascia: "#FFFFFF",
    base: "#94A3B8",
    sign: "#2563EB"
  }
};

export function ArchitecturalBuildingView({ property, floors, selectedFloorId, selectedUnitId, onFloorSelect, onUnitSelect, buildingTemplate = "modern-apartment" }: { property: BuildingProperty; floors: BuildingFloor[]; selectedFloorId?: string; selectedUnitId?: string; onFloorSelect: (floorId: string) => void; onUnitSelect: (unit: BuildingUnit) => void; buildingTemplate?: string; landlordTheme?: unknown }) {
  const floorHeight = 118;
  const roofHeight = 58;
  const baseHeight = 42;
  const width = 760;
  const height = roofHeight + floors.length * floorHeight + baseHeight + 36;
  const sortedFloors = floors.slice().sort((a, b) => b.displayOrder - a.displayOrder);
  const palette = templatePalettes[buildingTemplate] ?? templatePalettes["modern-apartment"];

  return (
    <div className={`architectural-canvas template-${buildingTemplate}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${property.name} architectural building elevation`}>
        <defs>
          <symbol id="shell-modern-apartment" viewBox={`0 0 ${width} ${height}`}>
            <rect x="28" y="18" width="704" height={height - 42} rx="10" fill="#F8FAFC" />
            <g filter="url(#softShadow)">
              <rect x="92" y="62" width="548" height={height - 132} fill="url(#wall)" />
              <polygon points={`640,62 676,82 676,${height - 70} 640,${height - 90}`} fill={palette.side} />
              <rect x="70" y="36" width="604" height="30" rx="3" fill={palette.roof} />
              <rect x="92" y="66" width="548" height="34" fill={palette.fascia} />
              <rect x="314" y="72" width="122" height="20" rx="2" fill={palette.sign} opacity=".92" />
              <text x="375" y="87" textAnchor="middle" fontSize="11" fill="#F8FAFC" fontWeight="600">{property.name}</text>
            </g>
          </symbol>
          <linearGradient id="wall" x1="0" x2="1">
            <stop offset="0%" stopColor={palette.wallA} />
            <stop offset="48%" stopColor={palette.wallB} />
            <stop offset="100%" stopColor={palette.wallC} />
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity=".95" />
            <stop offset="48%" stopColor="#BFDBFE" stopOpacity=".72" />
            <stop offset="100%" stopColor="#475569" stopOpacity=".42" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#0F172A" floodOpacity=".16" />
          </filter>
        </defs>
        <use href="#shell-modern-apartment" />
        {sortedFloors.map((floor, floorIndex) => (
          <DynamicBuildingFloor
            key={floor.id}
            floor={floor}
            y={roofHeight + floorIndex * floorHeight + 42}
            floorHeight={floorHeight}
            selected={floor.id === selectedFloorId}
            selectedUnitId={selectedUnitId}
            onFloorSelect={onFloorSelect}
            onUnitSelect={onUnitSelect}
          />
        ))}
        <rect x="78" y={height - 74} width="608" height="26" rx="2" fill={palette.base} />
        <rect x="44" y={height - 48} width="672" height="18" rx="9" fill={palette.wallC} />
      </svg>
    </div>
  );
}
