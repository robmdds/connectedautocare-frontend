// Enhanced Dashboard.jsx - Updated to handle new analytics structure

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    DollarSign,
    Users,
    TrendingUp,
    Shield,
    Building2,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    FileCheck,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user, token, isAdmin, isReseller, isCustomer } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Use different endpoints based on user role
            const endpoint = isCustomer
                ? `${API_BASE_URL}/api/analytics/customer-dashboard`
                : `${API_BASE_URL}/api/analytics/dashboard`;

            console.log('Fetching dashboard data from:', endpoint);

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data received:', data);
                setDashboardData(data);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to load dashboard data');
                console.error('Dashboard API error:', response.status, errorData);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            setError('Network error loading dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const name = user?.profile?.first_name || user?.email?.split('@')[0] || 'User';
        return `${greeting}, ${name}!`;
    };

    const getRoleSpecificMetrics = () => {
        if (!dashboardData) return [];

        if (isCustomer) {
            // Customer dashboard structure
            const customerMetrics = dashboardData.customer_metrics || dashboardData;
            return [
                {
                    title: 'My Transactions',
                    value: customerMetrics.transactions?.total || customerMetrics.total_transactions || 0,
                    change: `${customerMetrics.transactions?.completed || customerMetrics.completed_transactions || 0} completed`,
                    trend: 'up',
                    icon: Activity,
                    color: 'text-blue-600'
                },
                {
                    title: 'Total Spent',
                    value: formatCurrency(customerMetrics.transactions?.total_spent || customerMetrics.total_spent || 0),
                    change: 'Lifetime value',
                    trend: 'neutral',
                    icon: DollarSign,
                    color: 'text-green-600'
                },
                {
                    title: 'Protection Plans',
                    value: customerMetrics.protection_plans?.active || customerMetrics.active_plans || 0,
                    change: `${customerMetrics.protection_plans?.total || customerMetrics.total_plans || 0} total`,
                    trend: 'up',
                    icon: Shield,
                    color: 'text-purple-600'
                },
                {
                    title: 'Account Status',
                    value: 'Active',
                    change: 'Good standing',
                    trend: 'up',
                    icon: CheckCircle,
                    color: 'text-green-600'
                }
            ];
        }

        // Admin and reseller dashboard structure
        const { revenue_metrics, customer_metrics, product_metrics, operational_metrics } = dashboardData;

        if (isAdmin) {
            return [
                {
                    title: 'Total Revenue',
                    value: formatCurrency(revenue_metrics?.total_revenue || revenue_metrics?.current_period_revenue || 0),
                    change: formatPercentage(revenue_metrics?.growth_rate || 0),
                    trend: (revenue_metrics?.growth_rate || 0) >= 0 ? 'up' : 'down',
                    icon: DollarSign,
                    color: 'text-green-600'
                },
                {
                    title: 'Avg Transaction',
                    value: formatCurrency(revenue_metrics?.average_transaction_value || 0),
                    change: formatPercentage(revenue_metrics?.growth_rate || 0),
                    trend: (revenue_metrics?.growth_rate || 0) >= 0 ? 'up' : 'down',
                    icon: TrendingUp,
                    color: 'text-orange-600'
                }
            ];
        } else if (isReseller) {
            return [
                {
                    title: 'My Revenue',
                    value: formatCurrency(revenue_metrics?.current_period_revenue || 0),
                    change: formatPercentage(revenue_metrics?.growth_rate || 0),
                    trend: (revenue_metrics?.growth_rate || 0) >= 0 ? 'up' : 'down',
                    icon: DollarSign,
                    color: 'text-green-600'
                },
                {
                    title: 'My Customers',
                    value: customer_metrics?.total_customers || 0,
                    change: `${formatPercentage(customer_metrics?.retention_rate || 0)} retention`,
                    trend: 'up',
                    icon: Users,
                    color: 'text-blue-600'
                },
                {
                    title: 'Policies Sold',
                    value: operational_metrics?.active_policies || 0,
                    change: `${operational_metrics?.total_transactions || 0} transactions`,
                    trend: 'up',
                    icon: Shield,
                    color: 'text-purple-600'
                },
                {
                    title: 'Commission Est.',
                    value: formatCurrency((revenue_metrics?.current_period_revenue || 0) * 0.15),
                    change: 'This period',
                    trend: 'up',
                    icon: Building2,
                    color: 'text-orange-600'
                }
            ];
        }

        return [];
    };

    const getChartData = () => {
        if (isCustomer) return [];
        if (!dashboardData?.revenue_metrics?.revenue_by_period) return [];

        return Object.entries(dashboardData.revenue_metrics.revenue_by_period).map(([period, revenue]) => ({
            period: period,
            revenue: revenue || 0
        }));
    };

    const getProductData = () => {
        if (isCustomer) return [];
        if (!dashboardData?.product_metrics?.product_metrics) return [];

        return Object.entries(dashboardData.product_metrics.product_metrics).map(([product, metrics]) => ({
            name: product.replace('_', ' ').toUpperCase(),
            value: metrics.total_revenue || 0,
            sales: metrics.sales_count || 0,
            contracts: metrics.contract_count || 0
        }));
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchDashboardData} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const metrics = getRoleSpecificMetrics();
    const chartData = getChartData();
    const productData = getProductData();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                    <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
                    <p className="text-blue-100">
                        Welcome to your ConnectedAutoCare dashboard. Here's what's happening with your {isAdmin ? 'business' : isReseller ? 'sales' : 'account'}.
                    </p>
                    <div className="mt-4 flex items-center space-x-4">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {user?.role?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-blue-100 text-sm">
              Last login: {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Today'}
            </span>
                    </div>
                </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {metrics.map((metric, index) => {
                    const IconComponent = metric.icon;
                    return (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                                        <div className="flex items-center mt-2">
                                            {metric.trend === 'up' && <ArrowUpRight className="text-green-500" size={16} />}
                                            {metric.trend === 'down' && <ArrowDownRight className="text-red-500" size={16} />}
                                            <span className={`text-sm ml-1 ${
                                                metric.trend === 'up' ? 'text-green-600' :
                                                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                        {metric.change}
                      </span>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                                        <IconComponent size={24} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </motion.div>

            {/* Charts Section - Only show for admin and reseller */}
            {(isAdmin || isReseller) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    {chartData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue Trend</CardTitle>
                                    <CardDescription>Monthly revenue performance including contracts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                dot={{ fill: '#3B82F6' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Product Performance */}
                    {productData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Performance</CardTitle>
                                    <CardDescription>Revenue by product type (including contracts)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={productData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {productData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Customer-specific sections */}
            {isCustomer && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* My Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Your latest transactions and activities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Activity className="text-blue-600" size={24} />
                                            <div>
                                                <p className="font-medium">Recent Transaction</p>
                                                <p className="text-sm text-gray-600">Contract generated successfully</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Completed
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Shield className="text-green-600" size={24} />
                                            <div>
                                                <p className="font-medium">Protection Plan Active</p>
                                                <p className="text-sm text-gray-600">Coverage is current</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Active
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Account Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Summary</CardTitle>
                                <CardDescription>Your protection and service overview</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Protection Plans</p>
                                            <p className="text-sm text-gray-600">Active coverage</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{dashboardData?.protection_plans?.active || 0}</p>
                                            <p className="text-sm text-gray-600">Active</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Total Investment</p>
                                            <p className="text-sm text-gray-600">Lifetime spending</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">
                                                {formatCurrency(dashboardData?.transactions?.total_spent || 0)}
                                            </p>
                                            <p className="text-sm text-gray-600">All time</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Recent Activity for Admin/Reseller */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates and notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isCustomer ? (
                                <>
                                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <CheckCircle className="text-green-600" size={20} />
                                        <div>
                                            <p className="font-medium text-gray-900">Service Active</p>
                                            <p className="text-sm text-gray-600">All your protection plans are current</p>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-auto">Active</span>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                        <Activity className="text-blue-600" size={20} />
                                        <div>
                                            <p className="font-medium text-gray-900">Account Updated</p>
                                            <p className="text-sm text-gray-600">Dashboard information refreshed</p>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-auto">Just now</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                        <Activity className="text-blue-600" size={20} />
                                        <div>
                                            <p className="font-medium text-gray-900">Analytics Updated</p>
                                            <p className="text-sm text-gray-600">Dashboard data includes contract metrics</p>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-auto">Just now</span>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                            <FileCheck className="text-green-600" size={20} />
                                            <div>
                                                <p className="font-medium text-gray-900">Contracts Integration</p>
                                                <p className="text-sm text-gray-600">Contract data now appears in analytics</p>
                                            </div>
                                            <span className="text-xs text-gray-500 ml-auto">Today</span>
                                        </div>
                                    )}

                                    {isReseller && (
                                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                                            <DollarSign className="text-yellow-600" size={20} />
                                            <div>
                                                <p className="font-medium text-gray-900">Revenue Tracking</p>
                                                <p className="text-sm text-gray-600">Commissions updated with contract sales</p>
                                            </div>
                                            <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Debug Information for Development */}
            {process.env.NODE_ENV === 'development' && dashboardData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Debug Information</CardTitle>
                            <CardDescription>Raw dashboard data for development</CardDescription>
                        </CardHeader>
                        <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
                {JSON.stringify(dashboardData, null, 2)}
              </pre>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default Dashboard;
