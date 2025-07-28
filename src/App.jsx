import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './management/lib/auth';
import './index.css';

// Main website components
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HeroProductsPage from './pages/HeroProductsPage';
import VSCPage from './pages/VSCPage';
import QuotePage from './pages/QuotePage';
import AboutPage from './pages/AboutPage';

// Management interface components
import LoginPage from './management/components/LoginPage';
import DashboardLayout from './management/components/DashboardLayout';

// Import all management pages
import Dashboard from './management/pages/Dashboard';
import Analytics from './management/pages/Analytics';
import ProductManagement from './management/pages/ProductManagement';
import ContractManagement from './management/pages/ContractManagement';
import TPAManagement from './management/pages/TPAManagement';
import VideoManagement from './management/pages/VideoManagement';
import SettingsManagement from './management/pages/SettingsManagement';
import UserManagement from './management/pages/UserManagement';
import CustomerManagement from './management/pages/CustomerManagement';
import PolicyManagement from './management/pages/PolicyManagement';
import ProfileManagement from './management/pages/ProfileManagement';
import Contact from './pages/ContactPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Unauthorized Access Component
const UnauthorizedAccess = ({ requiredRole }) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          You don't have permission to access this page. This section requires {requiredRole} privileges.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Your current role: <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Container Component
const DashboardContainer = () => {
  const { user, isAdmin, isReseller, isCustomer } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      
      // Analytics (Admin & Reseller)
      case 'analytics':
        if (!isAdmin && !isReseller) {
          return <UnauthorizedAccess requiredRole="Admin or Reseller" />;
        }
        return <Analytics />;
      
      // Admin-only pages
      case 'users':
        if (!isAdmin) {
          return <UnauthorizedAccess requiredRole="Administrator" />;
        }
        return <UserManagement />;
      
      case 'products':
        if (!isAdmin && !isReseller) {
          return <UnauthorizedAccess requiredRole="Admin or Reseller" />;
        }
        return <ProductManagement />;
      
      case 'tpas':
        if (!isAdmin) {
          return <UnauthorizedAccess requiredRole="Administrator" />;
        }
        return <TPAManagement />;
      
      case 'contracts':
        if (!isAdmin && !isReseller) {
          return <UnauthorizedAccess requiredRole="Admin or Reseller" />;
        }
        return <ContractManagement />;
      
      case 'video':
        if (!isAdmin) {
          return <UnauthorizedAccess requiredRole="Administrator" />;
        }
        return <VideoManagement />;
      
      case 'settings':
        if (!isAdmin) {
          return <UnauthorizedAccess requiredRole="Administrator" />;
        }
        return <SettingsManagement />;
      
      // Reseller pages
      case 'customers':
        if (!isAdmin && !isReseller) {
          return <UnauthorizedAccess requiredRole="Admin or Reseller" />;
        }
        return <CustomerManagement />;
      
      // Customer pages
      case 'policies':
        if (!isCustomer && !isAdmin) {
          return <UnauthorizedAccess requiredRole="Customer" />;
        }
        return <PolicyManagement />;
      
      // Common pages
      case 'profile':
        return <ProfileManagement />;
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </DashboardLayout>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes (main website) */}
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <main className="flex-1">
                    <HomePage />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/hero-products"
              element={
                <>
                  <Header />
                  <main className="flex-1">
                    <HeroProductsPage />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/vsc"
              element={
                <>
                  <Header />
                  <main className="flex-1">
                    <VSCPage />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/quote"
              element={
                <>
                  <Header />
                  <main className="flex-1">
                    <QuotePage />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/about"
              element={
                <>
                  <Header />
                  <main className="flex-1">
                    <AboutPage />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/contact"
              element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Contact />
                  </main>
                  <Footer />
                </>
              }
            />
            

            {/* Public route (management interface) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected routes (management interface) */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardContainer />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;