import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, UserPlus, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
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

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/resellers/customers`;

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
      const customersData = data.data?.customers || data.customers || data || [];
      setCustomers(customersData);
      
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError(error.message);
      
      // Set mock data for demo when API fails
      setCustomers([
        {
          id: '1',
          user_info: { email: 'john.doe@example.com', status: 'active', last_login: '2025-01-20T14:30:00Z' },
          personal_info: { first_name: 'John', last_name: 'Doe' },
          contact_info: { phone: '555-123-4567', email: 'john.doe@example.com' },
          lifetime_value: 1250.00,
          total_policies: 2,
          active_policies: 2,
          created_at: '2024-06-15T10:00:00Z'
        },
        {
          id: '2',
          user_info: { email: 'jane.smith@example.com', status: 'active', last_login: '2025-01-18T09:15:00Z' },
          personal_info: { first_name: 'Jane', last_name: 'Smith' },
          contact_info: { phone: '555-987-6543', email: 'jane.smith@example.com' },
          lifetime_value: 850.00,
          total_policies: 1,
          active_policies: 1,
          created_at: '2024-08-20T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Test admin users endpoint
  const testAdminUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for admin test');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/users`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
      } else {
        const errorText = await response.text();
        console.error('Admin users error:', errorText);
      }
    } catch (error) {
      console.error('Admin users test failed:', error);
    }
  };


  const filteredCustomers = customers.filter(customer =>
    customer.personal_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.personal_info?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
        </div>
      )}



      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Badge className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${customers.reduce((sum, customer) => sum + (customer.lifetime_value || 0), 0).toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Avg LTV</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${customers.length > 0 ? (customers.reduce((sum, customer) => sum + (customer.lifetime_value || 0), 0) / customers.length).toFixed(0) : 0}
                </p>
              </div>
              <Calendar className="text-purple-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>Manage your customer base and their account details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Lifetime Value</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {customer.personal_info?.first_name} {customer.personal_info?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {customer.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {customer.contact_info?.email}
                      </div>
                      {customer.contact_info?.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {customer.contact_info.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{customer.active_policies || 0}</div>
                      <div className="text-xs text-gray-500">
                        {customer.total_policies || 0} total
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      ${(customer.lifetime_value || 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.user_info?.last_login ? 
                      new Date(customer.user_info.last_login).toLocaleDateString() : 
                      'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.user_info?.status === 'active' ? 'default' : 'secondary'}>
                      {customer.user_info?.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}