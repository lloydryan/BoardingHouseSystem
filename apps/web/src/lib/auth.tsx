import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "./api";

export type Role = "SUPER_ADMIN" | "LANDLORD";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  landlordId?: string;
};

export function getStoredUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem("bh_user") ?? "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("bh_access_token");
  localStorage.removeItem("bh_user");
  localStorage.removeItem("bh_landlord");
}

export function homeForRole(role?: Role) {
  return role === "SUPER_ADMIN" ? "/admin/dashboard" : "/landlord/dashboard";
}

export function RoleRedirect() {
  const location = useLocation();
  const user = getStoredUser();
  const token = localStorage.getItem("bh_access_token");

  if (!user || !token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [checking, setChecking] = useState(Boolean(localStorage.getItem("bh_access_token")));
  const token = localStorage.getItem("bh_access_token");

  useEffect(() => {
    let alive = true;
    const expire = () => {
      if (alive) setUser(null);
    };

    window.addEventListener("bh:session-expired", expire);
    if (!token) {
      setChecking(false);
      return () => window.removeEventListener("bh:session-expired", expire);
    }

    api<{ user: AuthUser; landlord?: unknown }>("/api/auth/me")
      .then(({ user: freshUser, landlord }) => {
        if (!alive) return;
        localStorage.setItem("bh_user", JSON.stringify(freshUser));
        if (landlord) localStorage.setItem("bh_landlord", JSON.stringify(landlord));
        setUser(freshUser);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setChecking(false);
      });

    return () => {
      alive = false;
      window.removeEventListener("bh:session-expired", expire);
    };
  }, [token]);

  if (checking) return <div className="route-loading" />;
  if (!user || !token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;

  return <Outlet />;
}
