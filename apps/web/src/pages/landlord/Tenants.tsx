import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, StatusBadge } from "../../components/ui";

export function Tenants() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/tenants").then(setRows); }, []);
  return (
    <Page title="Tenants" eyebrow="Tenant monitoring and rental history" actions={<button className="primary-btn"><Plus size={16} /> Add tenant</button>}>
      <DataTable columns={["Name", "Email", "Contact", "Monthly rent", "Move-in", "Contract end", "Due day", "Status"]} rows={rows.map((t) => [t.fullName, t.email, t.contactNumber, money(t.monthlyRent), t.moveInDate, t.contractEndDate, t.billingDueDay, <StatusBadge value={t.status} />])} />
    </Page>
  );
}
