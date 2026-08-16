import { Building2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { clearSession, getStoredUser, homeForRole } from "../../lib/auth";
import { firebaseAuth } from "../../lib/firebase";

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (user && localStorage.getItem("bh_access_token")) navigate(homeForRole(user.role), { replace: true });
  }, [navigate]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    clearSession();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    signInWithEmailAndPassword(firebaseAuth, email, password)
      .then(async ({ user: firebaseUser }) => {
        const accessToken = await firebaseUser.getIdToken();
        localStorage.setItem("bh_access_token", accessToken);
        const { user, landlord } = await api<{ user: any; landlord?: any }>("/api/auth/me");
        localStorage.setItem("bh_user", JSON.stringify(user));
        if (landlord) localStorage.setItem("bh_landlord", JSON.stringify(landlord));
        navigate(homeForRole(user.role));
      })
      .catch(() => setError("Invalid email or password."));
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <div className="brand-mark large">BH</div>
        <h1>BoardHaus</h1>
        <p>Secure SaaS workspace for boarding-house rental operations.</p>
        <label>Email</label>
        <input name="email" defaultValue="rivera@boarding.test" />
        <label>Password</label>
        <input name="password" defaultValue="password123" type="password" />
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-btn"><Building2 size={18} /> Sign in</button>
        <span>Demo admin: admin@boarding.test / admin123</span>
      </form>
    </main>
  );
}
