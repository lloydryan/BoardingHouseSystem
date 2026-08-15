import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, StatusBadge, Toolbar } from "../../components/ui";

export function Units() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/units").then(setRows); }, []);
  return (
    <Page title="Units" eyebrow="Room inventory and occupancy">
      <Toolbar><Search size={18} /><input placeholder="Search unit" /><select><option>All statuses</option><option>Vacant</option><option>Occupied</option></select><select><option>All floors</option><option>1</option><option>2</option></select></Toolbar>
      <DataTable columns={["Unit", "Floor", "Type", "Rent", "Deposit", "Occupancy", "Utilities", "Tenant", "Status"]} rows={rows.map((u) => [u.unitNumber, u.floor, u.unitType, money(u.monthlyRent), money(u.securityDeposit), `${u.currentOccupantCount}/${u.maxOccupants}`, `${u.electricityBillingMethod} / ${u.waterBillingMethod}`, u.tenantName || "None", <StatusBadge value={u.status} />])} />
    </Page>
  );
}
