import AppRoutes from "./routes/AppRoutes.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { GlobalLanguageProvider } from "./context/GlobalLanguageContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import SupportWidget from "./components/SupportWidget.jsx";
import { Toaster, toast, useToasterStore } from "react-hot-toast";
import ServerHealthGuard from "./components/ServerHealthGuard.jsx";
import { useEffect } from "react";


// --- Toast Limiter Component (Max 4) ---
function ToastManager() {
  const { toasts } = useToasterStore();
  
  useEffect(() => {
    const visibleToasts = toasts.filter((t) => t.visible);
    if (visibleToasts.length > 4) {
      // Dismiss the oldest toasts keeping only the latest 4
      const toastsToDismiss = visibleToasts.slice(4);
      toastsToDismiss.forEach((t) => toast.dismiss(t.id));
    }
  }, [toasts]);
  
  return null;
}

export default function App() {
  return (
    <GlobalLanguageProvider>
      <ServerHealthGuard>
        <SiteSettingsProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  className: "glass-toast",
                  error: { className: "glass-toast glass-toast-error" },
                  ariaProps: { role: "alert", "aria-live": "assertive" },
                }}
              />
              <ToastManager />
              <SupportWidget />
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </ServerHealthGuard>
    </GlobalLanguageProvider>
  );
}
