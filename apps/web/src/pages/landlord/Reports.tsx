import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, Toolbar } from "../../components/ui";

export function Reports() {
  const [data, setData] = useState<any>();
  useEffect(() => { api<any>("/api/reports").then(setData); }, []);
  if (!data) return <Page title="Reports">Loading reports...</Page>;
  return (
    <Page title="Reports" eyebrow="Collections, occupancy, ledgers, utilities, and revenue" actions={<><button><Printer size={16} /> Print</button><button className="primary-btn"><Download size={16} /> Export CSV</button></>}>
      <Toolbar><input type="date" defaultValue="2026-07-01" /><input type="date" defaultValue="2026-07-31" /><select>{data.reports.map((r: string) => <option key={r}>{r}</option>)}</select></Toolbar>
      <DataTable columns={["Period", "Tenant", "Property", "Total due", "Paid", "Balance", "Status"]} rows={data.rows.map((b: any) => [b.billingPeriod, b.tenantName, b.propertyName, money(b.totalAmountDue), money(b.amountPaid), money(b.remainingBalance), b.status])} />
    </Page>
  );
}
