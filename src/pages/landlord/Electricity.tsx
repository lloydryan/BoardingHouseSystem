import { X, Zap } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPost, money } from "../../services/apiService";
import { DataTable, Page, PageSkeleton } from "../../components/ui";
import { toast } from "../../services/toastService";

export function Electricity() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api<any[]>("/api/electricity/readings").then(setRows);
  useEffect(() => {
    load();
    api<any[]>("/api/units").then(setUnits).catch((error) => toast(error.message, "error"));
  }, []);
  if (!rows) return <PageSkeleton title="Electricity Readings" variant="table" />;

  function addReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    apiPost("/api/electricity/readings", {
      unitId: form.get("unitId"),
      previousReading: Number(form.get("previousReading") ?? 0),
      currentReading: Number(form.get("currentReading") ?? 0),
      ratePerUnit: Number(form.get("ratePerUnit") ?? 10),
      billingMonth: form.get("billingMonth")
    })
      .then(() => {
        toast("Electricity reading added.", "success");
        setOpen(false);
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Electricity Readings" eyebrow="Metered, fixed, included, and manual utility billing" actions={<button className="primary-btn" onClick={() => units.length ? setOpen(true) : toast("No units available.", "error")}><Zap size={16} /> Add reading</button>}>
      <DataTable columns={["Month", "Tenant", "Previous", "Current", "Consumption", "Rate", "Fixed", "Amount", "Reading date", "Recorded by"]} rows={rows.map((r) => [r.billingMonth, r.tenantName, r.previousReading, r.currentReading, r.consumption, r.ratePerUnit, money(r.fixedCharge), money(r.amount), r.readingDate, r.recordedBy])} />
      {open ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={addReading}>
            <header><h3>Add electricity reading</h3><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Unit<select name="unitId">{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitNumber} - {unit.unitName}</option>)}</select></label>
              <label>Billing month<input name="billingMonth" type="month" defaultValue={new Date().toISOString().slice(0, 7)} /></label>
              <label>Previous reading<input name="previousReading" type="number" defaultValue="0" /></label>
              <label>Current reading<input name="currentReading" type="number" defaultValue="0" /></label>
              <label>Rate per kWh<input name="ratePerUnit" type="number" defaultValue="10" /></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-btn">Save reading</button></footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}


