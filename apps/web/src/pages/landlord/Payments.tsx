import { Printer, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, StatusBadge } from "../../components/ui";

export function Payments() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/payments").then(setRows); }, []);
  return (
    <Page title="Payments" eyebrow="Receipts, allocations, partial payments, and reversals">
      <DataTable columns={["OR No.", "Tenant", "Bill", "Date", "Amount", "Method", "Reference", "Received by", "Status", "Actions"]} rows={rows.map((p) => [p.officialReceiptNo, p.tenantName, p.billingStatement, p.paymentDate, money(p.amountPaid), p.paymentMethod, p.referenceNumber, p.receivedBy, <StatusBadge value={p.status} />, <span className="row-actions"><button title="Print receipt"><Printer size={15} /></button><button title="Reverse payment"><Undo2 size={15} /></button></span>])} />
    </Page>
  );
}
