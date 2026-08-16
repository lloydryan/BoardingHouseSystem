import { ArrowLeft, Home, LogIn, SearchX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser, homeForRole } from "../../contexts/AuthContext";

export function NotFound() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const homePath = user ? homeForRole(user.role) : "/login";

  return (
    <main className="not-found-page">
      <section className="not-found-shell">
        <div className="not-found-visual" aria-hidden="true">
          <SearchX size={46} />
          <span>404</span>
        </div>
        <div className="not-found-copy">
          <span className="eyebrow">Route not found</span>
          <h1>This page is outside the workspace.</h1>
          <p>The address may have changed, or the workspace does not include a page at this URL.</p>
          <div className="not-found-actions">
            <button onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
            <Link className="primary-btn" to={homePath}>{user ? <Home size={16} /> : <LogIn size={16} />} {user ? "Workspace" : "Sign in"}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

