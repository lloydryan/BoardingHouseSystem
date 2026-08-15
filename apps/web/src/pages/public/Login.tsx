import { Building2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/api";

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    apiPost<{ accessToken: string; user: any }>("/api/auth/login", Object.fromEntries(form))
      .then(({ accessToken, user }) => {
        localStorage.setItem("bh_access_token", accessToken);
        localStorage.setItem("bh_user", JSON.stringify(user));
        navigate(user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/landlord/dashboard");
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
