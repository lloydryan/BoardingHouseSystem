import { Save } from "lucide-react";
import { Page } from "../../components/ui";

export function AccountSettings() {
  return (
    <Page title="Account Settings" eyebrow="Profile, password, notification, and workspace preferences" actions={<button className="primary-btn"><Save size={16} /> Save changes</button>}>
      <div className="form-grid">
        <label>Full name<input defaultValue="Mara Rivera" /></label>
        <label>Business name<input defaultValue="Rivera Homes" /></label>
        <label>Email<input defaultValue="rivera@boarding.test" /></label>
        <label>Contact number<input defaultValue="+63 917 100 2000" /></label>
        <label>Current password<input type="password" /></label>
        <label>New password<input type="password" /></label>
      </div>
    </Page>
  );
}
