import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, StatusBadge } from "../../components/ui";

export function Billing() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/billing").then(setRows); }, []);
  return (
    <Page title="Monthly Billing" eyebrow="Rent, utilities, penalties, discounts, and balances" actions={<><button><FileText size={16} /> Generate batch</button><button className="primary-btn"><Plus size={16} /> New bill</button></>}>
      <DataTable columns={["Period", "Tenant", "Property", "Unit", "Rent", "Electricity", "Water", "Total", "Paid", "Balance", "Status"]} rows={rows.map((b) => [b.billingPeriod, b.tenantName, b.propertyName, b.unitNumber, money(b.monthlyRent), money(b.electricityCharge), money(b.waterCharge), money(b.totalAmountDue), money(b.amountPaid), money(b.remainingBalance), <StatusBadge value={b.status} />])} />
    </Page>
  );
}
