import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Shield, Phone, Mail, User, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../management/lib/auth'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Navigation items based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Home', href: '/' },
      { name: 'Hero Products', href: '/hero-products' },
      { name: 'VSC Coverage', href: '/vsc' },
      { name: 'Get Quote', href: '/quote' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ]

    // Add Dashboard for authenticated resellers
    if (isAuthenticated && user?.role === 'wholesale_reseller') {
      return [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Hero Products', href: '/hero-products' },
        { name: 'VSC Coverage', href: '/vsc' },
        { name: 'Get Quote', href: '/quote' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
      ]
    }

    return baseNavigation
  }

  const navigation = getNavigation()

  const isActive = (path) => location.pathname === path

  // Handle login functionality
  const handleLogin = () => {
    // Navigate to a login page instead of direct authentication
    navigate('/login')
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still navigate home even if logout fails
      navigate('/')
    }
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`
    }
    if (user?.business_name) {
      return user.business_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>1‑(866) 660‑7003</span>
              </div>
              <div className="flex items-center space-x-2">
                <a href="mailto:info@connectedautocare.com" className="flex items-center space-x-2 text-white hover:text-blue-200">
                  <Mail className="h-4 w-4" />
                  <span>support@connectedautocare.com</span>
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span>Protection that pays</span>
              {/* Login/Logout button in top bar */}
              {loading ? (
                <div className="text-primary-foreground text-xs">Loading...</div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-primary-foreground text-xs">
                    Welcome, {getUserDisplayName()}
                    {user?.role === 'wholesale_reseller' && ' (Reseller)'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-primary-foreground hover:text-blue-200 hover:bg-blue-600/20 h-auto p-1"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogin}
                  className="text-primary-foreground hover:text-blue-200 hover:bg-blue-600/20 h-auto p-1"
                >
                  <User className="h-4 w-4 mr-1" />
                  Reseller Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">ConnectedAutoCare</h1>
              <p className="text-sm text-muted-foreground">Professional Protection Plans</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user?.role === 'wholesale_reseller' ? (
              <Button asChild>
                <Link to="/quote">Create Quote</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/quote">Get Instant Quote</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block text-base font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              {isAuthenticated && user?.role === 'wholesale_reseller' ? (
                <Button asChild className="w-full">
                  <Link to="/quote" onClick={() => setIsMenuOpen(false)}>
                    Create Quote
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to="/quote" onClick={() => setIsMenuOpen(false)}>
                    Get Instant Quote
                  </Link>
                </Button>
              )}
              
              {/* Mobile login/logout section */}
              {loading ? (
                <div className="text-center text-sm text-muted-foreground">Loading...</div>
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-center text-sm text-muted-foreground">
                    Welcome, {getUserDisplayName()}
                    {user?.role === 'wholesale_reseller' && ' (Reseller)'}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogin()
                    setIsMenuOpen(false)
                  }}
                  className="w-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  Reseller Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header