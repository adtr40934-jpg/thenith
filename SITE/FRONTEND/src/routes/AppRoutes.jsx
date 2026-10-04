import { Routes, Route } from "react-router-dom";
import PanelRoot from "../panel/PanelRoot.jsx";
import ProfileRoot from "../profile/ProfileRoot.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import { LanguageProvider as ProfileLanguageProvider } from "../profile/lib/LanguageContext.jsx";
import { PortfolioProvider } from "../profile/lib/PortfolioContext.jsx";
import ProductsPage from "../pages/store/ProductsPage.jsx";
import ProductDetailsPage from "../pages/store/ProductDetailsPage.jsx";
import CartPage from "../pages/store/CartPage.jsx";
import CheckoutPage from "../pages/store/CheckoutPage.jsx";
import SuggestFeature from "../pages/SuggestFeature.jsx";
import PricingPage from "../pages/PricingPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import MainNavbar from "../components/MainNavbar.jsx";
import PaymentPage from "../pages/PaymentPage.jsx";
import PaymentResultPage from "../pages/PaymentResultPage.jsx";

import ProtectedRoute from "./guards/ProtectedRoute.jsx";
import GuestRoute from "./guards/GuestRoute.jsx";

import { useAuth } from "../context/AuthContext.jsx";

export default function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuth();
  
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-bold">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated && <MainNavbar />}
      <Routes>
        <Route
          path="/u/*"
          element={
            <ProtectedRoute>
              <PanelRoot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <PanelRoot forceMode="LOGIN" />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <PanelRoot forceMode="REGISTER" />
            </GuestRoute>
          }
        />

        <Route
          path="/p/*"
          element={
            <ProfileLanguageProvider>
              <PortfolioProvider>
                <ProfileRoot />
              </PortfolioProvider>
            </ProfileLanguageProvider>
          }
        />

        <Route path="/products" element={<GuestRoute><ProductsPage /></GuestRoute>} />
        <Route path="/products/:id" element={<GuestRoute><ProductDetailsPage /></GuestRoute>} />
        <Route path="/pricing" element={<GuestRoute><PricingPage /></GuestRoute>} />
        <Route path="/cart" element={<GuestRoute><CartPage /></GuestRoute>} />
        <Route path="/checkout" element={<GuestRoute><CheckoutPage /></GuestRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="/payment/fail" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="/payment/pending" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="/suggest" element={<GuestRoute><SuggestFeature /></GuestRoute>} />
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="*" element={<NotFoundPage code="routeNotFound" />} />
      </Routes>
    </>
  );
}
