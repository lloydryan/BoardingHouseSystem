import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page } from "../../components/ui";

export function Electricity() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/electricity/readings").then(setRows); }, []);
  return (
    <Page title="Electricity Readings" eyebrow="Metered, fixed, included, and manual utility billing" actions={<button className="primary-btn"><Zap size={16} /> Add reading</button>}>
      <DataTable columns={["Month", "Tenant", "Previous", "Current", "Consumption", "Rate", "Fixed", "Amount", "Reading date", "Recorded by"]} rows={rows.map((r) => [r.billingMonth, r.tenantName, r.previousReading, r.currentReading, r.consumption, r.ratePerUnit, money(r.fixedCharge), money(r.amount), r.readingDate, r.recordedBy])} />
    </Page>
  );
}
