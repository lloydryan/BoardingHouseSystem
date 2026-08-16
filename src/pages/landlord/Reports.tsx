import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../services/apiService";
import { DataTable, Page, PageSkeleton, Toolbar } from "../../components/ui";

export function Reports() {
  const [data, setData] = useState<any>();
  useEffect(() => { api<any>("/api/reports").then(setData); }, []);
  if (!data) return <PageSkeleton title="Reports" variant="table" />;

  function exportCsv() {
    const rows = [["Period", "Tenant", "Property", "Total due", "Paid", "Balance", "Status"], ...data.rows.map((b: any) => [b.billingPeriod, b.tenantName, b.propertyName, b.totalAmountDue, b.amountPaid, b.remainingBalance, b.status])];
    const csv = rows.map((row) => row.map((cell: string | number) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "boarding-house-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page title="Reports" eyebrow="Collections, occupancy, ledgers, utilities, and revenue" actions={<><button onClick={() => window.print()}><Printer size={16} /> Print</button><button className="primary-btn" onClick={exportCsv}><Download size={16} /> Export CSV</button></>}>
      <Toolbar><input type="date" defaultValue="2026-07-01" /><input type="date" defaultValue="2026-07-31" /><select>{data.reports.map((r: string) => <option key={r}>{r}</option>)}</select></Toolbar>
      <DataTable columns={["Period", "Tenant", "Property", "Total due", "Paid", "Balance", "Status"]} rows={data.rows.map((b: any) => [b.billingPeriod, b.tenantName, b.propertyName, money(b.totalAmountDue), money(b.amountPaid), money(b.remainingBalance), b.status])} />
    </Page>
  );
}

