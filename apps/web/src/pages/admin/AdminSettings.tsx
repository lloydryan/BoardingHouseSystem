import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Page } from "../../components/ui";

export function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/api/settings").then(setSettings); }, []);
  return (
    <Page title="System Settings" eyebrow="Platform controls" actions={<button className="primary-btn"><Save size={16} /> Save settings</button>}>
      <div className="form-grid">{settings.map((item) => <label key={item.key}>{item.key}<input defaultValue={String(item.value)} /></label>)}</div>
    </Page>
  );
}
