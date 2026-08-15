import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DataTable, Page, StatusBadge, Toolbar } from "../../components/ui";

export function AdminLandlords() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/admin/landlords").then(setRows); }, []);
  return (
    <Page title="Landlord Accounts" eyebrow="Create, suspend, limit, and brand landlord workspaces" actions={<button className="primary-btn"><Plus size={16} /> Create landlord</button>}>
      <Toolbar><Search size={18} /><input placeholder="Search landlord, email, or business" /><select><option>All statuses</option><option>Active</option><option>Suspended</option></select></Toolbar>
      <DataTable columns={["Name", "Business", "Email", "Usage", "Limit", "Units", "Tenants", "Plan", "Status", "Actions"]} rows={rows.map((item) => [item.fullName, item.businessName, item.email, item.currentPropertyCount, item.maxProperties, item.usage.totalUnits, item.usage.activeTenants, item.subscriptionPlan, <StatusBadge value={item.status} />, <button>Manage</button>])} />
    </Page>
  );
}
