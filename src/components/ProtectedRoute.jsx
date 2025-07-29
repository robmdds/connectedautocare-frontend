import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../management/lib/auth';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const validateAccess = () => {
      setIsChecking(true);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, will redirect to login');
        setIsChecking(false);
        return;
      }

      // If we reach here and isAuthenticated is false after loading is done,
      // it means the token verification failed
      if (!loading && !isAuthenticated) {
        console.log('Token verification failed, logging out');
        logout();
      }

      setIsChecking(false);
    };

    // Only run validation after the auth provider has finished loading
    if (!loading) {
      validateAccess();
    }
  }, [isAuthenticated, loading, logout, location.pathname]);

  // Show loading spinner while auth provider is loading or we're checking
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!isAuthenticated) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return children;
};

// Enhanced Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard or the return URL
  if (isAuthenticated) {
    const urlParams = new URLSearchParams(location.search);
    const returnUrl = urlParams.get('returnUrl') || '/dashboard';
    return <Navigate to={returnUrl} replace />;
  }

  return children;
};

// Token Expiration Handler Component
const TokenExpirationHandler = ({ children }) => {
  const { logout } = useAuth();

  useEffect(() => {
    const handleTokenExpiration = (event) => {
      if (event.detail && event.detail.message === 'Token expired') {
        console.log('Token expired event received, logging out');
        logout();
      }
    };

    // Listen for custom token expiration events
    window.addEventListener('tokenExpired', handleTokenExpiration);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiration);
    };
  }, [logout]);

  return children;
};

export { ProtectedRoute, PublicRoute, TokenExpirationHandler };