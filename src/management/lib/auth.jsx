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

  // Enhanced token verification
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
          console.log('Token verification failed, logging out');
          logout();
        }
      } else {
        // Token is invalid or expired
        console.log('Token verification failed, logging out');
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // New function to check token validity without setting loading states
  const checkTokenValidity = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
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
      localStorage.removeItem('user'); // Clear any cached user data
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
    checkTokenValidity, // Added this function
    API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Enhanced apiCall with automatic token expiration handling
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
    
    // Handle 401 Unauthorized responses (token expired/invalid)
    if (response.status === 401) {
      console.log('API call received 401, dispatching token expired event');
      // Dispatch a custom event that the TokenExpirationHandler will catch
      window.dispatchEvent(new CustomEvent('tokenExpired', {
        detail: { message: 'Token expired', endpoint }
      }));
      throw new Error('Unauthorized - Token expired');
    }
    
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