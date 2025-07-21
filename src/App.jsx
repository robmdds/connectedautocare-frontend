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
import Dashboard from './management/pages/Dashboard';
import Analytics from './management/pages/Analytics';
import ProductManagement from './management/pages/ProductManagement';
import ContractManagement from './management/pages/ContractManagement';

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

// Dashboard Container Component
const DashboardContainer = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'products':
        return <ProductManagement />;
      case 'contracts':
        return <ContractManagement />;
      case 'users':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">User Management</h2>
            <p className="text-muted-foreground">User management interface coming soon...</p>
          </div>
        );
      case 'customers':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Customer Management</h2>
            <p className="text-muted-foreground">Customer management interface coming soon...</p>
          </div>
        );
      case 'policies':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">My Policies</h2>
            <p className="text-muted-foreground">Policy management interface coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Settings interface coming soon...</p>
          </div>
        );
      case 'profile':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Profile</h2>
            <p className="text-muted-foreground">Profile management interface coming soon...</p>
          </div>
        );
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