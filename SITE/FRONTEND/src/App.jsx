import AppRoutes from "./routes/AppRoutes.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { GlobalLanguageProvider } from "./context/GlobalLanguageContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import SupportWidget from "./components/SupportWidget.jsx";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <GlobalLanguageProvider>
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
            <SupportWidget />
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </GlobalLanguageProvider>
  );
}
