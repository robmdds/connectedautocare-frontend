import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, UserPlus, Phone, Mail, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        loadCustomers();
    }, [searchTerm, pagination.page]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';

            // Build query parameters
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            const endpoint = `${API_BASE_URL}/api/resellers/customers?${params}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.success) {
                setCustomers(data.customers || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || data.customers?.length || 0
                }));
            } else {
                throw new Error(data.error || 'Failed to load customers');
            }

        } catch (error) {
            console.error('Failed to load customers:', error);
            setError(error.message);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getCustomerTypeColor = (type) => {
        return type === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    };

    if (loading && customers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
                    <p className="text-gray-600 mt-1">Manage customer accounts and relationships</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-red-800">{error}</div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCustomers}
                        className="mt-2"
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Search */}

            {/* Customer Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                            </div>
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {customers.reduce((sum, customer) => sum + (customer.active_policies || 0), 0)}
                                </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                                Active
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {customers.reduce((sum, customer) => sum + (customer.total_quotes || 0), 0)}
                                </p>
                            </div>
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg LTV</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${customers.length > 0 ? (customers.reduce((sum, customer) => sum + (customer.lifetime_value || 0), 0) / customers.length).toFixed(0) : 0}
                                </p>
                            </div>
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Customers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Customers ({customers.length})</CardTitle>
                    <CardDescription>Manage your customer base and their account details</CardDescription>
                </CardHeader>
                <CardContent>
                    {customers.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first customer.'}
                            </p>
                            {!searchTerm && (
                                <div className="mt-6">
                                    <Button>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add Customer
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Quotes/Policies</TableHead>
                                    <TableHead>Lifetime Value</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {customer.name || 'Unnamed Customer'}
                                                </div>
                                                {customer.company && (
                                                    <div className="text-sm text-gray-500">
                                                        {customer.company}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-400">
                                                    ID: {customer.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm">
                                                    <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                                    {customer.email || 'No email'}
                                                </div>
                                                {customer.phone && (
                                                    <div className="flex items-center text-sm">
                                                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                                        {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getCustomerTypeColor(customer.customer_type)}>
                                                {customer.customer_type === 'business' ? 'Business' : 'Individual'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-center">
                                                <div className="text-sm">
                                                    <span className="font-medium text-blue-600">{customer.total_quotes || 0}</span> quotes
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-medium text-green-600">{customer.active_policies || 0}</span> policies
                                                </div>
                                                {customer.converted_quotes > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        {customer.converted_quotes} converted
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-green-600">
                                                ${(customer.lifetime_value || 0).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {formatDate(customer.last_activity)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Joined {formatDate(customer.created_at)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} customers
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page * pagination.limit >= pagination.total}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}