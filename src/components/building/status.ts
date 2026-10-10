export const statusTone: Record<string, string> = {
  Occupied: "#2563eb",
  Vacant: "#16a34a",
  Reserved: "#7c3aed",
  "Under Maintenance": "#d97706",
  Inactive: "#64748b"
};

export const roomStatusTheme: Record<string, { color: string; emissive: string; label: string }> = {
  Occupied: { color: "#2563eb", emissive: "#1d4ed8", label: "Occupied" },
  Vacant: { color: "#16a34a", emissive: "#15803d", label: "Vacant" },
  Reserved: { color: "#7c3aed", emissive: "#6d28d9", label: "Reserved" },
  "Under Maintenance": { color: "#d97706", emissive: "#b45309", label: "Maintenance" },
  Inactive: { color: "#64748b", emissive: "#475569", label: "Inactive" }
};
