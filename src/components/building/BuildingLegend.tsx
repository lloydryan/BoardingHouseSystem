import { statusTone } from "./status";

export function BuildingLegend() {
  return (
    <div className="building-legend" aria-label="Unit status legend">
      {Object.entries(statusTone).map(([label, color]) => (
        <span key={label}><i style={{ backgroundColor: color }} /> {label}</span>
      ))}
      <span><i className="overdue-dot" /> Overdue balance</span>
    </div>
  );
}
