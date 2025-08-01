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
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../../App.css';

const Analytics = () => {
  const { token, isAdmin, isReseller } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('revenue');
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
      
      if (dateRange?.from && dateRange?.to) {
        const params = new URLSearchParams({
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString()
        });
        url += `?${params}`;
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
      } else {
        setError('Failed to load analytics data');
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
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getRevenueChartData = () => {
    if (!analyticsData?.revenue_by_month) return [];
    
    return Object.entries(analyticsData.revenue_by_month).map(([month, revenue]) => ({
      month,
      revenue,
      transactions: analyticsData.summary?.transaction_count_by_period?.[month] || 0
    }));
  };

  const getProductChartData = () => {
    if (!analyticsData?.revenue_by_product) return [];
    
    return Object.entries(analyticsData.revenue_by_product).map(([product, revenue]) => ({
      name: product.replace('_', ' ').toUpperCase(),
      value: revenue
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report', icon: DollarSign },
    { value: 'customer', label: 'Customer Report', icon: Users },
    { value: 'product', label: 'Product Report', icon: ShoppingCart },
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
      ) : (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {analyticsData?.summary && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(analyticsData.summary.total_revenue || 0)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          {formatPercentage(analyticsData.summary.growth_rate || 0)} growth
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
                          {analyticsData.summary.total_transactions || 0}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {formatCurrency(analyticsData.summary.average_transaction_value || 0)} avg
                        </p>
                      </div>
                      <ShoppingCart className="text-blue-600" size={24} />
                    </div>
                  </CardContent>
                </Card>

                {selectedReport === 'customer' && (
                  <>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Customers</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {analyticsData.summary.total_customers || 0}
                            </p>
                            <p className="text-sm text-purple-600 mt-1">
                              {formatPercentage(analyticsData.summary.retention_rate || 0)} retention
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
                              {formatCurrency(analyticsData.summary.average_lifetime_value || 0)}
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
            )}
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            {selectedReport === 'revenue' && (
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedReport === 'revenue' ? 'Revenue by Product' : 
                     selectedReport === 'customer' ? 'Customer Segments' : 'Product Performance'}
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
          </div>

          {/* Detailed Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
                <CardDescription>
                  {selectedReport === 'revenue' ? 'Revenue metrics by period' :
                   selectedReport === 'customer' ? 'Customer analytics' :
                   selectedReport === 'product' ? 'Product performance metrics' :
                   'Reseller performance data'}
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
                      {selectedReport === 'revenue' && analyticsData?.revenue_by_month && 
                        Object.entries(analyticsData.revenue_by_month).map(([period, revenue]) => (
                          <tr key={period} className="border-b">
                            <td className="p-2 font-medium">{period}</td>
                            <td className="p-2 text-right">{formatCurrency(revenue)}</td>
                            <td className="p-2 text-right">
                              {analyticsData.summary?.transaction_count_by_period?.[period] || 0}
                            </td>
                            <td className="p-2 text-right">
                              {formatCurrency(revenue / Math.max(analyticsData.summary?.transaction_count_by_period?.[period] || 1, 1))}
                            </td>
                          </tr>
                        ))
                      }
                      {selectedReport === 'product' && analyticsData?.revenue_by_product &&
                        Object.entries(analyticsData.revenue_by_product).map(([product, revenue]) => (
                          <tr key={product} className="border-b">
                            <td className="p-2 font-medium">{product.replace('_', ' ').toUpperCase()}</td>
                            <td className="p-2 text-right">{formatCurrency(revenue)}</td>
                            <td className="p-2 text-right">-</td>
                            <td className="p-2 text-right">-</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Analytics;

