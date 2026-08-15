import { Bell, Building2, ChevronLeft, Command, FileBarChart, Gauge, LayoutDashboard, LogOut, Moon, Plus, Search, Settings, Shield, Sparkles, Sun, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation } from "react-router-dom";

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">BH</div>
            <div>
              <strong>BoardHaus</strong>
              <span>Rivera Homes</span>
            </div>
          </div>
          <button className="collapse-btn" title="Collapse sidebar"><ChevronLeft size={16} /></button>
        </div>
        <div className="sidebar-command">
          <Search size={15} />
          <span>Search</span>
          <kbd>Ctrl K</kbd>
        </div>
        <nav>
          <p>Landlord Workspace</p>
          {landlordNav.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <p>Super Admin</p>
          {adminNav.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">MR</div>
          <div>
            <strong>Mara Rivera</strong>
            <span>Growth plan</span>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="crumb">Workspace / Rivera Homes</span>
            <h1>Boarding House Monitoring</h1>
          </div>
          <label className="global-search">
            <Search size={16} />
            <input placeholder="Search tenants, units, receipts..." />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="top-actions">
            <button className="quick-add" title="Quick add"><Plus size={18} /><span>New</span></button>
            <button title="Theme"><Sun size={16} /><Moon size={16} /></button>
            <button title="Notifications"><Bell size={18} /></button>
            <button title="Product updates"><Sparkles size={18} /></button>
            <button title="Logout"><LogOut size={18} /></button>
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
