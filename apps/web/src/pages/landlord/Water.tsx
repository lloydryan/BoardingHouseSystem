import { Droplets, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPost, money } from "../../lib/api";
import { DataTable, Page, PageSkeleton } from "../../components/ui";
import { toast } from "../../lib/toast";

export function Water() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api<any[]>("/api/water/readings").then(setRows);
  useEffect(() => {
    load();
    api<any[]>("/api/units").then(setUnits).catch((error) => toast(error.message, "error"));
  }, []);
  if (!rows) return <PageSkeleton title="Water Readings" variant="table" />;

  function addReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    apiPost("/api/water/readings", {
      unitId: form.get("unitId"),
      previousReading: Number(form.get("previousReading") ?? 0),
      currentReading: Number(form.get("currentReading") ?? 0),
      ratePerUnit: Number(form.get("ratePerUnit") ?? 10),
      billingMonth: form.get("billingMonth")
    })
      .then(() => {
        toast("Water reading added.", "success");
        setOpen(false);
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Water Readings" eyebrow="Metered, fixed, shared, included, and manual water billing" actions={<button className="primary-btn" onClick={() => units.length ? setOpen(true) : toast("No units available.", "error")}><Droplets size={16} /> Add reading</button>}>
      <DataTable columns={["Month", "Tenant", "Previous", "Current", "Consumption", "Total bill", "Occupied units", "Amount", "Calculation"]} rows={rows.map((r) => [r.billingMonth, r.tenantName, r.previousReading, r.currentReading, r.consumption, money(r.totalPropertyBill), r.occupiedUnitCount ?? "-", money(r.amount), r.calculationNote])} />
      {open ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={addReading}>
            <header><h3>Add water reading</h3><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Unit<select name="unitId">{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitNumber} - {unit.unitName}</option>)}</select></label>
              <label>Billing month<input name="billingMonth" type="month" defaultValue={new Date().toISOString().slice(0, 7)} /></label>
              <label>Previous reading<input name="previousReading" type="number" defaultValue="0" /></label>
              <label>Current reading<input name="currentReading" type="number" defaultValue="0" /></label>
              <label>Rate per unit<input name="ratePerUnit" type="number" defaultValue="10" /></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-btn">Save reading</button></footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}
