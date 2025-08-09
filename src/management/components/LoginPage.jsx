import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Eye, EyeOff, Shield, Users, User, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../../App.css';

const LoginPage = () => {
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    first_name: '',
    last_name: '',
    business_name: '',
    license_number: '',
    license_state: '',
    phone: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(loginData.email, loginData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate required fields based on role
    if (registerData.role === 'wholesale_reseller') {
      if (!registerData.business_name || !registerData.license_number) {
        setError('Business name and license number are required for resellers');
        setLoading(false);
        return;
      }
    }

    const result = await register(registerData);
    
    if (result.success) {
      setSuccess('Registration successful! Welcome to ConnectedAutoCare.');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const roleInfo = {
    customer: {
      icon: User,
      title: 'Customer Account',
      description: 'Access retail pricing and manage your policies',
      color: 'bg-blue-500'
    },
    wholesale_reseller: {
      icon: Building2,
      title: 'Wholesale Reseller',
      description: 'Access wholesale pricing and manage customer accounts',
      color: 'bg-green-500'
    },
    admin: {
      icon: Shield,
      title: 'Administrator',
      description: 'Full system access and management capabilities',
      color: 'bg-purple-500'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ConnectedAutoCare
            </h1>
            <p className="text-lg text-gray-600">
              User Management System
            </p>
          </motion.div>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm font-medium">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm font-medium">
                  Create Account
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

              </TabsContent>

              {/* Registration Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label>Account Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(roleInfo).filter(([role]) => role !== 'admin').map(([role, info]) => {
                        const IconComponent = info.icon;
                        return (
                          <div
                            key={role}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              registerData.role === role
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setRegisterData({...registerData, role})}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${info.color} text-white`}>
                                <IconComponent size={16} />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{info.title}</h4>
                                <p className="text-xs text-gray-600">{info.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        placeholder="Enter first name"
                        value={registerData.first_name}
                        onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        placeholder="Enter last name"
                        value={registerData.last_name}
                        onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    />
                  </div>

                  {/* Reseller-specific fields */}
                  {registerData.role === 'wholesale_reseller' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name *</Label>
                        <Input
                          id="business_name"
                          placeholder="Enter business name"
                          value={registerData.business_name}
                          onChange={(e) => setRegisterData({...registerData, business_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="license_number">License Number *</Label>
                          <Input
                            id="license_number"
                            placeholder="Enter license number"
                            value={registerData.license_number}
                            onChange={(e) => setRegisterData({...registerData, license_number: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="license_state">License State</Label>
                          <Input
                            id="license_state"
                            placeholder="e.g., CA"
                            value={registerData.license_state}
                            onChange={(e) => setRegisterData({...registerData, license_state: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Password fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Multi-tier Access</h3>
            <p className="text-sm text-gray-600">Customer, Reseller, and Admin portals</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Secure Authentication</h3>
            <p className="text-sm text-gray-600">Enterprise-grade security and encryption</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="text-purple-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Business Analytics</h3>
            <p className="text-sm text-gray-600">Comprehensive KPI tracking and reporting</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

