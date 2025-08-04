import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Settings, DollarSign, Percent, Phone, Mail, 
  Car, Home, AlertCircle, CheckCircle, RefreshCw,
  Database, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function SettingsManagement() {
  const [settings, setSettings] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadSettings();
    loadContactInfo();
  }, []);


  const refreshSettingsCache = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess('Settings cache refreshed successfully');
        await loadSettings(); // Reload settings
      } else {
        throw new Error('Failed to refresh cache');
      }
    } catch (error) {
      setError('Failed to refresh settings cache');
    } finally {
      setSaving(false);
    }
  };

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load settings: ${errorText}`);
      }

      const data = await response.json();
      
      // Parse the response structure correctly
      let settingsData = {};
      
      if (Array.isArray(data) && data[0]) {
        const responseObj = data[0];
        if (responseObj.data) {
          settingsData = responseObj.data;
        }
      } else if (data.data) {
        settingsData = data.data;
      } else {
        settingsData = data;
      }
      
      // Clean up the settings data
      const cleanedSettings = {};
      Object.keys(settingsData).forEach(key => {
        if (!isNaN(key) || key === 'data') {
          return;
        }
        cleanedSettings[key] = settingsData[key];
      });
      
      // Ensure all expected categories exist with defaults
      const defaultSettings = {
        fees: {
          admin_fee: 25.00,
          vsc_admin_fee: 50.00,
          hero_admin_fee: 25.00,
          processing_fee: 15.00,
          dealer_fee: 50.00
        },
        discounts: {
          wholesale_discount: 0.15,
          volume_discount_threshold: 10,
          volume_discount_rate: 0.05,
          early_payment_discount: 0.02
        },
        markups: {
          retail_markup: 1.0,
          wholesale_markup: 0.85,
          dealer_markup: 0.90
        },
        taxes: {
          default_tax_rate: 0.07,
          fl_tax_rate: 0.07,
          ca_tax_rate: 0.0875,
          ny_tax_rate: 0.08,
          tx_tax_rate: 0.0625
        },
        pricing: {
          fl_multiplier: 1.0,
          ca_multiplier: 1.15,
          ny_multiplier: 1.20,
          tx_multiplier: 1.05
        },
        vsc: {
          max_vehicle_age_years: 20,
          max_vehicle_mileage: 200000,
          warning_age_years: 15,
          warning_mileage: 150000
        },
        hero: {
          coverage_multiplier_1000: 1.2,
          coverage_multiplier_500: 1.0,
          default_coverage_limit: 500
        }
      };

      // Merge defaults with loaded settings
      const mergedSettings = { ...defaultSettings };
      Object.keys(cleanedSettings).forEach(category => {
        if (mergedSettings[category]) {
          mergedSettings[category] = { ...mergedSettings[category], ...cleanedSettings[category] };
        } else {
          mergedSettings[category] = cleanedSettings[category];
        }
      });
      
      setSettings(mergedSettings);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Failed to load settings. Using default values.');
      // Set default settings on error
      setSettings({
        fees: { admin_fee: 25.00, vsc_admin_fee: 50.00, hero_admin_fee: 25.00, processing_fee: 15.00, dealer_fee: 50.00 },
        discounts: { wholesale_discount: 0.15, volume_discount_threshold: 10, volume_discount_rate: 0.05 },
        markups: { retail_markup: 1.0, wholesale_markup: 0.85 },
        taxes: { default_tax_rate: 0.07, fl_tax_rate: 0.07, ca_tax_rate: 0.0875 },
        vsc: { max_vehicle_age_years: 20, max_vehicle_mileage: 200000 }
      });
    }
  };

  const loadContactInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data.data || data);
      } else {
        throw new Error('Failed to load contact info');
      }
      
    } catch (error) {
      console.error('Failed to load contact info:', error);
      setContactInfo({
        phone: '1-(866) 660-7003',
        email: 'support@connectedautocare.com',
        support_hours: '24/7'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save settings: ${errorText}`);
      }

      setSuccess('Settings saved successfully! Changes will take effect immediately.');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings Management</h1>
          <p className="text-gray-600 mt-1">Configure database-driven business settings and fees</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshSettingsCache}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Cache
          </Button>
        </div>
      </div>


      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="vsc">VSC Rules</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Administrative Fees
                </CardTitle>
                <CardDescription>Configure product-specific administrative fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin_fee">General Admin Fee ($)</Label>
                  <Input
                    id="admin_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.admin_fee || 0}
                    onChange={(e) => updateSetting('fees', 'admin_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="vsc_admin_fee">VSC Admin Fee ($)</Label>
                  <Input
                    id="vsc_admin_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.vsc_admin_fee || 0}
                    onChange={(e) => updateSetting('fees', 'vsc_admin_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="hero_admin_fee">Hero Products Admin Fee ($)</Label>
                  <Input
                    id="hero_admin_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.hero_admin_fee || 0}
                    onChange={(e) => updateSetting('fees', 'hero_admin_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing & Dealer Fees</CardTitle>
                <CardDescription>Configure additional service fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="processing_fee">Processing Fee ($)</Label>
                  <Input
                    id="processing_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.processing_fee || 0}
                    onChange={(e) => updateSetting('fees', 'processing_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="dealer_fee">Dealer Fee ($)</Label>
                  <Input
                    id="dealer_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.dealer_fee || 0}
                    onChange={(e) => updateSetting('fees', 'dealer_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discounts Tab */}
        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Percent className="w-5 h-5 mr-2" />
                Discount Configuration
              </CardTitle>
              <CardDescription>Manage wholesale, volume, and promotional discounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wholesale_discount">Wholesale Discount Rate</Label>
                <Input
                  id="wholesale_discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.discounts?.wholesale_discount || 0}
                  onChange={(e) => updateSetting('discounts', 'wholesale_discount', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {((settings.discounts?.wholesale_discount || 0) * 100).toFixed(1)}%
                </p>
              </div>
              
              <div>
                <Label htmlFor="volume_threshold">Volume Discount Threshold</Label>
                <Input
                  id="volume_threshold"
                  type="number"
                  min="1"
                  value={settings.discounts?.volume_discount_threshold || 0}
                  onChange={(e) => updateSetting('discounts', 'volume_discount_threshold', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="volume_rate">Volume Discount Rate</Label>
                <Input
                  id="volume_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.discounts?.volume_discount_rate || 0}
                  onChange={(e) => updateSetting('discounts', 'volume_discount_rate', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {((settings.discounts?.volume_discount_rate || 0) * 100).toFixed(1)}%
                </p>
              </div>

              <div>
                <Label htmlFor="early_payment_discount">Early Payment Discount</Label>
                <Input
                  id="early_payment_discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.discounts?.early_payment_discount || 0}
                  onChange={(e) => updateSetting('discounts', 'early_payment_discount', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {((settings.discounts?.early_payment_discount || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Taxes Tab */}
        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Tax Rates by State
              </CardTitle>
              <CardDescription>Configure state-specific tax rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="default_tax">Default Tax Rate</Label>
                <Input
                  id="default_tax"
                  type="number"
                  step="0.0001"
                  value={settings.taxes?.default_tax_rate || 0}
                  onChange={(e) => updateSetting('taxes', 'default_tax_rate', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {((settings.taxes?.default_tax_rate || 0) * 100).toFixed(2)}%
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fl_tax">Florida Tax Rate</Label>
                  <Input
                    id="fl_tax"
                    type="number"
                    step="0.0001"
                    value={settings.taxes?.fl_tax_rate || 0}
                    onChange={(e) => updateSetting('taxes', 'fl_tax_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="ca_tax">California Tax Rate</Label>
                  <Input
                    id="ca_tax"
                    type="number"
                    step="0.0001"
                    value={settings.taxes?.ca_tax_rate || 0}
                    onChange={(e) => updateSetting('taxes', 'ca_tax_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="ny_tax">New York Tax Rate</Label>
                  <Input
                    id="ny_tax"
                    type="number"
                    step="0.0001"
                    value={settings.taxes?.ny_tax_rate || 0}
                    onChange={(e) => updateSetting('taxes', 'ny_tax_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="tx_tax">Texas Tax Rate</Label>
                  <Input
                    id="tx_tax"
                    type="number"
                    step="0.0001"
                    value={settings.taxes?.tx_tax_rate || 0}
                    onChange={(e) => updateSetting('taxes', 'tx_tax_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VSC Rules Tab */}
        <TabsContent value="vsc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="w-5 h-5 mr-2" />
                VSC Eligibility Rules
              </CardTitle>
              <CardDescription>Configure vehicle eligibility requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="max_age">Maximum Vehicle Age (Years)</Label>
                <Input
                  id="max_age"
                  type="number"
                  value={settings.vsc?.max_vehicle_age_years || 0}
                  onChange={(e) => updateSetting('vsc', 'max_vehicle_age_years', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="max_mileage">Maximum Vehicle Mileage</Label>
                <Input
                  id="max_mileage"
                  type="number"
                  value={settings.vsc?.max_vehicle_mileage || 0}
                  onChange={(e) => updateSetting('vsc', 'max_vehicle_mileage', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="warning_age">Warning Age Threshold (Years)</Label>
                <Input
                  id="warning_age"
                  type="number"
                  value={settings.vsc?.warning_age_years || 0}
                  onChange={(e) => updateSetting('vsc', 'warning_age_years', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="warning_mileage">Warning Mileage Threshold</Label>
                <Input
                  id="warning_mileage"
                  type="number"
                  value={settings.vsc?.warning_mileage || 0}
                  onChange={(e) => updateSetting('vsc', 'warning_mileage', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Hero Products Configuration
              </CardTitle>
              <CardDescription>Configure Hero product settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="coverage_1000">Coverage Multiplier ($1000 limit)</Label>
                <Input
                  id="coverage_1000"
                  type="number"
                  step="0.1"
                  value={settings.hero?.coverage_multiplier_1000 || 0}
                  onChange={(e) => updateSetting('hero', 'coverage_multiplier_1000', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="coverage_500">Coverage Multiplier ($500 limit)</Label>
                <Input
                  id="coverage_500"
                  type="number"
                  step="0.1"
                  value={settings.hero?.coverage_multiplier_500 || 0}
                  onChange={(e) => updateSetting('hero', 'coverage_multiplier_500', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="default_limit">Default Coverage Limit ($)</Label>
                <Input
                  id="default_limit"
                  type="number"
                  value={settings.hero?.default_coverage_limit || 0}
                  onChange={(e) => updateSetting('hero', 'default_coverage_limit', parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
              <CardDescription>Update customer support contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Support Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    className="pl-10"
                    value={contactInfo.phone || ''}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="1-(866) 660-7003"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Support Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    className="pl-10"
                    value={contactInfo.email || ''}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="support@connectedautocare.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          size="lg"
          className="px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving Settings...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}