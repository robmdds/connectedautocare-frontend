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
        setIsChecking(false);
        return;
      }

      // If we reach here and isAuthenticated is false after loading is done,
      // it means the token verification failed
      if (!loading && !isAuthenticated) {
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

// Enhanced Public Route Component with Reseller-specific redirect
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
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

  // If authenticated, redirect based on user role and return URL
  if (isAuthenticated) {
    const urlParams = new URLSearchParams(location.search);
    const returnUrl = urlParams.get('returnUrl');
    
    // If there's a specific return URL, use it
    if (returnUrl) {
      return <Navigate to={returnUrl} replace />;
    }
    
    // Default redirects based on user role
    let defaultRedirect = '/dashboard'; // Default for most users
    
    if (user?.role === 'wholesale_reseller') {
      defaultRedirect = '/quote'; // Resellers go to quote page
    } else if (user?.role === 'customer') {
      defaultRedirect = '/dashboard'; // Customers go to dashboard
    } else if (user?.role === 'admin') {
      defaultRedirect = '/dashboard'; // Admins go to dashboard
    }
    
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

// Token Expiration Handler Component
const TokenExpirationHandler = ({ children }) => {
  const { logout } = useAuth();

  useEffect(() => {
    const handleTokenExpiration = (event) => {
      if (event.detail && event.detail.message === 'Token expired') {
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