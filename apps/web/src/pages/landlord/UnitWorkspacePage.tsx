import { ArrowLeft, Pencil, Plus, Printer, Undo2, Zap, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable, Page, PageSkeleton, StatCard, StatusBadge } from "../../components/ui";
import { api, apiPatch, apiPost, money } from "../../lib/api";
import { toast } from "../../lib/toast";

const tabs = ["Overview", "Tenants", "Leases", "Bills", "Electricity", "Water", "Payments", "Activity"] as const;

export function UnitWorkspacePage() {
  const { propertyId, floorId, unitId } = useParams();
  const [data, setData] = useState<any>();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const load = () => api<any>(`/api/units/${unitId}/workspace`).then(setData);
  useEffect(() => { load(); }, [unitId]);
  if (!data) return <PageSkeleton title="Unit Workspace" variant="detail" />;
  const unit = data.unit;

  function editUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apiPatch(`/api/units/${unit.id}`, Object.fromEntries(new FormData(event.currentTarget))).then(() => {
      toast("Unit updated.", "success");
      setEditOpen(false);
      load();
    }).catch((error) => toast(error.message, "error"));
  }

  function assignTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apiPost("/api/tenants", { unitId: unit.id, ...Object.fromEntries(new FormData(event.currentTarget)) })
      .then(() => {
        toast("Tenant assigned.", "success");
        setTenantOpen(false);
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  function generateBill() {
    apiPost("/api/billing", { unitId: unit.id, monthlyRent: unit.monthlyRent, billingPeriod: new Date().toISOString().slice(0, 7), dueDate: new Date().toISOString().slice(0, 10) })
      .then(() => {
        toast("Bill generated.", "success");
        load();
      })
      .catch((error) => toast(error.message, "error"));
  }

  function moveOutTenant(tenant: any) {
    apiPatch(`/api/tenants/${tenant.id}/move-out`, {}).then(() => {
      toast(`${tenant.fullName} moved out.`, "success");
      load();
    }).catch((error) => toast(error.message, "error"));
  }

  function reversePayment(payment: any) {
    apiPatch(`/api/payments/${payment.id}/reverse`, {}).then(() => {
      toast(`${payment.officialReceiptNo} reversed.`, "success");
      load();
    }).catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title={`Unit ${unit.unitNumber}`} eyebrow={`${data.property.name} / ${data.floor.name}`} actions={<><Link to={`/landlord/properties/${propertyId}/building?floor=${floorId}`}><ArrowLeft size={16} /> Back to Floor</Link><button className="primary-btn" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit Unit</button></>}>
      <div className="stat-grid">
        <StatCard label="Status" value={unit.status} />
        <StatCard label="Monthly rent" value={money(unit.monthlyRent)} />
        <StatCard label="Occupancy" value={`${unit.currentOccupantCount}/${unit.maxOccupants}`} />
        <StatCard label="Outstanding" value={money(unit.outstandingBalance)} />
      </div>
      <div className="tabs">{tabs.map((item) => <button key={item} className={item === tab ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <section className="panel">
        {tab === "Overview" ? <Overview unit={unit} onAssignTenant={() => setTenantOpen(true)} onGenerateBill={generateBill} /> : null}
        {tab === "Tenants" ? <DataTable columns={["Name", "Contact", "Move-in", "Contract end", "Status", "Actions"]} rows={unit.tenants.map((t: any) => [t.fullName, t.contactNumber, t.moveInDate, t.contractEndDate, <StatusBadge value={t.status} />, <button onClick={() => moveOutTenant(t)} disabled={t.status !== "Active"}>Move out</button>])} /> : null}
        {tab === "Leases" ? <DataTable columns={["Tenant", "Start", "End", "Rent", "Deposit", "Status"]} rows={unit.leases.map((l: any) => [l.tenantName, l.startsAt, l.endsAt, money(l.monthlyRent), money(l.securityDeposit), <StatusBadge value={l.status} />])} /> : null}
        {tab === "Bills" ? <DataTable columns={["Period", "Rent", "Electricity", "Water", "Total", "Paid", "Balance", "Status", "Actions"]} rows={unit.billing.map((b: any) => [b.billingPeriod, money(b.monthlyRent), money(b.electricityCharge), money(b.waterCharge), money(b.totalAmountDue), money(b.amountPaid), money(b.remainingBalance), <StatusBadge value={b.status} />, <button onClick={() => window.print()}><Printer size={15} /> Print</button>])} /> : null}
        {tab === "Electricity" ? <DataTable columns={["Month", "Previous", "Current", "Consumption", "Rate", "Amount", "Actions"]} rows={unit.electricity.map((r: any) => [r.billingMonth, r.previousReading, r.currentReading, r.consumption, r.ratePerUnit, money(r.amount), <button onClick={() => toast("Create a corrected reading from the Electricity page. Existing readings are preserved for audit history.", "info")}><Zap size={15} /> Correct</button>])} /> : null}
        {tab === "Water" ? <DataTable columns={["Month", "Previous", "Current", "Consumption", "Amount", "Calculation"]} rows={unit.water.map((r: any) => [r.billingMonth, r.previousReading, r.currentReading, r.consumption, money(r.amount), r.calculationNote])} /> : null}
        {tab === "Payments" ? <DataTable columns={["OR No.", "Date", "Amount", "Method", "Reference", "Status", "Actions"]} rows={unit.payments.map((p: any) => [p.officialReceiptNo, p.paymentDate, money(p.amountPaid), p.paymentMethod, p.referenceNumber, <StatusBadge value={p.status} />, <button onClick={() => reversePayment(p)} disabled={p.status === "Reversed"}><Undo2 size={15} /> Reverse</button>])} /> : null}
        {tab === "Activity" ? <DataTable columns={["Time", "User", "Action", "Module", "Record"]} rows={data.activity.map((a: any) => [a.createdAt, a.user, a.action, a.module, a.recordId])} /> : null}
      </section>
      {editOpen ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={editUnit}>
            <header><h3>Edit unit</h3><button type="button" onClick={() => setEditOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Name<input name="unitName" defaultValue={unit.unitName} /></label>
              <label>Type<input name="unitType" defaultValue={unit.unitType} /></label>
              <label>Monthly rent<input name="monthlyRent" type="number" defaultValue={unit.monthlyRent} /></label>
              <label>Security deposit<input name="securityDeposit" type="number" defaultValue={unit.securityDeposit} /></label>
              <label>Max occupants<input name="maxOccupants" type="number" defaultValue={unit.maxOccupants} /></label>
              <label>Status<select name="status" defaultValue={unit.status}><option>Vacant</option><option>Occupied</option><option>Reserved</option><option>Under Maintenance</option></select></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setEditOpen(false)}>Cancel</button><button className="primary-btn">Save unit</button></footer>
          </form>
        </div>
      ) : null}
      {tenantOpen ? (
        <div className="dialog-backdrop">
          <form className="dialog compact-dialog" onSubmit={assignTenant}>
            <header><h3>Assign tenant</h3><button type="button" onClick={() => setTenantOpen(false)}><X size={18} /></button></header>
            <div className="form-grid">
              <label>Full name<input name="fullName" required /></label>
              <label>Email<input name="email" type="email" /></label>
              <label>Contact number<input name="contactNumber" /></label>
              <label>Monthly rent<input name="monthlyRent" type="number" defaultValue={unit.monthlyRent} /></label>
              <label>Move-in date<input name="moveInDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <label>Due day<input name="billingDueDay" type="number" min="1" max="31" defaultValue="5" /></label>
            </div>
            <footer className="dialog-actions"><button type="button" onClick={() => setTenantOpen(false)}>Cancel</button><button className="primary-btn">Assign tenant</button></footer>
          </form>
        </div>
      ) : null}
    </Page>
  );
}

function Overview({ unit, onAssignTenant, onGenerateBill }: { unit: any; onAssignTenant: () => void; onGenerateBill: () => void }) {
  return (
    <div className="overview-grid">
      <article><h3>Current tenant</h3><p>{unit.primaryTenant || "This unit is currently vacant."}</p><button onClick={onAssignTenant}><Plus size={16} /> Assign Tenant</button></article>
      <article><h3>Current bill</h3><p>{unit.currentBill ? `${unit.currentBill.billingPeriod} / ${unit.billingStatus}` : "No bill has been generated for the current billing period."}</p><button onClick={onGenerateBill}><Plus size={16} /> Generate Bill</button></article>
      <article><h3>Utilities</h3><p>Electricity: {unit.electricityStatus}</p><p>Water: {unit.waterStatus}</p></article>
      <article><h3>Recent payment</h3><p>{unit.recentPayment ? `${unit.recentPayment.officialReceiptNo} / ${money(unit.recentPayment.amountPaid)}` : "No payments recorded."}</p></article>
    </div>
  );
}
