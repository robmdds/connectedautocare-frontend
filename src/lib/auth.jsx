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

  // Use consistent API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  // Updated verifyToken function for your auth context
  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST', // Note: your endpoint expects POST
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }) // Your endpoint also accepts token in body
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } else {
        // Token is invalid or expired
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      setLoading(true);
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
      console.log('Login Response:', data);

      if (response.ok && data.token) {
        const { token: authToken, user: userData } = data;
        
        // Store token and user data
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false); // Set loading to false here
        localStorage.setItem('token', authToken);

        return { success: true, user: userData };
      } else {
        console.error('Login failed:', data);
        return { success: false, error: data.error || data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const registrationData = {
        email: userData.email,
        password: userData.password,
        role: userData.role,
        profile: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
      };

      // Add role-specific data
      if (userData.role === 'wholesale_reseller') {
        registrationData.business_name = userData.business_name;
        registrationData.license_number = userData.license_number;
        registrationData.license_state = userData.license_state;
        registrationData.phone = userData.phone;
      } else if (userData.role === 'customer') {
        registrationData.profile.phone = userData.phone;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const { token: authToken, user: newUser } = data;
        setToken(authToken);
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('token', authToken);
        return { success: true, user: newUser };
      } else {
        return { success: false, error: data.error || data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Try to notify the server about logout
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          // Don't fail logout if server request fails
          console.warn('Logout server request failed:', error);
        });
      }
    } finally {
      // Always clear local state regardless of server response
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const endpoint = '/api/auth/change-password';
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
      
      if (response.ok) {
        return { success: true, message: data.message || 'Password changed successfully' };
      } else {
        return { success: false, error: data.error || 'Password change failed' };
      }
    } catch (error) {
      console.error('Password change failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
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
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Server returned ${contentType} instead of JSON`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default AuthProvider;