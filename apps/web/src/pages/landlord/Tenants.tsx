import { Plus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPost, money } from "../../lib/api";
import { DataTable, Page, PageSkeleton, StatusBadge } from "../../components/ui";
import { toast } from "../../lib/toast";

export function Tenants() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api<any[]>("/api/tenants").then(setRows);
  useEffect(() => {
    load();
    api<any[]>("/api/units").then(setUnits).catch((error) => toast(error.message, "error"));
  }, []);
  if (!rows) return <PageSkeleton title="Tenants" variant="table" />;

  function addTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const unit = units.find((item) => item.id === form.get("unitId"));
    apiPost("/api/tenants", {
      unitId: form.get("unitId"),
      fullName: form.get("fullName"),
      email: form.get("email"),
      contactNumber: form.get("contactNumber"),
      monthlyRent: Number(form.get("monthlyRent") || unit?.monthlyRent || 0),
      moveInDate: form.get("moveInDate"),
      billingDueDay: Number(form.get("billingDueDay") ?? 5)
    }).then(() => {
      toast("Tenant added.", "success");
      setOpen(false);
      load();
    }).catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Tenants" eyebrow="Tenant monitoring and rental history" actions={<button className="primary-btn" onClick={() => units.length ? setOpen(true) : toast("No units available.", "error")}><Plus size={16} /> Add tenant</button>}>
      <DataTable columns={["Name", "Email", "Contact", "Monthly rent", "Move-in", "Contract end", "Due day", "Status"]} rows={rows.map((t) => [t.fullName, t.email, t.contactNumber, money(t.monthlyRent), t.moveInDate, t.contractEndDate, t.billingDueDay, <StatusBadge value={t.status} />])} />
      {open ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={addTenant}>
            <header><h3>Add tenant</h3><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Unit<select name="unitId">{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitNumber} - {unit.unitName}</option>)}</select></label>
              <label>Full name<input name="fullName" required /></label>
              <label>Email<input name="email" type="email" /></label>
              <label>Contact number<input name="contactNumber" /></label>
              <label>Monthly rent<input name="monthlyRent" type="number" /></label>
              <label>Move-in date<input name="moveInDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <label>Due day<input name="billingDueDay" type="number" min="1" max="31" defaultValue="5" /></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-btn">Add tenant</button></footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}
