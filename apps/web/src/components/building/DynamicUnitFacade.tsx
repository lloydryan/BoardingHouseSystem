import { KeyboardEvent } from "react";
import { money } from "../../lib/api";
import { statusTone } from "./status";
import { BuildingUnit } from "./types";

export function DynamicUnitFacade({ unit, x, y, width, selected, onSelect }: { unit: BuildingUnit; x: number; y: number; width: number; selected?: boolean; onSelect: () => void }) {
  const tone = statusTone[unit.status] ?? "#64748b";
  const windowWidth = Math.max(28, width * 0.46);
  const doorWidth = Math.max(18, width * 0.24);
  const doorX = x + width - doorWidth - 8;
  const windowX = x + 8;

  return (
    <g
      className={`svg-unit ${selected ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Open Unit ${unit.unitNumber}, ${unit.status}, tenant ${unit.primaryTenant || "vacant"}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onKeyDown={(event) => activateWithKeyboard(event, onSelect)}
    >
      <title>{`Unit ${unit.unitNumber} / ${unit.status} / Rent ${money(unit.monthlyRent)} / Tenant ${unit.primaryTenant || "Vacant"} / Balance ${money(unit.outstandingBalance)}`}</title>
      <rect x={x} y={y} width={width} height="78" rx="2" fill="#DDD6CE" opacity=".74" />
      <rect x={windowX} y={y + 10} width={windowWidth} height="42" rx="2" fill="#334155" />
      <rect x={windowX + 4} y={y + 14} width={windowWidth - 8} height="34" rx="1" fill="url(#glass)" />
      <path d={`M${windowX + 8} ${y + 15} L${windowX + 24} ${y + 15} L${windowX + 8} ${y + 31} Z`} fill="#fff" opacity=".36" />
      <rect x={doorX} y={y + 14} width={doorWidth} height="50" rx="1" fill="#44403C" />
      <circle cx={doorX + doorWidth - 6} cy={y + 39} r="1.8" fill="#D6D3D1" />
      <line x1={x + 3} y1={y + 66} x2={x + width - 3} y2={y + 66} stroke="#64748B" strokeWidth="2.4" />
      <line x1={x + width * 0.22} y1={y + 54} x2={x + width * 0.22} y2={y + 66} stroke="#64748B" strokeWidth="1.6" />
      <line x1={x + width * 0.5} y1={y + 54} x2={x + width * 0.5} y2={y + 66} stroke="#64748B" strokeWidth="1.6" />
      <line x1={x + width * 0.78} y1={y + 54} x2={x + width * 0.78} y2={y + 66} stroke="#64748B" strokeWidth="1.6" />
      <circle cx={x + width - 2} cy={y + 2} r="4.8" fill={tone} />
      {unit.outstandingBalance > 0 ? <path d={`M${x + width - 16} ${y + 8} l5 9 h-10 z`} fill="#DC2626" /> : null}
      <text x={x + width / 2} y={y + 94} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600">{unit.unitNumber}</text>
    </g>
  );
}

function activateWithKeyboard(event: KeyboardEvent<SVGGElement>, callback: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
}
