import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './locales/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { StorePage } from './pages/StorePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { AuthPages } from './pages/AuthPages';
import { SellerApplyPage } from './pages/SellerApplyPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

import { ensureDefaultCategoriesAndSettings } from './services/adminService';
import { seedInitialMarketplaceData } from './services/seedService';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);

  // Initial platform bootstrap on boot
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await ensureDefaultCategoriesAndSettings();
        await seedInitialMarketplaceData();
      } catch (e) {
        console.warn('Initial platform bootstrap note:', e);
      }
    };
    bootstrap();
  }, []);

  // Handle URL hash changes or direct routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      const [route, param] = hash.split('/');
      if (route) {
        setCurrentRoute(route);
        setRouteParam(param);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (route: string, param?: string) => {
    setCurrentRoute(route);
    setRouteParam(param);
    if (param) {
      window.location.hash = `${route}/${param}`;
    } else {
      window.location.hash = route;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navigation Header */}
            <Navbar onNavigate={handleNavigate} currentRoute={currentRoute} />

            {/* Main Application Content */}
            <main className="flex-1">
              {currentRoute === 'home' && (
                <HomePage onNavigate={handleNavigate} />
              )}

              {currentRoute === 'products' && (
                <ProductsPage
                  onNavigate={handleNavigate}
                  initialSearch={routeParam}
                />
              )}

              {currentRoute === 'product-detail' && routeParam && (
                <ProductDetailPage
                  productId={routeParam}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'store' && routeParam && (
                <StorePage
                  storeId={routeParam}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'cart' && (
                <CartPage onNavigate={handleNavigate} />
              )}

              {currentRoute === 'checkout' && (
                <CheckoutPage onNavigate={handleNavigate} />
              )}

              {currentRoute === 'order-confirmation' && routeParam && (
                <OrderConfirmationPage
                  orderId={routeParam}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'account' && (
                <AccountPage onNavigate={handleNavigate} />
              )}

              {currentRoute === 'login' && (
                <AuthPages initialMode="login" onNavigate={handleNavigate} />
              )}

              {currentRoute === 'register' && (
                <AuthPages initialMode="register" onNavigate={handleNavigate} />
              )}

              {currentRoute === 'forgot' && (
                <AuthPages initialMode="forgot" onNavigate={handleNavigate} />
              )}

              {currentRoute === 'seller-apply' && (
                <SellerApplyPage onNavigate={handleNavigate} />
              )}

              {currentRoute === 'seller-dashboard' && (
                <SellerDashboard onNavigate={handleNavigate} />
              )}

              {currentRoute === 'admin' && (
                <AdminDashboard onNavigate={handleNavigate} />
              )}
            </main>

            {/* Trustworthy Footer */}
            <Footer onNavigate={handleNavigate} />
          </div>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
