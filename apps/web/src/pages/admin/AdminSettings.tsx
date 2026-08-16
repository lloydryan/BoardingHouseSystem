import { Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPatch } from "../../lib/api";
import { Page, PageSkeleton } from "../../components/ui";
import { toast } from "../../lib/toast";

export function AdminSettings() {
  const [settings, setSettings] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>("/api/settings").then(setSettings); }, []);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apiPatch<any[]>("/api/settings", Object.fromEntries(new FormData(event.currentTarget))).then((next) => {
      setSettings(next);
      toast("Settings saved.", "success");
    }).catch((error) => toast(error.message, "error"));
  }
  if (!settings) return <PageSkeleton title="System Settings" variant="detail" />;
  return (
    <Page title="System Settings" eyebrow="Platform controls">
      <form className="form-grid" onSubmit={save}>
        {settings.map((item) => <label key={item.key}>{item.key}<input name={item.key} defaultValue={String(item.value)} /></label>)}
        <button className="primary-btn"><Save size={16} /> Save settings</button>
      </form>
    </Page>
  );
}
