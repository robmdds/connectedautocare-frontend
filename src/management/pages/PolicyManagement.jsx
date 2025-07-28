import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Filter, Plus, Calendar, DollarSign, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../lib/auth';

export default function PolicyManagement() {
  const { user, isCustomer } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      // Mock data for demo
      setPolicies([
        {
          id: 'pol_001',
          policy_number: 'VSC-2024-001',
          product_type: 'VSC Extended Warranty',
          status: 'active',
          effective_date: '2024-01-15',
          expiration_date: '2027-01-15',
          premium: 1200,
          customer_name: isCustomer ? `${user?.profile?.first_name} ${user?.profile?.last_name}` : 'John Doe',
          coverage_details: {
            vehicle: '2020 Honda Accord',
            vin: '1HGCV1F30JA123456',
            coverage_type: 'Gold'
          }
        },
        {
          id: 'pol_002',
          policy_number: 'HHP-2024-002',
          product_type: 'Hero Home Protection',
          status: 'active',
          effective_date: '2024-03-01',
          expiration_date: '2026-03-01',
          premium: 789,
          customer_name: isCustomer ? `${user?.profile?.first_name} ${user?.profile?.last_name}` : 'Jane Smith',
          coverage_details: {
            property: '123 Main St, Anytown, ST 12345',
            coverage_type: 'Standard'
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolicies = policies.filter(policy =>
    policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.product_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isCustomer ? 'My Policies' : 'Policy Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isCustomer ? 'View and manage your insurance policies' : 'Manage customer policies and coverage'}
          </p>
        </div>
        {!isCustomer && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Policy
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search policies..."
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

      {/* Policy Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">{policies.length}</p>
              </div>
              <Shield className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {policies.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Calendar className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${policies.reduce((sum, policy) => sum + (policy.premium || 0), 0).toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Avg Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${policies.length > 0 ? (policies.reduce((sum, policy) => sum + (policy.premium || 0), 0) / policies.length).toFixed(0) : 0}
                </p>
              </div>
              <FileText className="text-purple-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isCustomer ? 'Your Policies' : 'All Policies'} ({filteredPolicies.length})
          </CardTitle>
          <CardDescription>
            {isCustomer ? 'Your active and expired insurance policies' : 'Manage customer policies and their details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Product Type</TableHead>
                {!isCustomer && <TableHead>Customer</TableHead>}
                <TableHead>Coverage Details</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div className="font-medium">{policy.policy_number}</div>
                  </TableCell>
                  <TableCell>{policy.product_type}</TableCell>
                  {!isCustomer && <TableCell>{policy.customer_name}</TableCell>}
                  <TableCell>
                    <div className="text-sm">
                      {policy.coverage_details?.vehicle && (
                        <div>{policy.coverage_details.vehicle}</div>
                      )}
                      {policy.coverage_details?.property && (
                        <div>{policy.coverage_details.property}</div>
                      )}
                      {policy.coverage_details?.vin && (
                        <div className="text-gray-500">VIN: {policy.coverage_details.vin}</div>
                      )}
                      <div className="text-gray-500">
                        {policy.coverage_details?.coverage_type} Coverage
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      ${policy.premium?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      policy.status === 'active' ? 'default' :
                      policy.status === 'expired' ? 'secondary' : 'destructive'
                    }>
                      {policy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(policy.expiration_date).toLocaleDateString()}
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