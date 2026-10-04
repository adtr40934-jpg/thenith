import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./components/Dashboard.jsx";
import Auth from "./components/auth/Auth.jsx";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage.jsx";
import { ThemeProvider } from "./hooks/useTheme.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteAccount } from "./services/authApi.js";
import toast from "react-hot-toast";
import { getLocalizedErrorMessage } from "../utils/errorHandling.js";

function AppContent({ forceMode }) {
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isAuthenticated,
    user,
    isInitializing,
    handleLogin: authLogin,
    handleLogout: authLogout,
    refreshSession,
  } = useAuth();

  useEffect(() => {
    // Prevent iframe embedding
    if (window.top !== window) {
      window.top.location.href = window.location.href;
      return;
    }

    const path = location.pathname;
    if (isAuthenticated && user?.publicId) {
      if (path === "/u" || path === "/u/") {
        navigate(`/u/${user.publicId}${location.search || ""}`, {
          replace: true,
        });
      }
    }
  }, [
    isAuthenticated,
    user?.publicId,
    location.pathname,
    location.search,
    navigate,
  ]);

  // ─── Called by Auth component after successful login ─────────────────────
  const handleLogin = (userData) => {
    authLogin(userData);
    const publicId = userData?.publicId;
    const from = location.state?.from?.pathname;

    const searchParams = new URLSearchParams(location.search);
    const rawReturnTo = searchParams.get("returnTo");
    const isSafeReturnTo =
      rawReturnTo &&
      rawReturnTo.startsWith("/") &&
      !rawReturnTo.startsWith("//") &&
      !rawReturnTo.includes(":");

    if (from && from.startsWith("/u/")) {
      navigate(from, { replace: true });
    } else if (isSafeReturnTo) {
      navigate(rawReturnTo, { replace: true });
    } else if (publicId) {
      navigate(`/u/${publicId}${location.search || ""}`, { replace: true });
    } else {
      refreshSession().then((session) => {
        if (session?.user?.publicId) {
          navigate(`/u/${session.user.publicId}`, { replace: true });
        }
      });
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate("/", { replace: true });
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      await authLogout();
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getLocalizedErrorMessage(error, language));
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (isInitializing) {
    return <LoadingScreen label={t("loading")} />;
  }

  return (
    <ConfirmProvider>
      {!isAuthenticated ? (
        <Auth
          t={t}
          language={language}
          onLogin={handleLogin}
          forceMode={forceMode}
        />
      ) : (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </ConfirmProvider>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm font-bold">{label}</p>
      </div>
    </div>
  );
}

export default function App({ forceMode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent forceMode={forceMode} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
