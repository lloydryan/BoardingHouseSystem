import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Page, StatusBadge } from "../../components/ui";

export function Notifications() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/notifications").then(setRows); }, []);
  return (
    <Page title="Notifications" eyebrow="In-app reminders prepared for email and SMS expansion">
      <div className="notification-list">{rows.map((n) => <article key={n.id} className="panel notification"><Bell size={18} /><div><StatusBadge value={n.type} /><h3>{n.title}</h3><p>{n.message}</p><small>{n.createdAt}</small></div></article>)}</div>
    </Page>
  );
}
