import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, StatusBadge } from "../../components/ui";

export function Leases() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/leases").then(setRows); }, []);
  return (
    <Page title="Leases" eyebrow="Active assignments and contract dates">
      <DataTable columns={["Tenant", "Property", "Unit", "Rent", "Deposit", "Start", "End", "Status"]} rows={rows.map((l) => [l.tenantName, l.propertyName, l.unitNumber, money(l.monthlyRent), money(l.securityDeposit), l.startsAt, l.endsAt, <StatusBadge value={l.status} />])} />
    </Page>
  );
}
