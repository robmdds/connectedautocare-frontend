import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  User, 
  Building2, 
  Shield,
  Menu,
  Bell,
  Search,
  ChevronDown,
  Package,
  FileText,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../../App.css';

const DashboardLayout = ({ children, currentPage, onNavigate }) => {
  const { user, logout, isAdmin, isReseller, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (user) => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name[0]}${user.profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500';
      case 'wholesale_reseller':
        return 'bg-green-500';
      case 'customer':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'wholesale_reseller', 'customer'] }
    ];

    const adminItems = [
      { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
      { id: 'products', label: 'Product Management', icon: Package, roles: ['admin'] },
      { id: 'tpas', label: 'TPA Management', icon: Building2, roles: ['admin'] },
      { id: 'contracts', label: 'Contract Management', icon: FileText, roles: ['admin'] },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'wholesale_reseller'] },
      { id: 'video', label: 'Video Management', icon: Play, roles: ['admin'] },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] }
    ];

    const resellerItems = [
      { id: 'customers', label: 'Customers', icon: Users, roles: ['wholesale_reseller'] },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['wholesale_reseller'] }
    ];

    const customerItems = [
      { id: 'policies', label: 'My Policies', icon: Shield, roles: ['customer'] }
    ];

    let items = [...baseItems];

    if (isAdmin) {
      items = [...items, ...adminItems];
    } else if (isReseller) {
      items = [...items, ...resellerItems];
    } else if (isCustomer) {
      items = [...items, ...customerItems];
    }

    return items.filter(item => item.roles.includes(user?.role));
  };

  const navigationItems = getNavigationItems();

  const getUserDisplayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email || 'User';
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator';
      case 'wholesale_reseller':
        return 'Wholesale Reseller';
      case 'customer':
        return 'Customer';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={16} />
            </div>
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-gray-900">ConnectedAutoCare</h2>
                <p className="text-xs text-gray-500">User Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <IconComponent size={18} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Logout Option */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={`${getRoleColor(user?.role)} text-white text-sm`}>
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {getRoleDisplayName()}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          {sidebarOpen && (
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <LogOut size={16} className="mr-2" />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          )}
          
          {/* Compact logout for collapsed sidebar */}
          {!sidebarOpen && (
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="w-full p-2 text-red-600 border-red-200 hover:bg-red-50"
              title="Sign Out"
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2"
              >
                <Menu size={20} />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {currentPage === 'dashboard' ? 'Dashboard' : currentPage.replace('_', ' ')}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu (without sign out option) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-10 hover:bg-gray-100 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${getRoleColor(user?.role)} text-white text-sm`}>
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName()}
                      </p>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
