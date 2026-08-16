import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api, apiPost, money } from "../../lib/api";
import { DataTable, Page, PageSkeleton, StatusBadge } from "../../components/ui";
import { toast } from "../../lib/toast";

export function Billing() {
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => api<any[]>("/api/billing").then(setRows);
  useEffect(() => { load(); }, []);
  if (!rows) return <PageSkeleton title="Monthly Billing" variant="table" />;

  async function newBill() {
    const units = await api<any[]>("/api/units");
    const unit = units.find((item) => item.status === "Occupied") ?? units[0];
    if (!unit) return toast("No units available.", "error");
    apiPost("/api/billing", { unitId: unit.id, billingPeriod: new Date().toISOString().slice(0, 7), monthlyRent: unit.monthlyRent, dueDate: new Date().toISOString().slice(0, 10) })
      .then(() => {
        toast("Bill created.", "success");
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  function generateBatch() {
    apiPost("/api/billing/generate-batch", { billingPeriod: new Date().toISOString().slice(0, 7), dueDate: new Date().toISOString().slice(0, 10) })
      .then((created: any) => {
        toast(`Generated ${created.length} bill(s).`, "success");
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Monthly Billing" eyebrow="Rent, utilities, penalties, discounts, and balances" actions={<><button onClick={generateBatch}><FileText size={16} /> Generate batch</button><button className="primary-btn" onClick={newBill}><Plus size={16} /> New bill</button></>}>
      <DataTable columns={["Period", "Tenant", "Property", "Unit", "Rent", "Electricity", "Water", "Total", "Paid", "Balance", "Status"]} rows={rows.map((b) => [b.billingPeriod, b.tenantName, b.propertyName, b.unitNumber, money(b.monthlyRent), money(b.electricityCharge), money(b.waterCharge), money(b.totalAmountDue), money(b.amountPaid), money(b.remainingBalance), <StatusBadge value={b.status} />])} />
    </Page>
  );
}
