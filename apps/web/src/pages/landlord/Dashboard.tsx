import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, BedDouble, Building2, CircleDollarSign, DoorOpen, Home, ReceiptText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../../lib/api";
import { DataTable, Page, PageSkeleton, StatCard, StatusBadge } from "../../components/ui";

export function Dashboard() {
  const [data, setData] = useState<any>();
  useEffect(() => { api<any>("/api/dashboard").then(setData); }, []);
  if (!data) return <PageSkeleton title="Landlord Dashboard" />;
  const t = data.totals;
  return (
    <Page title="Landlord Dashboard" eyebrow="Rivera Homes workspace">
      <div className="stat-grid">
        <StatCard label="Properties" value={t.totalProperties} icon={<Building2 size={19} />} />
        <StatCard label="Total units" value={t.totalUnits} icon={<Home size={19} />} />
        <StatCard label="Occupied" value={t.occupiedUnits} icon={<BedDouble size={19} />} />
        <StatCard label="Vacant" value={t.vacantUnits} icon={<DoorOpen size={19} />} />
        <StatCard label="Active tenants" value={t.activeTenants} icon={<Users size={19} />} />
        <StatCard label="Expected rent" value={money(t.expectedMonthlyRent)} icon={<ReceiptText size={19} />} />
        <StatCard label="Collected" value={money(t.collectedThisMonth)} icon={<CircleDollarSign size={19} />} />
        <StatCard label="Outstanding" value={money(t.outstandingBalance)} icon={<Banknote size={19} />} />
      </div>
      <div className="quick-actions">
        <Link to="/landlord/properties">Add property</Link>
        <Link to="/landlord/properties">Add unit</Link>
        <Link to="/landlord/tenants">Add tenant</Link>
        <Link to="/landlord/billing">Generate bills</Link>
        <Link to="/landlord/electricity">Add meter reading</Link>
        <Link to="/landlord/payments">Record payment</Link>
      </div>
      <div className="grid two">
        <article className="panel"><h3>Expected rent vs collections</h3><ResponsiveContainer height={270}><BarChart data={data.charts.collections}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="expected" fill="#2563eb" radius={4} /><Bar dataKey="collected" fill="#0f766e" radius={4} /></BarChart></ResponsiveContainer></article>
        <article className="panel"><h3>Occupancy</h3><ResponsiveContainer height={270}><PieChart><Pie data={data.charts.occupancy} dataKey="value" nameKey="name" outerRadius={90} label>{data.charts.occupancy.map((_: any, i: number) => <Cell key={i} fill={["#0f766e", "#f59e0b", "#64748b"][i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></article>
      </div>
      <DataTable columns={["Receipt", "Tenant", "Property", "Date", "Amount", "Status"]} rows={data.recentPayments.map((p: any) => [p.officialReceiptNo, p.tenantName, p.propertyName, p.paymentDate, money(p.amountPaid), <StatusBadge value={p.status} />])} />
    </Page>
  );
}
