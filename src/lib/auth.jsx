import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user || data.data);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      // Always use /api/auth/login, as demo credentials use email for all roles
      const endpoint = '/api/auth/login';
      const body = { email: usernameOrEmail, password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && (data.token || data.user)) {
        const { token, user } = data;
        setToken(token);
        setUser(user || { email: user.email, role: user.role, id: user.id });
        setIsAuthenticated(true);
        localStorage.setItem('token', token);
        return { success: true, user: user || { email: user.email, role: user.role, id: user.id } };
      } else {
        return { success: false, error: data.error || 'Login failed: Invalid response format' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const registrationData = {
        email: userData.email,
        password: userData.password,
        role: userData.role,
        profile: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
      };

      if (userData.role === 'wholesale_reseller') {
        registrationData.business_name = userData.business_name;
        registrationData.license_number = userData.license_number;
        registrationData.license_state = userData.license_state;
        registrationData.phone = userData.phone;
      } else if (userData.role === 'customer') {
        registrationData.first_name = userData.first_name;
        registrationData.last_name = userData.last_name;
        registrationData.phone = userData.phone;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user || data.data);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        return { success: true, user: data.user || data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        const isAdmin = user?.role === 'admin';
        const endpoint = isAdmin ? '/api/admin/auth/logout' : '/api/auth/logout';
        await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const endpoint = user?.role === 'admin' ? '/api/admin/auth/change-password' : '/api/auth/change-password';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Password change failed:', error);
      return { success: false, error: 'Password change failed. Please try again.' };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    const rolePermissions = {
      admin: ['all'],
      wholesale_reseller: ['view_wholesale_pricing', 'create_quotes', 'manage_customers', 'view_analytics'],
      customer: ['view_retail_pricing', 'create_quotes', 'view_own_policies'],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;

    const roleLevels = {
      admin: 100,
      wholesale_reseller: 50,
      customer: 10,
    };

    const userLevel = roleLevels[user.role] || 0;
    const requiredLevel = roleLevels[role] || 0;

    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    changePassword,
    hasPermission,
    hasRole,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isReseller: user?.role === 'wholesale_reseller',
    isCustomer: user?.role === 'customer',
    API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default AuthProvider;