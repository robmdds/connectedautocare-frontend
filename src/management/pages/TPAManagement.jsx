import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Globe,
  Mail,
  Phone,
  Settings,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function TPAManagement() {
  const [tpas, setTpas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTPA, setEditingTPA] = useState(null);
  const [deletingTPA, setDeletingTPA] = useState(null);

  useEffect(() => {
    loadTPAs();
  }, []);

  const loadTPAs = async () => {
    try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
        throw new Error('No authentication token found. Please log in again.');
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
        const endpoint = `${API_BASE_URL}/api/admin/tpas`;

        const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        });
        
        if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
            errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
        }
        
        if (response.status === 503) {
            throw new Error('User management system is not available. Please contact administrator.');
        }
        throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Handle the array response format [responseObject, statusCode]
        let actualData = data;
        
        // Check if data is an array with response object as first element
        if (Array.isArray(data) && data.length >= 1 && typeof data[0] === 'object') {
        actualData = data[0]; // Extract the actual response object
        }
        
        // Handle the success_response format from your backend
        let tpasData = [];
        if (actualData.success) {
        tpasData = actualData.data?.tpas || actualData.data || [];
        } else {
        tpasData = actualData.tpas || actualData || [];
        }
        
        
        // Ensure each TPA has a valid ID
        const validatedTPAs = tpasData.map((tpa, index) => ({
        ...tpa,
        id: tpa.id || `tpa_${Date.now()}_${index}`
        }));

        setTpas(validatedTPAs);
        
    } catch (error) {
        console.error('Failed to load TPAs:', error);
        setError(error.message);
        
        // Set mock data for demo when API fails - ensure IDs are strings
        const mockTPAs = [
        {
            id: `mock_tpa_001_${Date.now()}`,
            name: 'Warranty Solutions Inc',
            api_endpoint: 'https://api.warrantysolutions.com',
            contact_email: 'partners@warrantysolutions.com',
            contact_phone: '555-123-4567',
            status: 'active',
            supported_products: ['vsc', 'hero_home', 'hero_auto'],
            commission_rate: 0.15,
            created_at: '2024-01-15T09:00:00Z'
        },
        {
            id: `mock_tpa_002_${Date.now()}`,
            name: 'Service Contract Corp',
            api_endpoint: 'https://partners.servicecontract.com',
            contact_email: 'api@servicecontract.com',
            contact_phone: '555-987-6543',
            status: 'active',
            supported_products: ['vsc', 'hero_auto'],
            commission_rate: 0.12,
            created_at: '2024-01-10T14:30:00Z'
        }
        ];
        
        setTpas(mockTPAs);
    } finally {
        setLoading(false);
    }
    };

  const saveTPA = async (tpaData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      
      let response;
      if (editingTPA) {
        // Update existing TPA
        const endpoint = `${API_BASE_URL}/api/admin/tpas/${editingTPA.id}`;
        
        response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tpaData),
        });
      } else {
        // Create new TPA
        const endpoint = `${API_BASE_URL}/api/admin/tpas`;
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tpaData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      if (editingTPA) {
        // Update TPA in state
        setTpas(prev => prev.map(tpa => 
          tpa.id === editingTPA.id ? { ...tpa, ...tpaData, updated_at: new Date().toISOString() } : tpa
        ));
      } else {
        // Add new TPA to state
        const newTPA = responseData.success ? responseData.data?.tpa || responseData.data : responseData.tpa || responseData;
        setTpas(prev => [...prev, newTPA]);
      }
      
      setEditingTPA(null);
      setShowCreateDialog(false);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to save TPA:', error);
      setError(error.message);
    }
  };

  const toggleTPAStatus = async (tpaId) => {
    try {
      
      if (!tpaId || tpaId === 'undefined') {
        throw new Error('Invalid TPA ID');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const tpa = tpas.find(t => t.id === tpaId);
      if (!tpa) {
        throw new Error('TPA not found');
      }
      
      const newStatus = tpa.status === 'active' ? 'inactive' : 'active';
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/tpas/${tpaId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Update TPA status in state
      setTpas(prev => prev.map(t => 
        t.id === tpaId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ));
      
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to toggle TPA status:', error);
      setError(error.message);
    }
  };

  const deleteTPA = async (tpaId) => {
    try {
      
      if (!tpaId || tpaId === 'undefined') {
        throw new Error('Invalid TPA ID');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/tpas/${tpaId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Remove TPA from state
      setTpas(prev => prev.filter(t => t.id !== tpaId));
      setDeletingTPA(null);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to delete TPA:', error);
      setError(error.message);
      setDeletingTPA(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TPA Management</h1>
          <p className="text-gray-600 mt-1">Manage Third Party Administrator integrations</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add TPA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New TPA</DialogTitle>
              <DialogDescription>Configure a new Third Party Administrator</DialogDescription>
            </DialogHeader>
            <TPAForm onSave={saveTPA} onCancel={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* TPA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tpas.map((tpa, index) => {
          
          return (
            <motion.div
              key={tpa.id || `tpa-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Building2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <CardTitle className="text-lg truncate" title={tpa.name}>
                        {tpa.name}
                      </CardTitle>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      <Switch
                        checked={tpa.status === 'active'}
                        onCheckedChange={() => {
                          toggleTPAStatus(tpa.id);
                        }}
                        disabled={loading}
                      />
                      <Badge variant={tpa.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {tpa.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    Third Party Administrator • Created {new Date(tpa.created_at).toLocaleDateString()}
                    
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-blue-600 break-all">{tpa.api_endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600 break-all">{tpa.contact_email}</span>
                    </div>
                    {tpa.contact_phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600">{tpa.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Supported Products</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(tpa.supported_products && tpa.supported_products.length > 0) ? (
                        tpa.supported_products.map((product) => (
                          <Badge key={product} variant="outline" className="text-xs">
                            {product.toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic">No products specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Commission Rate</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {((tpa.commission_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTPA(tpa);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeletingTPA(tpa);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {tpas.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No TPAs configured</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first Third Party Administrator</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add TPA
          </Button>
        </div>
      )}

      {/* Edit TPA Dialog */}
      {editingTPA && (
        <Dialog open={!!editingTPA} onOpenChange={() => setEditingTPA(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit TPA</DialogTitle>
              <DialogDescription>Update TPA configuration</DialogDescription>
            </DialogHeader>
            <TPAForm
              tpa={editingTPA}
              onSave={saveTPA}
              onCancel={() => setEditingTPA(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTPA && (
        <Dialog open={!!deletingTPA} onOpenChange={() => setDeletingTPA(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete TPA</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingTPA.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex space-x-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDeletingTPA(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteTPA(deletingTPA.id)}
                disabled={loading}
              >
                Delete TPA
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// TPA Form Component
function TPAForm({ tpa, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: tpa?.name || '',
    api_endpoint: tpa?.api_endpoint || '',
    contact_email: tpa?.contact_email || '',
    contact_phone: tpa?.contact_phone || '',
    status: tpa?.status || 'active',
    supported_products: Array.isArray(tpa?.supported_products) 
      ? tpa.supported_products.join(', ') 
      : (tpa?.supported_products || ''),
    commission_rate: tpa?.commission_rate || 0.15
  });
  
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'TPA Name is required';
    }
    
    if (!formData.api_endpoint.trim()) {
      errors.api_endpoint = 'API Endpoint is required';
    } else if (!formData.api_endpoint.startsWith('http')) {
      errors.api_endpoint = 'API Endpoint must be a valid URL starting with http:// or https://';
    }
    
    if (!formData.contact_email.trim()) {
      errors.contact_email = 'Contact Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      errors.contact_email = 'Please enter a valid email address';
    }
    
    if (formData.commission_rate < 0 || formData.commission_rate > 1) {
      errors.commission_rate = 'Commission rate must be between 0 and 1';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const tpaData = {
      ...formData,
      supported_products: formData.supported_products
        .split(',')
        .map(p => p.trim())
        .filter(p => p),
      commission_rate: parseFloat(formData.commission_rate)
    };
    
    onSave(tpaData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">TPA Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="TPA Name"
            className={formErrors.name ? 'border-red-500' : ''}
          />
          {formErrors.name && (
            <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="api_endpoint">API Endpoint *</Label>
          <Input
            id="api_endpoint"
            value={formData.api_endpoint}
            onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
            placeholder="https://api.example.com"
            className={formErrors.api_endpoint ? 'border-red-500' : ''}
          />
          {formErrors.api_endpoint && (
            <p className="text-sm text-red-500 mt-1">{formErrors.api_endpoint}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_email">Contact Email *</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleInputChange('contact_email', e.target.value)}
            placeholder="contact@tpa.com"
            className={formErrors.contact_email ? 'border-red-500' : ''}
          />
          {formErrors.contact_email && (
            <p className="text-sm text-red-500 mt-1">{formErrors.contact_email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
            placeholder="555-123-4567"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="supported_products">Supported Products (comma-separated)</Label>
        <Input
          id="supported_products"
          value={formData.supported_products}
          onChange={(e) => handleInputChange('supported_products', e.target.value)}
          placeholder="vsc, hero_home, hero_auto"
        />
        <p className="text-sm text-gray-500 mt-1">
          Examples: vsc, hero_home, hero_auto, comprehensive_auto_protection
        </p>
      </div>

      <div>
        <Label htmlFor="commission_rate">Commission Rate (0-1)</Label>
        <Input
          id="commission_rate"
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={formData.commission_rate}
          onChange={(e) => handleInputChange('commission_rate', e.target.value)}
          className={formErrors.commission_rate ? 'border-red-500' : ''}
        />
        {formErrors.commission_rate && (
          <p className="text-sm text-red-500 mt-1">{formErrors.commission_rate}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Enter as decimal (e.g., 0.15 for 15%)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={formData.status === 'active'}
          onCheckedChange={(checked) => handleInputChange('status', checked ? 'active' : 'inactive')}
        />
        <Label htmlFor="status">Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          {tpa ? 'Update TPA' : 'Create TPA'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}