import { useEffect, useState } from "react";
import { api } from "../../services/apiService";
import { DataTable, Page, PageSkeleton, StatusBadge } from "../../components/ui";

export function AuditLogs() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>("/api/audit-logs").then(setRows); }, []);
  if (!rows) return <PageSkeleton title="Audit Logs" variant="table" />;
  return (
    <Page title="Audit Logs" eyebrow="Read-only security and financial trail">
      <DataTable columns={["Time", "User", "Role", "Action", "Module", "Record", "IP"]} rows={rows.map((item) => [item.createdAt, item.user, <StatusBadge value={item.role} />, item.action, item.module, item.recordId, item.ipAddress])} />
    </Page>
  );
}

