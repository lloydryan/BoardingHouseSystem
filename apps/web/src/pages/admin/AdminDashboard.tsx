import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DataTable, Page, StatCard, StatusBadge } from "../../components/ui";

export function AdminDashboard() {
  const [data, setData] = useState<any>();
  useEffect(() => { api<any>("/api/admin/dashboard").then(setData); }, []);
  if (!data) return <Page title="Super Admin Dashboard">Loading platform health...</Page>;
  return (
    <Page title="Super Admin Dashboard" eyebrow="Centralized SaaS management">
      <div className="stat-grid">
        <StatCard label="Total landlords" value={String(data.totals.totalLandlords)} />
        <StatCard label="Active landlords" value={String(data.totals.activeLandlords)} />
        <StatCard label="Suspended" value={String(data.totals.suspendedLandlords)} />
        <StatCard label="Properties" value={String(data.totals.totalProperties)} />
        <StatCard label="Units" value={String(data.totals.totalUnits)} />
        <StatCard label="Tenants" value={String(data.totals.totalTenants)} />
      </div>
      <div className="grid two">
        <article className="panel">
          <h3>Landlord registrations</h3>
          <ResponsiveContainer height={240}><BarChart data={data.charts.registrations}><XAxis dataKey="month" /><YAxis /><Bar dataKey="landlords" fill="#2563eb" radius={4} /></BarChart></ResponsiveContainer>
        </article>
        <article className="panel">
          <h3>Subscription plan distribution</h3>
          <ResponsiveContainer height={240}><PieChart><Pie data={data.charts.plans} dataKey="value" nameKey="name" outerRadius={82}>{data.charts.plans.map((_: any, i: number) => <Cell key={i} fill={["#2563eb", "#0f766e", "#f59e0b"][i]} />)}</Pie></PieChart></ResponsiveContainer>
        </article>
      </div>
      <DataTable columns={["Landlord", "Business", "Status", "Plan", "Property limit", "Expiration"]} rows={data.landlords.map((item: any) => [item.fullName, item.businessName, <StatusBadge value={item.status} />, item.subscriptionPlan, item.maxProperties, item.subscriptionExpiresAt])} />
    </Page>
  );
}
