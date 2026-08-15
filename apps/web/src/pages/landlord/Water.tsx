import { Droplets } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page } from "../../components/ui";

export function Water() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/water/readings").then(setRows); }, []);
  return (
    <Page title="Water Readings" eyebrow="Metered, fixed, shared, included, and manual water billing" actions={<button className="primary-btn"><Droplets size={16} /> Add reading</button>}>
      <DataTable columns={["Month", "Tenant", "Previous", "Current", "Consumption", "Total bill", "Occupied units", "Amount", "Calculation"]} rows={rows.map((r) => [r.billingMonth, r.tenantName, r.previousReading, r.currentReading, r.consumption, money(r.totalPropertyBill), r.occupiedUnitCount ?? "-", money(r.amount), r.calculationNote])} />
    </Page>
  );
}
