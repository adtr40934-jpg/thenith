import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import {
  AdminAuthProvider,
  useAdminAuth,
} from "../context/AdminAuthContext.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminLogin from "../pages/AdminLogin.jsx";
import Overview from "../pages/Overview.jsx";
import UsersManager from "../pages/UsersManager.jsx";
import SubscriptionsManager from "../pages/SubscriptionsManager.jsx";
import SubscriptionAnalytics from "../pages/SubscriptionAnalytics.jsx";
import StoreManager from "../pages/StoreManager.jsx";
import CouponsManager from "../pages/CouponsManager.jsx";
import InboxManager from "../pages/InboxManager.jsx";
import SupportDesk from "../pages/SupportDesk.jsx";
import Settings from "../pages/Settings.jsx";
import SecurityAudit from "../pages/SecurityAudit.jsx";
import PushNotifications from "../pages/PushNotifications.jsx";
function DashboardRoutesContent() {
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    document.title = isAuthenticated
      ? "Thenith | Admin"
      : "Thenith | Admin Login";
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="users" element={<UsersManager />} />
        <Route path="subscriptions" element={<SubscriptionsManager />} />
        <Route path="subscriptions-stats" element={<SubscriptionAnalytics />} />
        <Route path="store" element={<StoreManager />} />
        <Route path="coupons" element={<CouponsManager />} />
        <Route path="inbox" element={<InboxManager />} />
        <Route path="support" element={<SupportDesk />} />
        <Route path="push-notifications" element={<PushNotifications />} />
        <Route path="security" element={<SecurityAudit />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function DashboardRoutes() {
  return (
    <AdminAuthProvider>
      <DashboardRoutesContent />
    </AdminAuthProvider>
  );
}
