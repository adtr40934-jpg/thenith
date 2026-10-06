import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

const PanelRoot = lazy(() => import("../panel/PanelRoot.jsx"));
const ProfileRoot = lazy(() => import("../profile/ProfileRoot.jsx"));
const LandingPage = lazy(() => import("../pages/LandingPage.jsx"));
const ProductsPage = lazy(() => import("../pages/store/ProductsPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/store/ProductDetailsPage.jsx"));
const CartPage = lazy(() => import("../pages/store/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../pages/store/CheckoutPage.jsx"));
const SuggestFeature = lazy(() => import("../pages/SuggestFeature.jsx"));
const PricingPage = lazy(() => import("../pages/PricingPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const PaymentPage = lazy(() => import("../pages/PaymentPage.jsx"));
const PaymentResultPage = lazy(() => import("../pages/PaymentResultPage.jsx"));
import MainNavbar from "../components/MainNavbar.jsx";

import ProtectedRoute from "./guards/ProtectedRoute.jsx";
import GuestRoute from "./guards/GuestRoute.jsx";

import { useAuth } from "../context/AuthContext.jsx";
import { LanguageProvider as ProfileLanguageProvider } from "../profile/lib/LanguageContext.jsx";
import { PortfolioProvider } from "../profile/lib/PortfolioContext.jsx";

export default function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const isProfileRoute = location.pathname.startsWith("/p/");
  
  if (isInitializing && !isProfileRoute) {
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
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200"><span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>}>
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
                <Suspense fallback={<div className="flex h-screen items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>}>
                  <ProfileRoot />
                </Suspense>
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
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage code="routeNotFound" />} />
        </Routes>
      </Suspense>
    </>
  );
}
