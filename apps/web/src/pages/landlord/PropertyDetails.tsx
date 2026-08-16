import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, money } from "../../lib/api";
import { BedDouble, CircleDollarSign, CreditCard, DoorOpen, Droplets, FileText, Landmark, ReceiptText, Users, Zap } from "lucide-react";
import { DataTable, Page, PageSkeleton, StatCard, StatusBadge } from "../../components/ui";

export function PropertyDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<any>();
  useEffect(() => { api<any>(`/api/properties/${id}`).then(setItem); }, [id]);
  if (!item) return <PageSkeleton title="Property Details" variant="detail" />;
  return (
    <Page title={item.name} eyebrow={item.address}>
      <div className="stat-grid">
        <StatCard label="Total units" value={item.totalUnits} icon={<DoorOpen size={19} />} />
        <StatCard label="Occupied" value={item.occupiedUnits} icon={<BedDouble size={19} />} />
        <StatCard label="Vacant" value={item.vacantUnits} icon={<Landmark size={19} />} />
        <StatCard label="Expected rent" value={money(item.monthlyExpectedRent)} icon={<ReceiptText size={19} />} />
        <StatCard label="Collected" value={money(item.collectedThisMonth)} icon={<CircleDollarSign size={19} />} />
        <StatCard label="Outstanding" value={money(item.outstanding)} icon={<CreditCard size={19} />} />
      </div>
      <div className="property-workspace">
        {item.units.map((unit: any) => (
          <article className="unit-workspace" key={unit.id}>
            <header>
              <div>
                <span className="eyebrow">Unit {unit.unitNumber} / Floor {unit.floor}</span>
                <h3>{unit.unitType}</h3>
              </div>
              <StatusBadge value={unit.status} />
            </header>
            <div className="unit-summary">
              <span>Rent <strong>{money(unit.monthlyRent)}</strong></span>
              <span>Deposit <strong>{money(unit.securityDeposit)}</strong></span>
              <span>Occupants <strong>{unit.currentOccupantCount}/{unit.maxOccupants}</strong></span>
              <span>Utilities <strong>{unit.electricityBillingMethod} / {unit.waterBillingMethod}</strong></span>
            </div>

            <div className="nested-grid">
              <section>
                <h4><Users size={16} /> Tenants</h4>
                {unit.tenants.length ? (
                  <DataTable columns={["Name", "Contact", "Move-in", "Due day", "Status"]} rows={unit.tenants.map((tenant: any) => [tenant.fullName, tenant.contactNumber, tenant.moveInDate, tenant.billingDueDay, <StatusBadge value={tenant.status} />])} />
                ) : <p className="empty-state">No tenant assigned.</p>}
              </section>

              <section>
                <h4><Landmark size={16} /> Leases</h4>
                {unit.leases.length ? (
                  <DataTable columns={["Tenant", "Start", "End", "Rent", "Status"]} rows={unit.leases.map((lease: any) => [lease.tenantName, lease.startsAt, lease.endsAt, money(lease.monthlyRent), <StatusBadge value={lease.status} />])} />
                ) : <p className="empty-state">No active lease.</p>}
              </section>

              <section>
                <h4><FileText size={16} /> Bills</h4>
                {unit.billing.length ? (
                  <DataTable columns={["Period", "Total", "Paid", "Balance", "Status"]} rows={unit.billing.map((bill: any) => [bill.billingPeriod, money(bill.totalAmountDue), money(bill.amountPaid), money(bill.remainingBalance), <StatusBadge value={bill.status} />])} />
                ) : <p className="empty-state">No billing statements yet.</p>}
              </section>

              <section>
                <h4><Zap size={16} /> Electricity</h4>
                {unit.electricity.length ? (
                  <DataTable columns={["Month", "Previous", "Current", "kWh", "Amount"]} rows={unit.electricity.map((reading: any) => [reading.billingMonth, reading.previousReading, reading.currentReading, reading.consumption, money(reading.amount)])} />
                ) : <p className="empty-state">No electricity readings.</p>}
              </section>

              <section>
                <h4><Droplets size={16} /> Water</h4>
                {unit.water.length ? (
                  <DataTable columns={["Month", "Previous", "Current", "Use", "Amount"]} rows={unit.water.map((reading: any) => [reading.billingMonth, reading.previousReading, reading.currentReading, reading.consumption, money(reading.amount)])} />
                ) : <p className="empty-state">No water readings.</p>}
              </section>

              <section>
                <h4><CreditCard size={16} /> Payments</h4>
                {unit.payments.length ? (
                  <DataTable columns={["OR No.", "Date", "Amount", "Method", "Status"]} rows={unit.payments.map((payment: any) => [payment.officialReceiptNo, payment.paymentDate, money(payment.amountPaid), payment.paymentMethod, <StatusBadge value={payment.status} />])} />
                ) : <p className="empty-state">No payments recorded.</p>}
              </section>
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
