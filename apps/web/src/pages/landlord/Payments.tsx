import { Plus, Printer, Undo2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPatch, apiPost, money } from "../../lib/api";
import { DataTable, Page, PageSkeleton, StatusBadge } from "../../components/ui";
import { toast } from "../../lib/toast";

export function Payments() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api<any[]>("/api/payments").then(setRows);
  useEffect(() => {
    load();
    api<any[]>("/api/billing").then(setBills).catch((error) => toast(error.message, "error"));
  }, []);
  if (!rows) return <PageSkeleton title="Payments" variant="table" />;

  function reversePayment(payment: any) {
    apiPatch(`/api/payments/${payment.id}/reverse`, {}).then(() => {
      toast(`${payment.officialReceiptNo} reversed.`, "success");
      load();
    }).catch((error) => toast(error.message, "error"));
  }

  function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    apiPost("/api/payments", {
      billId: form.get("billId"),
      amountPaid: Number(form.get("amountPaid") ?? 0),
      paymentMethod: form.get("paymentMethod"),
      referenceNumber: form.get("referenceNumber")
    })
      .then(() => {
        toast("Payment recorded.", "success");
        setOpen(false);
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Payments" eyebrow="Receipts, allocations, partial payments, and reversals" actions={<button className="primary-btn" onClick={() => bills.length ? setOpen(true) : toast("No bills available.", "error")}><Plus size={16} /> Record payment</button>}>
      <DataTable columns={["OR No.", "Tenant", "Bill", "Date", "Amount", "Method", "Reference", "Received by", "Status", "Actions"]} rows={rows.map((p) => [p.officialReceiptNo, p.tenantName, p.billingStatement, p.paymentDate, money(p.amountPaid), p.paymentMethod, p.referenceNumber, p.receivedBy, <StatusBadge value={p.status} />, <span className="row-actions"><button title="Print receipt" onClick={() => window.print()}><Printer size={15} /></button><button title="Reverse payment" onClick={() => reversePayment(p)} disabled={p.status === "Reversed"}><Undo2 size={15} /></button></span>])} />
      {open ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={recordPayment}>
            <header><h3>Record payment</h3><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Bill<select name="billId">{bills.map((bill) => <option key={bill.id} value={bill.id}>{bill.tenantName} - {bill.billingPeriod} - {money(bill.remainingBalance)}</option>)}</select></label>
              <label>Amount paid<input name="amountPaid" type="number" required /></label>
              <label>Payment method<select name="paymentMethod" defaultValue="Cash"><option>Cash</option><option>GCash</option><option>Bank Transfer</option><option>Card</option></select></label>
              <label>Reference number<input name="referenceNumber" /></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-btn">Record payment</button></footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}
