import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import { DataTable, Page, StatCard, StatusBadge } from "../../components/ui";

export function Dashboard() {
  const [data, setData] = useState<any>();
  useEffect(() => { api<any>("/api/dashboard").then(setData); }, []);
  if (!data) return <Page title="Landlord Dashboard">Loading dashboard...</Page>;
  const t = data.totals;
  return (
    <Page title="Landlord Dashboard" eyebrow="Rivera Homes workspace">
      <div className="stat-grid">
        <StatCard label="Properties" value={t.totalProperties} />
        <StatCard label="Total units" value={t.totalUnits} />
        <StatCard label="Occupied" value={t.occupiedUnits} />
        <StatCard label="Vacant" value={t.vacantUnits} />
        <StatCard label="Active tenants" value={t.activeTenants} />
        <StatCard label="Expected rent" value={money(t.expectedMonthlyRent)} />
        <StatCard label="Collected" value={money(t.collectedThisMonth)} />
        <StatCard label="Outstanding" value={money(t.outstandingBalance)} />
      </div>
      <div className="quick-actions"><button>Add property</button><button>Add unit</button><button>Add tenant</button><button>Generate bills</button><button>Add meter reading</button><button>Record payment</button></div>
      <div className="grid two">
        <article className="panel"><h3>Expected rent vs collections</h3><ResponsiveContainer height={270}><BarChart data={data.charts.collections}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="expected" fill="#2563eb" radius={4} /><Bar dataKey="collected" fill="#0f766e" radius={4} /></BarChart></ResponsiveContainer></article>
        <article className="panel"><h3>Occupancy</h3><ResponsiveContainer height={270}><PieChart><Pie data={data.charts.occupancy} dataKey="value" nameKey="name" outerRadius={90} label>{data.charts.occupancy.map((_: any, i: number) => <Cell key={i} fill={["#0f766e", "#f59e0b", "#64748b"][i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></article>
      </div>
      <DataTable columns={["Receipt", "Tenant", "Property", "Date", "Amount", "Status"]} rows={data.recentPayments.map((p: any) => [p.officialReceiptNo, p.tenantName, p.propertyName, p.paymentDate, money(p.amountPaid), <StatusBadge value={p.status} />])} />
    </Page>
  );
}
