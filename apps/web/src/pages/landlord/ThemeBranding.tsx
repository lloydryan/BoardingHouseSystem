import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Page } from "../../components/ui";

export function ThemeBranding() {
  const [theme, setTheme] = useState<any>();
  useEffect(() => { api<any>("/api/theme").then(setTheme); }, []);
  if (!theme) return <Page title="Theme and Branding">Loading theme...</Page>;
  return (
    <Page title="Theme and Branding" eyebrow="Landlord-specific CSS variables and receipt headers" actions={<button className="primary-btn"><Save size={16} /> Save theme</button>}>
      <div className="grid two">
        <div className="form-grid">
          {["primaryColor", "secondaryColor", "accentColor", "sidebarColor", "headerColor", "backgroundColor", "textColor"].map((key) => <label key={key}>{key}<input type="color" defaultValue={theme[key]} /></label>)}
          <label>Business name<input defaultValue={theme.businessName} /></label>
          <label>Receipt header<input defaultValue={theme.receiptHeader} /></label>
          <label>Billing header<input defaultValue={theme.billingStatementHeader} /></label>
        </div>
        <article className="theme-preview" style={{ "--preview-primary": theme.primaryColor, "--preview-sidebar": theme.sidebarColor } as any}>
          <aside>Rivera Homes</aside>
          <section><h3>Billing Statement</h3><p>{theme.billingStatementHeader}</p><button>Primary action</button></section>
        </article>
      </div>
    </Page>
  );
}
