import { Route, Routes } from "react-router-dom";
import { ToastHost } from "../components/ToastHost";
import { ProtectedRoute, RoleRedirect } from "../contexts/AuthContext";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminLandlords } from "../pages/admin/AdminLandlords";
import { AdminSettings } from "../pages/admin/AdminSettings";
import { Billing } from "../pages/landlord/Billing";
import { Dashboard } from "../pages/landlord/Dashboard";
import { Electricity } from "../pages/landlord/Electricity";
import { Leases } from "../pages/landlord/Leases";
import { Notifications } from "../pages/landlord/Notifications";
import { Payments } from "../pages/landlord/Payments";
import { Properties } from "../pages/landlord/Properties";
import { PropertyBuildingPage } from "../pages/landlord/PropertyBuildingPage";
import { PropertyDetails } from "../pages/landlord/PropertyDetails";
import { Reports } from "../pages/landlord/Reports";
import { Tenants } from "../pages/landlord/Tenants";
import { ThemeBranding } from "../pages/landlord/ThemeBranding";
import { UnitWorkspacePage } from "../pages/landlord/UnitWorkspacePage";
import { Units } from "../pages/landlord/Units";
import { Water } from "../pages/landlord/Water";
import { AccountSettings } from "../pages/landlord/AccountSettings";
import { Login } from "../pages/public/Login";
import { NotFound } from "../pages/public/NotFound";
import { AuditLogs } from "../pages/shared/AuditLogs";
import { AppLayout } from "./AppLayout";

export function AppRoutes() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RoleRedirect />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route element={<ProtectedRoute roles={["SUPER_ADMIN"]} />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/landlords" element={<AdminLandlords />} />
            <Route path="admin/audit-logs" element={<AuditLogs />} />
            <Route path="admin/settings" element={<AdminSettings />} />
          </Route>
          <Route element={<ProtectedRoute roles={["LANDLORD"]} />}>
            <Route path="landlord/dashboard" element={<Dashboard />} />
            <Route path="landlord/properties" element={<Properties />} />
            <Route path="landlord/properties/:id" element={<PropertyDetails />} />
            <Route path="landlord/properties/:propertyId/building" element={<PropertyBuildingPage />} />
            <Route path="landlord/properties/:propertyId/floors/:floorId/units/:unitId" element={<UnitWorkspacePage />} />
            <Route path="landlord/units" element={<Units />} />
            <Route path="landlord/tenants" element={<Tenants />} />
            <Route path="landlord/leases" element={<Leases />} />
            <Route path="landlord/billing" element={<Billing />} />
            <Route path="landlord/electricity" element={<Electricity />} />
            <Route path="landlord/water" element={<Water />} />
            <Route path="landlord/payments" element={<Payments />} />
            <Route path="landlord/reports" element={<Reports />} />
            <Route path="landlord/notifications" element={<Notifications />} />
            <Route path="landlord/theme" element={<ThemeBranding />} />
            <Route path="landlord/account" element={<AccountSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
