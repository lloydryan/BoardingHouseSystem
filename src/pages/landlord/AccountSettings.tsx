import { Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { Page } from "../../components/ui";
import { apiPatch } from "../../services/apiService";
import { toast } from "../../services/toastService";

export function AccountSettings() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("bh_user") ?? "null"));
  const [landlord, setLandlord] = useState(() => JSON.parse(localStorage.getItem("bh_landlord") ?? "null"));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apiPatch<{ user: any; landlord?: any }>("/api/account", Object.fromEntries(new FormData(event.currentTarget))).then((next) => {
      localStorage.setItem("bh_user", JSON.stringify(next.user));
      if (next.landlord) localStorage.setItem("bh_landlord", JSON.stringify(next.landlord));
      setUser(next.user);
      setLandlord(next.landlord);
      toast("Account saved.", "success");
    }).catch((error) => toast(error.message, "error"));
  }

  return (
    <Page title="Account Settings" eyebrow="Profile, password, notification, and workspace preferences">
      <form className="form-grid" onSubmit={save}>
        <label>Full name<input name="fullName" defaultValue={user?.fullName ?? ""} /></label>
        <label>Business name<input name="businessName" defaultValue={landlord?.businessName ?? ""} /></label>
        <label>Email<input name="email" defaultValue={user?.email ?? ""} /></label>
        <label>Contact number<input name="contactNumber" defaultValue={landlord?.contactNumber ?? ""} /></label>
        <label>Current password<input type="password" /></label>
        <label>New password<input type="password" /></label>
        <button className="primary-btn"><Save size={16} /> Save changes</button>
      </form>
    </Page>
  );
}


