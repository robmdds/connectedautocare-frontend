// Enhanced Analytics.jsx - Fixed to handle contract data and new API structure

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DatePickerWithRange } from '../components/ui/date-picker';
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
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    Download,
    TrendingUp,
    Users,
    DollarSign,
    ShoppingCart,
    Calendar,
    Filter,
    RefreshCw,
    FileText,
    BarChart3,
    List,
    FileCheck,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Analytics = () => {
    const { token, isAdmin, isReseller } = useAuth();
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReport, setSelectedReport] = useState('dashboard_overview');
    const [dateRange, setDateRange] = useState(null);
    const [exportFormat, setExportFormat] = useState('json');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedReport, dateRange]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        setError('');

        try {
            let url = `${API_BASE_URL}/api/analytics`;

            // Choose endpoint based on report type
            if (selectedReport === 'dashboard_overview') {
                url += '/dashboard';
            } else {
                url += `/reports/${selectedReport}`;
            }

            const params = new URLSearchParams();

            if (dateRange?.from && dateRange?.to) {
                params.append('start_date', dateRange.from.toISOString());
                params.append('end_date', dateRange.to.toISOString());
            }

            // Add report-specific parameters
            if (selectedReport === 'revenue_trends') {
                params.append('breakdown', 'month');
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log('Fetching analytics from:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Analytics data received:', data);
                setAnalyticsData(data);
                setError('');
            } else {
                const errorText = await response.text();
                console.error('Analytics API error:', response.status, errorText);
                setError(`Failed to load analytics data (${response.status})`);
            }
        } catch (error) {
            console.error('Analytics fetch error:', error);
            setError('Network error loading analytics');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async () => {
        try {
            let url = `${API_BASE_URL}/api/analytics/reports/${selectedReport}/export?format=${exportFormat}`;

            if (dateRange?.from && dateRange?.to) {
                url += `&start_date=${dateRange.from.toISOString()}&end_date=${dateRange.to.toISOString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `${selectedReport}_report.${exportFormat}`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
            }
        } catch (error) {
            console.error('Export error:', error);
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

    // Enhanced data processing functions
    const getRevenueChartData = () => {
        if (!analyticsData) return [];

        // Handle dashboard overview data
        if (analyticsData.revenue_metrics?.revenue_by_period) {
            return Object.entries(analyticsData.revenue_metrics.revenue_by_period).map(([period, revenue]) => ({
                month: period,
                revenue: revenue || 0,
                transactions: 0
            }));
        }

        // Handle report data
        if (analyticsData.data?.revenue_trends && Array.isArray(analyticsData.data.revenue_trends)) {
            return analyticsData.data.revenue_trends.map(item => ({
                month: item.period || item.month || item.date,
                revenue: item.revenue || item.total || 0,
                transactions: item.transactions || item.count || 0
            }));
        }

        // Handle daily trends from dashboard
        if (analyticsData.trends?.daily_revenue && Array.isArray(analyticsData.trends.daily_revenue)) {
            return analyticsData.trends.daily_revenue.map(item => ({
                month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: item.revenue || 0,
                transactions: item.transaction_count || 0
            }));
        }

        return [];
    };

    const getProductChartData = () => {
        if (!analyticsData) return [];

        // Handle dashboard overview data
        if (analyticsData.product_metrics?.product_metrics) {
            return Object.entries(analyticsData.product_metrics.product_metrics).map(([product, metrics]) => ({
                name: product.replace('_', ' ').toUpperCase(),
                value: metrics.total_revenue || 0,
                sales: metrics.sales_count || 0,
                contracts: metrics.contract_count || 0
            }));
        }

        // Handle report data
        if (analyticsData.data?.products && Array.isArray(analyticsData.data.products)) {
            return analyticsData.data.products.map(item => ({
                name: (item.name || item.product || item.product_type || '').replace('_', ' ').toUpperCase(),
                value: item.revenue || item.total || item.value || 0,
                sales: item.sales || item.count || 0,
                contracts: item.contract_count || 0
            }));
        }

        // Handle products from dashboard
        if (analyticsData.products && Array.isArray(analyticsData.products)) {
            return analyticsData.products.map(item => ({
                name: (item.product_type || '').replace('_', ' ').toUpperCase(),
                value: item.revenue || 0,
                sales: item.conversion_count || 0,
                quotes: item.quote_count || 0
            }));
        }

        return [];
    };

    const getSummaryData = () => {
        if (!analyticsData) return null;

        // Handle dashboard overview structure
        if (analyticsData.revenue_metrics) {
            return {
                total_revenue: analyticsData.revenue_metrics.total_revenue || analyticsData.revenue_metrics.current_period_revenue || 0,
                total_transactions: analyticsData.operational_metrics?.total_transactions || 0,
                average_transaction_value: analyticsData.revenue_metrics.average_transaction_value || 0,
                growth_rate: analyticsData.revenue_metrics.growth_rate || 0,
                total_customers: analyticsData.customer_metrics?.total_customers || 0,
                retention_rate: analyticsData.customer_metrics?.retention_rate || 0,
                average_lifetime_value: 0,
                active_policies: analyticsData.operational_metrics?.active_policies || 0
            };
        }

        // Handle report structure
        if (analyticsData.data?.summary) {
            return analyticsData.data.summary;
        }

        // Handle old dashboard structure
        if (analyticsData.overview) {
            return {
                total_revenue: analyticsData.overview.total_revenue || 0,
                total_transactions: analyticsData.overview.total_transactions || 0,
                average_transaction_value: analyticsData.overview.avg_transaction_amount || 0,
                growth_rate: 0,
                total_customers: 0,
                retention_rate: 0,
                average_lifetime_value: 0
            };
        }

        return null;
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    const reportTypes = [
        { value: 'dashboard_overview', label: 'Dashboard Overview', icon: BarChart3 },
        { value: 'revenue_trends', label: 'Revenue Trends', icon: DollarSign },
        { value: 'product_performance', label: 'Product Performance', icon: ShoppingCart },
        { value: 'customer_analysis', label: 'Customer Analysis', icon: Users },
        { value: 'conversion_rates', label: 'Conversion Rates', icon: TrendingUp },
        { value: 'sales_summary', label: 'Sales Summary', icon: FileText },
        { value: 'transaction_details', label: 'Transaction Details', icon: List },
    ];

    if (!isAdmin && !isReseller) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Analytics access is restricted to administrators and resellers.</p>
                </div>
            </div>
        );
    }

    const shouldShowEmptyState = () => {
        return !error && !loading && analyticsData && (
            !getSummaryData() &&
            getRevenueChartData().length === 0 &&
            getProductChartData().length === 0
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-600 mt-1">Comprehensive business intelligence and performance metrics</p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={exportReport} size="sm">
                        <Download size={16} className="mr-2" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                                <Filter size={16} className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filters:</span>
                            </div>

                            <Select value={selectedReport} onValueChange={setSelectedReport}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map((type) => {
                                        const IconComponent = type.icon;
                                        return (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center space-x-2">
                                                    <IconComponent size={16} />
                                                    <span>{type.label}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center space-x-2">
                                <Calendar size={16} className="text-gray-500" />
                                <DatePickerWithRange
                                    date={dateRange}
                                    setDate={setDateRange}
                                    placeholder="Select date range"
                                />
                            </div>

                            <Select value={exportFormat} onValueChange={setExportFormat}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-red-500 mb-4" />
                        <p className="text-gray-600">{error}</p>
                        <Button onClick={fetchAnalyticsData} className="mt-4">
                            Retry
                        </Button>
                    </div>
                </div>
            ) : shouldShowEmptyState() ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">No data available for the selected period and report type.</p>
                        <p className="text-sm text-gray-500 mt-2">Try selecting a different date range or report type.</p>
                        {analyticsData?.message && (
                            <p className="text-xs text-blue-600 mt-2">{analyticsData.message}</p>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Enhanced Summary Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {(() => {
                            const summaryData = getSummaryData();
                            return summaryData && (
                                <>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {formatCurrency(summaryData.total_revenue)}
                                                    </p>
                                                    <p className="text-sm text-green-600 mt-1">
                                                        {formatPercentage(summaryData.growth_rate)} growth
                                                    </p>
                                                </div>
                                                <DollarSign className="text-green-600" size={24} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Transactions</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {summaryData.total_transactions || 0}
                                                    </p>
                                                    <p className="text-sm text-blue-600 mt-1">
                                                        {formatCurrency(summaryData.average_transaction_value)} avg
                                                    </p>
                                                </div>
                                                <ShoppingCart className="text-blue-600" size={24} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            );
                        })()}
                    </motion.div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Trend */}
                        {getRevenueChartData().length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Revenue Trend</CardTitle>
                                        <CardDescription>Revenue and transaction volume over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={getRevenueChartData()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value, name) => [
                                                        name === 'revenue' ? formatCurrency(value) : value,
                                                        name === 'revenue' ? 'Revenue' : 'Transactions'
                                                    ]}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stackId="1"
                                                    stroke="#3B82F6"
                                                    fill="#3B82F6"
                                                    fillOpacity={0.6}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Product Distribution */}
                        {getProductChartData().length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Revenue by Product</CardTitle>
                                        <CardDescription>Product performance breakdown</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={getProductChartData()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {getProductChartData().map((entry, index) => (
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

                    {/* Detailed Analytics Tables */}
                    {(getRevenueChartData().length > 0 || getProductChartData().length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detailed Analytics</CardTitle>
                                    <CardDescription>
                                        Comprehensive breakdown of {selectedReport.replace('_', ' ')} data
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="revenue" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
                                            <TabsTrigger value="products">Product Performance</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="revenue" className="space-y-4">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Period</th>
                                                        <th className="text-right p-2">Revenue</th>
                                                        <th className="text-right p-2">Transactions</th>
                                                        <th className="text-right p-2">Average</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {getRevenueChartData().map((item, index) => (
                                                        <tr key={index} className="border-b">
                                                            <td className="p-2 font-medium">{item.month}</td>
                                                            <td className="p-2 text-right">{formatCurrency(item.revenue)}</td>
                                                            <td className="p-2 text-right">{item.transactions}</td>
                                                            <td className="p-2 text-right">
                                                                {formatCurrency(item.transactions > 0 ? item.revenue / item.transactions : 0)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="products" className="space-y-4">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Product</th>
                                                        <th className="text-right p-2">Revenue</th>
                                                        <th className="text-right p-2">Sales</th>
                                                        <th className="text-right p-2">Contracts</th>
                                                        <th className="text-right p-2">Avg Sale</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {getProductChartData().map((item, index) => (
                                                        <tr key={index} className="border-b">
                                                            <td className="p-2 font-medium">{item.name}</td>
                                                            <td className="p-2 text-right">{formatCurrency(item.value)}</td>
                                                            <td className="p-2 text-right">{item.sales || 0}</td>
                                                            <td className="p-2 text-right">{item.contracts || 0}</td>
                                                            <td className="p-2 text-right">
                                                                {formatCurrency(item.sales > 0 ? item.value / item.sales : 0)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Debug Information */}
                    {process.env.NODE_ENV === 'development' && analyticsData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Debug Information</CardTitle>
                                    <CardDescription>Raw analytics data for development</CardDescription>
                                </CardHeader>
                                <CardContent>
                  <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
                    {JSON.stringify(analyticsData, null, 2)}
                  </pre>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
};

export default Analytics;