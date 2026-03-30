import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import ChatBot from './components/chatbot/ChatBot';

// Pages
import LandingPage from './pages/landing/LandingPage';
import AuthPage from './pages/auth/AuthPage';
import DashboardPage from './pages/admin/DashboardPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import InventoryPage from './pages/admin/InventoryPage';
import CustomersPage from './pages/admin/CustomersPage';
import SalesPage from './pages/admin/SalesPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import StorePage from './pages/store/StorePage';
import CartPage from './pages/customer/CartPage';
import OrdersPage from './pages/customer/OrdersPage';
import WishlistPage from './pages/customer/WishlistPage';
import CheckoutSuccessPage from './pages/checkout/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/checkout/CheckoutCancelPage';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (handles OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Checkout Routes */}
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={
          <AdminRoute><DashboardPage /></AdminRoute>
        } />
        <Route path="/analytics" element={
          <AdminRoute><AnalyticsPage /></AdminRoute>
        } />
        <Route path="/admin/inventory" element={
          <AdminRoute><InventoryPage /></AdminRoute>
        } />
        <Route path="/admin/customers" element={
          <AdminRoute><CustomersPage /></AdminRoute>
        } />
        <Route path="/admin/sales" element={
          <AdminRoute><SalesPage /></AdminRoute>
        } />
        <Route path="/admin/suppliers" element={
          <AdminRoute><SuppliersPage /></AdminRoute>
        } />

        {/* Customer Routes */}
        <Route path="/store" element={
          <ProtectedRoute><StorePage /></ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute><CartPage /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute><OrdersPage /></ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute><WishlistPage /></ProtectedRoute>
        } />
      </Routes>
      
      {/* Global ChatBot */}
      <ChatBot />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ConfigProvider>
            <AppRouter />
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#f8fafc',
                },
              }}
            />
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
