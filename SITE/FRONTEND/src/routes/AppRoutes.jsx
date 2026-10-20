import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";

const PanelRoot = lazy(() => import("../panel/PanelRoot.jsx"));
const ProfileRoot = lazy(() => import("../profile/ProfileRoot.jsx"));
const ProductsPage = lazy(() => import("../pages/store/ProductsPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/store/ProductDetailsPage.jsx"));
const CustomCardPage = lazy(() => import("../pages/store/CustomCardPage.jsx"));
const CartPage = lazy(() => import("../pages/store/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../pages/store/CheckoutPage.jsx"));
const SuggestFeature = lazy(() => import("../pages/SuggestFeature.jsx"));
const PricingPage = lazy(() => import("../pages/PricingPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const PaymentPage = lazy(() => import("../pages/PaymentPage.jsx"));
const PaymentResultPage = lazy(() => import("../pages/PaymentResultPage.jsx"));
import PublicCardResolverPage from "../pages/PublicCardResolverPage.jsx";
import MainNavbar from "../components/MainNavbar.jsx";

import ProtectedRoute from "./guards/ProtectedRoute.jsx";
import GuestRoute from "./guards/GuestRoute.jsx";

import { useAuth } from "../context/AuthContext.jsx";
import { LanguageProvider as ProfileLanguageProvider } from "../profile/lib/LanguageContext.jsx";
import { PortfolioProvider } from "../profile/lib/PortfolioContext.jsx";

export default function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuth();

  return (
    <>
      {!isInitializing && !isAuthenticated && <MainNavbar />}
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
            path="/panel/*"
            element={
              <ProtectedRoute>
                <PanelRoot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/panel"
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

          {/* Static Smart Card URL Resolver: https://thenith.com/c/{publicId} */}
          <Route path="/c/:publicId" element={<PublicCardResolverPage />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/custom-card" element={<CustomCardPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
          <Route path="/payment/fail" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
          <Route path="/payment/pending" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
          <Route path="/suggest" element={<SuggestFeature />} />
          <Route
            path="/"
            element={
              <GuestRoute>
                <LandingPage />
              </GuestRoute>
            }
          />
          <Route path="*" element={<NotFoundPage code="routeNotFound" />} />
        </Routes>
      </Suspense>
    </>
  );
}
