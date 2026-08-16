import { Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, apiPatch } from "../../lib/api";
import { Page, PageSkeleton } from "../../components/ui";
import { toast } from "../../lib/toast";

export function ThemeBranding() {
  const [theme, setTheme] = useState<any>();
  useEffect(() => { api<any>("/api/theme").then(setTheme); }, []);
  if (!theme) return <PageSkeleton title="Theme and Branding" variant="detail" />;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apiPatch("/api/theme", Object.fromEntries(new FormData(event.currentTarget))).then((next) => {
      setTheme(next);
      toast("Theme saved.", "success");
    }).catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Theme and Branding" eyebrow="Landlord-specific CSS variables and receipt headers">
      <form className="grid two" onSubmit={save}>
        <div className="form-grid">
          {["primaryColor", "secondaryColor", "accentColor", "sidebarColor", "headerColor", "backgroundColor", "textColor"].map((key) => <label key={key}>{key}<input name={key} type="color" defaultValue={theme[key]} /></label>)}
          <label>Business name<input name="businessName" defaultValue={theme.businessName} /></label>
          <label>Receipt header<input name="receiptHeader" defaultValue={theme.receiptHeader} /></label>
          <label>Billing header<input name="billingStatementHeader" defaultValue={theme.billingStatementHeader} /></label>
          <button className="primary-btn"><Save size={16} /> Save theme</button>
        </div>
        <article className="theme-preview" style={{ "--preview-primary": theme.primaryColor, "--preview-sidebar": theme.sidebarColor } as any}>
          <aside>Rivera Homes</aside>
          <section><h3>Billing Statement</h3><p>{theme.billingStatementHeader}</p><button>Primary action</button></section>
        </article>
      </form>
    </Page>
  );
}
