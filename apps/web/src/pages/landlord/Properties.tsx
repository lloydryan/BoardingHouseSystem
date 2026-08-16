import { Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPost, money } from "../../lib/api";
import { Page, PageSkeleton, StatusBadge } from "../../components/ui";
import { toast } from "../../lib/toast";

export function Properties() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const load = () => api<any[]>("/api/properties").then(setRows);
  useEffect(() => { load(); }, []);
  if (!rows) return <PageSkeleton title="Properties" variant="detail" />;

  function addProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    apiPost("/api/properties", {
      name,
      address: form.get("address"),
      code: String(form.get("code") || name.slice(0, 3).toUpperCase()),
      contactNumber: form.get("contactNumber"),
      numberOfFloors: Number(form.get("numberOfFloors") ?? 0),
      manager: form.get("manager"),
      monthlyExpectedRent: 0,
      collectedThisMonth: 0,
      outstanding: 0
    }).then(() => {
      toast("Property created.", "success");
      setOpen(false);
      load();
    }).catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Properties" eyebrow="Boarding house portfolio" actions={<button className="primary-btn" onClick={() => setOpen(true)}><Plus size={16} /> Add property</button>}>
      <div className="property-grid">
        {rows.map((item) => (
          <Link className="property-card" key={item.id} to={`/landlord/properties/${item.id}/building`}>
            <div className="property-media">{item.code}</div>
            <h3>{item.name}</h3>
            <p>{item.address}</p>
            <div className="property-stats"><span>{item.occupiedUnits}/{item.totalUnits} occupied</span><StatusBadge value={item.status} /></div>
            <strong>{money(item.monthlyExpectedRent)} expected rent</strong>
          </Link>
        ))}
      </div>
      {open ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={addProperty}>
            <header><h3>Add property</h3><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Name<input name="name" required placeholder="Aurora Boarding House" /></label>
              <label>Code<input name="code" placeholder="ABH-001" /></label>
              <label>Address<input name="address" placeholder="Street, city" /></label>
              <label>Contact number<input name="contactNumber" /></label>
              <label>Manager<input name="manager" /></label>
              <label>Floors<input name="numberOfFloors" type="number" min="0" defaultValue="0" /></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-btn">Create property</button></footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}
