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
  List
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../../App.css';

const Analytics = () => {
  const { token, isAdmin, isReseller } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('revenue_trends'); // Fixed: Changed from 'revenue' to 'revenue_trends'
  const [dateRange, setDateRange] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedReport, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/analytics/reports/${selectedReport}`;
      
      const params = new URLSearchParams();
      
      if (dateRange?.from && dateRange?.to) {
        params.append('start_date', dateRange.from.toISOString());
        params.append('end_date', dateRange.to.toISOString());
      }
      
      // Add specific parameters for certain report types
      if (selectedReport === 'revenue_trends') {
        params.append('breakdown', 'month'); // Default to monthly
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        setError(''); // Clear any previous errors
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
      let url = `${API_BASE_URL}/api/analytics/export/${selectedReport}?format=${exportFormat}`;
      
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

  // Fixed: Updated to handle the new API data structure
  const getRevenueChartData = () => {
    // Handle new API structure
    if (analyticsData?.data?.revenue_trends && Array.isArray(analyticsData.data.revenue_trends)) {
      return analyticsData.data.revenue_trends.map(item => ({
        month: item.period || item.month || item.date,
        revenue: item.revenue || item.total || 0,
        transactions: item.transactions || item.count || 0
      }));
    }
    
    // Fallback for old structure
    if (analyticsData?.revenue_by_month) {
      return Object.entries(analyticsData.revenue_by_month).map(([month, revenue]) => ({
        month,
        revenue,
        transactions: analyticsData.summary?.transaction_count_by_period?.[month] || 0
      }));
    }
    
    return [];
  };

  // Fixed: Updated to handle the new API data structure
  const getProductChartData = () => {
    // Handle new API structure
    if (analyticsData?.data?.products && Array.isArray(analyticsData.data.products)) {
      return analyticsData.data.products.map(item => ({
        name: (item.name || item.product || '').replace('_', ' ').toUpperCase(),
        value: item.revenue || item.total || item.value || 0
      }));
    }
    
    // Fallback for old structure
    if (analyticsData?.revenue_by_product) {
      return Object.entries(analyticsData.revenue_by_product).map(([product, revenue]) => ({
        name: product.replace('_', ' ').toUpperCase(),
        value: revenue
      }));
    }
    
    return [];
  };

  // Fixed: Helper function to safely get summary data
  const getSummaryData = () => {
    // Try to get from new API structure
    if (analyticsData?.data?.summary) {
      return analyticsData.data.summary;
    }
    
    // Fallback to old structure
    if (analyticsData?.summary) {
      return analyticsData.summary;
    }
    
    // Generate summary from available data if possible
    const chartData = getRevenueChartData();
    if (chartData.length > 0) {
      const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalTransactions = chartData.reduce((sum, item) => sum + (item.transactions || 0), 0);
      
      return {
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        average_transaction_value: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        growth_rate: 0, // Cannot calculate without historical data
        total_customers: 0,
        retention_rate: 0,
        average_lifetime_value: 0
      };
    }
    
    return null;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const reportTypes = [
    { value: 'revenue_trends', label: 'Revenue Trends', icon: DollarSign },
    { value: 'product_performance', label: 'Product Performance', icon: ShoppingCart },
    { value: 'customer_analysis', label: 'Customer Analysis', icon: Users },
    { value: 'conversion_rates', label: 'Conversion Rates', icon: TrendingUp },
    { value: 'sales_summary', label: 'Sales Summary', icon: FileText },
    { value: 'transaction_details', label: 'Transaction Details', icon: List },
    ...(isAdmin ? [{ value: 'reseller', label: 'Reseller Report', icon: BarChart3 }] : [])
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

  // Helper function to determine if we should show empty state vs error
  const shouldShowEmptyState = () => {
    return !error && analyticsData && (
      (analyticsData.data?.revenue_trends && analyticsData.data.revenue_trends.length === 0) ||
      (analyticsData.data?.products && analyticsData.data.products.length === 0) ||
      (!analyticsData.data?.revenue_trends && !analyticsData.data?.products && !analyticsData.summary)
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
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
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

                  {selectedReport === 'customer_analysis' && (
                    <>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Customers</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {summaryData.total_customers || 0}
                              </p>
                              <p className="text-sm text-purple-600 mt-1">
                                {formatPercentage(summaryData.retention_rate)} retention
                              </p>
                            </div>
                            <Users className="text-purple-600" size={24} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Avg LTV</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(summaryData.average_lifetime_value)}
                              </p>
                              <p className="text-sm text-orange-600 mt-1">
                                Per customer
                              </p>
                            </div>
                            <TrendingUp className="text-orange-600" size={24} />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </>
              );
            })()}
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            {selectedReport === 'revenue_trends' && getRevenueChartData().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue and transaction volume</CardDescription>
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
                    <CardTitle>
                      {selectedReport === 'revenue_trends' ? 'Revenue by Product' : 
                       selectedReport === 'customer_analysis' ? 'Customer Segments' : 'Product Performance'}
                    </CardTitle>
                    <CardDescription>Distribution breakdown</CardDescription>
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

          {/* Detailed Table */}
          {(getRevenueChartData().length > 0 || getProductChartData().length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Breakdown</CardTitle>
                  <CardDescription>
                    {selectedReport === 'revenue_trends' ? 'Revenue metrics by period' :
                     selectedReport === 'customer_analysis' ? 'Customer analytics' :
                     selectedReport === 'product_performance' ? 'Product performance metrics' :
                     'Analytics data breakdown'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Period/Item</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">Count</th>
                          <th className="text-right p-2">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport === 'revenue_trends' && getRevenueChartData().map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{item.month}</td>
                            <td className="p-2 text-right">{formatCurrency(item.revenue)}</td>
                            <td className="p-2 text-right">{item.transactions}</td>
                            <td className="p-2 text-right">
                              {formatCurrency(item.transactions > 0 ? item.revenue / item.transactions : 0)}
                            </td>
                          </tr>
                        ))}
                        {selectedReport === 'product_performance' && getProductChartData().map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{item.name}</td>
                            <td className="p-2 text-right">{formatCurrency(item.value)}</td>
                            <td className="p-2 text-right">-</td>
                            <td className="p-2 text-right">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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