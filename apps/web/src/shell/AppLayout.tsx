import { Bell, Building2, ChevronLeft, FileBarChart, Gauge, LayoutDashboard, LogOut, Moon, Plus, Search, Settings, Shield, Sparkles, Sun, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser } from "../lib/auth";
import { toast } from "../lib/toast";

const landlordNav = [
  ["Dashboard", "/landlord/dashboard", LayoutDashboard],
  ["Properties", "/landlord/properties", Building2],
  ["Reports", "/landlord/reports", FileBarChart],
  ["Notifications", "/landlord/notifications", Bell],
  ["Theme", "/landlord/theme", Moon],
  ["Account", "/landlord/account", Settings]
] as const;

const adminNav = [
  ["Admin", "/admin/dashboard", Shield],
  ["Landlords", "/admin/landlords", Users],
  ["Audit Logs", "/admin/audit-logs", Gauge],
  ["Settings", "/admin/settings", Settings]
] as const;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const landlord = JSON.parse(localStorage.getItem("bh_landlord") ?? "null");
  const isAdmin = user?.role === "SUPER_ADMIN";
  const nav = isAdmin ? adminNav : landlordNav;
  const workspaceLabel = isAdmin ? "Platform Administration" : "Landlord Workspace";
  const businessLabel = isAdmin ? "Super Admin" : landlord?.businessName ?? "Landlord";
  const initials = user?.fullName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "BH";

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  function goQuickAdd() {
    navigate(isAdmin ? "/admin/landlords" : "/landlord/properties");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">BH</div>
            <div>
              <strong>BoardHaus</strong>
              <span>{businessLabel}</span>
            </div>
          </div>
          <button className="collapse-btn" title="Collapse sidebar" onClick={() => toast("Sidebar collapse is coming next.", "info")}><ChevronLeft size={16} /></button>
        </div>
        <div className="sidebar-command">
          <Search size={15} />
          <span>Search</span>
          <kbd>Ctrl K</kbd>
        </div>
        <nav>
          <p>{workspaceLabel}</p>
          {nav.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user?.fullName ?? "Guest"}</strong>
            <span>{isAdmin ? "Platform access" : "Landlord access"}</span>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="crumb">{workspaceLabel} / {businessLabel}</span>
            <h1>{isAdmin ? "Platform Control Center" : "Boarding House Monitoring"}</h1>
          </div>
          <label className="global-search">
            <Search size={16} />
            <input placeholder="Search tenants, units, receipts..." />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="top-actions">
            <button className="quick-add" title="Quick add" onClick={goQuickAdd}><Plus size={18} /><span>New</span></button>
            <button title="Theme" onClick={() => navigate(isAdmin ? "/admin/settings" : "/landlord/theme")}><Sun size={16} /><Moon size={16} /></button>
            <button title="Notifications" onClick={() => navigate(isAdmin ? "/admin/audit-logs" : "/landlord/notifications")}><Bell size={18} /></button>
            <button title="Product updates" onClick={() => toast("BoardHaus is up to date.", "success")}><Sparkles size={18} /></button>
            <button title="Logout" onClick={logout}><LogOut size={18} /></button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="route-motion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
