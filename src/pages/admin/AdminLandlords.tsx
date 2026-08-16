import { Plus, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPatch, apiPost } from "../../services/apiService";
import { DataTable, Page, PageSkeleton, StatusBadge, Toolbar } from "../../components/ui";

export function AdminLandlords() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => api<any[]>("/api/admin/landlords").then(setRows);

  useEffect(() => {
    load()
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function createLandlord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setError("");
    const form = new FormData(formElement);
    const fullName = String(form.get("fullName") ?? "").trim();
    const businessName = String(form.get("businessName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();

    try {
      await apiPost("/api/admin/landlords", {
        fullName,
        businessName: businessName || `${fullName} Rentals`,
        email,
        contactNumber: String(form.get("contactNumber") ?? "").trim(),
        address: String(form.get("address") ?? "").trim(),
        maxProperties: Number(form.get("maxProperties") ?? 1),
        subscriptionPlan: String(form.get("subscriptionPlan") ?? "Starter"),
        demoPassword: String(form.get("demoPassword") ?? "")
      });
      await load();
      setDialogOpen(false);
      formElement.reset();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleStatus(item: any) {
    const status = item.status === "Active" ? "Suspended" : "Active";
    apiPatch(`/api/admin/landlords/${item.id}/status`, { status }).then(load).catch((error) => setError(error.message));
  }

  if (loading) return <PageSkeleton title="Landlord Accounts" variant="table" />;

  return (
    <Page title="Landlord Accounts" eyebrow="Create, suspend, limit, and brand landlord workspaces" actions={<button className="primary-btn" onClick={() => setDialogOpen(true)}><Plus size={16} /> Create landlord</button>}>
      {error ? <div className="notice error">{error}</div> : null}
      <Toolbar><Search size={18} /><input placeholder="Search landlord, email, or business" /><select><option>All statuses</option><option>Active</option><option>Suspended</option></select></Toolbar>
      <DataTable columns={["Name", "Business", "Email", "Usage", "Limit", "Units", "Tenants", "Plan", "Status", "Actions"]} rows={rows.map((item) => [item.fullName, item.businessName, item.email, item.currentPropertyCount, item.maxProperties, item.usage.totalUnits, item.usage.activeTenants, item.subscriptionPlan, <StatusBadge value={item.status} />, <button onClick={() => toggleStatus(item)}>{item.status === "Active" ? "Suspend" : "Activate"}</button>])} />
      {dialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <form className="dialog landlord-dialog" onSubmit={createLandlord}>
            <header>
              <div>
                <span className="eyebrow">New Account</span>
                <h3>Create landlord</h3>
              </div>
              <button type="button" title="Close" onClick={() => setDialogOpen(false)}><X size={18} /></button>
            </header>
            <div className="form-grid">
              <label>Full name<input name="fullName" required autoComplete="name" /></label>
              <label>Business name<input name="businessName" /></label>
              <label>Email<input name="email" type="email" required autoComplete="email" /></label>
              <label>Phone<input name="contactNumber" autoComplete="tel" /></label>
              <label>Address<input name="address" autoComplete="street-address" /></label>
              <label>Property limit<input name="maxProperties" type="number" min="1" defaultValue="1" /></label>
              <label>Plan<select name="subscriptionPlan" defaultValue="Starter"><option>Starter</option><option>Growth</option><option>Enterprise</option></select></label>
              <label>Temporary password<input name="demoPassword" type="text" minLength={6} required /></label>
            </div>
            <footer className="dialog-actions">
              <button type="button" onClick={() => setDialogOpen(false)}>Cancel</button>
              <button className="primary-btn" disabled={saving}>{saving ? "Creating..." : "Create landlord"}</button>
            </footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}

