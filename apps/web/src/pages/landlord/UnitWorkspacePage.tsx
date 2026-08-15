import { ArrowLeft, Pencil, Plus, Printer, Undo2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable, Page, StatCard, StatusBadge } from "../../components/ui";
import { api, money } from "../../lib/api";

const tabs = ["Overview", "Tenants", "Leases", "Bills", "Electricity", "Water", "Payments", "Activity"] as const;

export function UnitWorkspacePage() {
  const { propertyId, floorId, unitId } = useParams();
  const [data, setData] = useState<any>();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  useEffect(() => { api<any>(`/api/units/${unitId}/workspace`).then(setData); }, [unitId]);
  if (!data) return <Page title="Unit Workspace"><div className="skeleton-grid"><span /><span /></div></Page>;
  const unit = data.unit;
  return (
    <Page title={`Unit ${unit.unitNumber}`} eyebrow={`${data.property.name} / ${data.floor.name}`} actions={<><Link to={`/landlord/properties/${propertyId}/building?floor=${floorId}`}><ArrowLeft size={16} /> Back to Floor</Link><button className="primary-btn"><Pencil size={16} /> Edit Unit</button></>}>
      <div className="stat-grid">
        <StatCard label="Status" value={unit.status} />
        <StatCard label="Monthly rent" value={money(unit.monthlyRent)} />
        <StatCard label="Occupancy" value={`${unit.currentOccupantCount}/${unit.maxOccupants}`} />
        <StatCard label="Outstanding" value={money(unit.outstandingBalance)} />
      </div>
      <div className="tabs">{tabs.map((item) => <button key={item} className={item === tab ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <section className="panel">
        {tab === "Overview" ? <Overview unit={unit} /> : null}
        {tab === "Tenants" ? <DataTable columns={["Name", "Contact", "Move-in", "Contract end", "Status", "Actions"]} rows={unit.tenants.map((t: any) => [t.fullName, t.contactNumber, t.moveInDate, t.contractEndDate, <StatusBadge value={t.status} />, <button>Move out</button>])} /> : null}
        {tab === "Leases" ? <DataTable columns={["Tenant", "Start", "End", "Rent", "Deposit", "Status"]} rows={unit.leases.map((l: any) => [l.tenantName, l.startsAt, l.endsAt, money(l.monthlyRent), money(l.securityDeposit), <StatusBadge value={l.status} />])} /> : null}
        {tab === "Bills" ? <DataTable columns={["Period", "Rent", "Electricity", "Water", "Total", "Paid", "Balance", "Status", "Actions"]} rows={unit.billing.map((b: any) => [b.billingPeriod, money(b.monthlyRent), money(b.electricityCharge), money(b.waterCharge), money(b.totalAmountDue), money(b.amountPaid), money(b.remainingBalance), <StatusBadge value={b.status} />, <button><Printer size={15} /> Print</button>])} /> : null}
        {tab === "Electricity" ? <DataTable columns={["Month", "Previous", "Current", "Consumption", "Rate", "Amount", "Actions"]} rows={unit.electricity.map((r: any) => [r.billingMonth, r.previousReading, r.currentReading, r.consumption, r.ratePerUnit, money(r.amount), <button><Zap size={15} /> Correct</button>])} /> : null}
        {tab === "Water" ? <DataTable columns={["Month", "Previous", "Current", "Consumption", "Amount", "Calculation"]} rows={unit.water.map((r: any) => [r.billingMonth, r.previousReading, r.currentReading, r.consumption, money(r.amount), r.calculationNote])} /> : null}
        {tab === "Payments" ? <DataTable columns={["OR No.", "Date", "Amount", "Method", "Reference", "Status", "Actions"]} rows={unit.payments.map((p: any) => [p.officialReceiptNo, p.paymentDate, money(p.amountPaid), p.paymentMethod, p.referenceNumber, <StatusBadge value={p.status} />, <button><Undo2 size={15} /> Reverse</button>])} /> : null}
        {tab === "Activity" ? <DataTable columns={["Time", "User", "Action", "Module", "Record"]} rows={data.activity.map((a: any) => [a.createdAt, a.user, a.action, a.module, a.recordId])} /> : null}
      </section>
    </Page>
  );
}

function Overview({ unit }: { unit: any }) {
  return (
    <div className="overview-grid">
      <article><h3>Current tenant</h3><p>{unit.primaryTenant || "This unit is currently vacant."}</p><button><Plus size={16} /> Assign Tenant</button></article>
      <article><h3>Current bill</h3><p>{unit.currentBill ? `${unit.currentBill.billingPeriod} / ${unit.billingStatus}` : "No bill has been generated for the current billing period."}</p><button><Plus size={16} /> Generate Bill</button></article>
      <article><h3>Utilities</h3><p>Electricity: {unit.electricityStatus}</p><p>Water: {unit.waterStatus}</p></article>
      <article><h3>Recent payment</h3><p>{unit.recentPayment ? `${unit.recentPayment.officialReceiptNo} / ${money(unit.recentPayment.amountPaid)}` : "No payments recorded."}</p></article>
    </div>
  );
}
