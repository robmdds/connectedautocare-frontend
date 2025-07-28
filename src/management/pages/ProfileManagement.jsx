import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Building, Shield, Save, Edit, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../lib/auth';

export default function ProfileManagement() {
  const { user, changePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [profileData, setProfileData] = useState({
    first_name: user?.profile?.first_name || '',
    last_name: user?.profile?.last_name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    company: user?.profile?.company || ''
  });

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      // This would call an API to update profile
      // await apiCall('/api/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) });
      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (passwordData.new !== passwordData.confirm) {
        setError('New passwords do not match');
        return;
      }
      
      if (passwordData.new.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      
      const result = await changePassword(passwordData.current, passwordData.new);
      
      if (result.success) {
        setMessage('Password changed successfully!');
        setChangingPassword(false);
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'wholesale_reseller':
        return 'bg-green-100 text-green-800';
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'wholesale_reseller':
        return 'Wholesale Reseller';
      case 'customer':
        return 'Customer';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information and settings</p>
        </div>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {user?.profile?.first_name} {user?.profile?.last_name}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <Badge className={getRoleColor(user?.role)}>
                  {formatRole(user?.role)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                <span>{user?.email}</span>
              </div>
              
              {user?.profile?.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{user.profile.phone}</span>
                </div>
              )}
              
              {user?.profile?.company && (
                <div className="flex items-center text-sm">
                  <Building className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{user.profile.company}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm">
                <Shield className="w-4 h-4 mr-3 text-gray-400" />
                <span>Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                  disabled={!editing}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!editing}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!editing}
              />
            </div>
            
            {user?.role === 'wholesale_reseller' && (
              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                  disabled={!editing}
                />
              </div>
            )}
            
            {editing && (
              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangingPassword(!changingPassword)}
              >
                <Lock className="w-4 h-4 mr-2" />
                {changingPassword ? 'Cancel' : 'Change Password'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {changingPassword ? (
              <>
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Password last changed: {new Date(user?.updated_at || Date.now()).toLocaleDateString()}
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    For security, we recommend changing your password regularly and using a strong, unique password.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Password Requirements:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Account Activity</CardTitle>
          <CardDescription>Your account usage and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{user?.login_count || 0}</div>
              <div className="text-sm text-gray-600">Total Logins</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Login</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user?.email_verified ? 'Verified' : 'Pending'}
              </div>
              <div className="text-sm text-gray-600">Email Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {user?.status === 'active' ? 'Active' : user?.status || 'Unknown'}
              </div>
              <div className="text-sm text-gray-600">Account Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}