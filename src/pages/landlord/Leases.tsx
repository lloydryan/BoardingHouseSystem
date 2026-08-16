import { useEffect, useState } from "react";
import { api, money } from "../../services/apiService";
import { DataTable, Page, PageSkeleton, StatusBadge } from "../../components/ui";

export function Leases() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>("/api/leases").then(setRows); }, []);
  if (!rows) return <PageSkeleton title="Leases" variant="table" />;
  return (
    <Page title="Leases" eyebrow="Active assignments and contract dates">
      <DataTable columns={["Tenant", "Property", "Unit", "Rent", "Deposit", "Start", "End", "Status"]} rows={rows.map((l) => [l.tenantName, l.propertyName, l.unitNumber, money(l.monthlyRent), money(l.securityDeposit), l.startsAt, l.endsAt, <StatusBadge value={l.status} />])} />
    </Page>
  );
}

