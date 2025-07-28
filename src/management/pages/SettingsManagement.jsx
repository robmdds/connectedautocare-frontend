import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings, DollarSign, Percent, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function SettingsManagement() {
  const [settings, setSettings] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
    loadContactInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/settings`;

      const response = await fetch(endpoint, {
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
      setSettings(data.data || data);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set mock data for demo
      setSettings({
        discounts: {
          wholesale_discount: 0.15,
          volume_discount_threshold: 10,
          volume_discount_rate: 0.05
        },
        fees: {
          admin_fee: 25.00,
          processing_fee: 15.00,
          dealer_fee: 50.00
        },
        markups: {
          retail_markup: 1.0,
          wholesale_markup: 0.85
        }
      });
    }
  };

  const loadContactInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/contact`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load contact info: ${errorText}`);
      }

      const data = await response.json();
      setContactInfo(data.data || data);
      setLoading(false);
      
    } catch (error) {
      console.error('Failed to load contact info:', error);
      // Set mock data for demo
      setContactInfo({
        phone: '1-(866) 660-7003',
        email: 'support@connectedautocare.com',
        support_hours: '24/7',
        data_source: 'hardcoded'
      });
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/settings`;

      const response = await fetch(endpoint, {
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
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveContactInfo = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' || 'https://api.connectedautocare.com';
      const endpoint = `${API_BASE_URL}/api/admin/contact`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactInfo),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save contact info: ${errorText}`);
      }
      
    } catch (error) {
      console.error('Failed to save contact info:', error);
      setError(error.message);
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and business settings</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricing">Pricing & Fees</TabsTrigger>
          <TabsTrigger value="contact">Contact Information</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>Configure administrative and processing fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin_fee">Administrative Fee ($)</Label>
                  <Input
                    id="admin_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.admin_fee || 0}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      fees: { ...prev.fees, admin_fee: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="processing_fee">Processing Fee ($)</Label>
                  <Input
                    id="processing_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.processing_fee || 0}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      fees: { ...prev.fees, processing_fee: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dealer_fee">Dealer Fee ($)</Label>
                  <Input
                    id="dealer_fee"
                    type="number"
                    step="0.01"
                    value={settings.fees?.dealer_fee || 0}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      fees: { ...prev.fees, dealer_fee: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Fee Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Markup Structure</CardTitle>
                <CardDescription>Configure pricing multipliers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="retail_markup">Retail Markup</Label>
                  <Input
                    id="retail_markup"
                    type="number"
                    step="0.01"
                    value={settings.markups?.retail_markup || 1}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      markups: { ...prev.markups, retail_markup: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="wholesale_markup">Wholesale Markup</Label>
                  <Input
                    id="wholesale_markup"
                    type="number"
                    step="0.01"
                    value={settings.markups?.wholesale_markup || 0.85}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      markups: { ...prev.markups, wholesale_markup: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Markup Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
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
              <div>
                <Label htmlFor="support_hours">Support Hours</Label>
                <Input
                  id="support_hours"
                  value={contactInfo.support_hours || ''}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, support_hours: e.target.value }))}
                  placeholder="24/7"
                />
              </div>
              <Button onClick={saveContactInfo} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Contact Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount Configuration</CardTitle>
              <CardDescription>Manage wholesale and volume discounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wholesale_discount">Wholesale Discount Rate</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="wholesale_discount"
                    className="pl-10"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.discounts?.wholesale_discount || 0.15}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      discounts: { ...prev.discounts, wholesale_discount: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current: {((settings.discounts?.wholesale_discount || 0.15) * 100).toFixed(1)}%
                </p>
              </div>
              
              <div>
                <Label htmlFor="volume_threshold">Volume Discount Threshold</Label>
                <Input
                  id="volume_threshold"
                  type="number"
                  min="1"
                  value={settings.discounts?.volume_discount_threshold || 10}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    discounts: { ...prev.discounts, volume_discount_threshold: parseInt(e.target.value) }
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum policies for volume discount
                </p>
              </div>
              
              <div>
                <Label htmlFor="volume_rate">Volume Discount Rate</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="volume_rate"
                    className="pl-10"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.discounts?.volume_discount_rate || 0.05}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      discounts: { ...prev.discounts, volume_discount_rate: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current: {((settings.discounts?.volume_discount_rate || 0.05) * 100).toFixed(1)}%
                </p>
              </div>
              
              <Button onClick={saveSettings} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Discount Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}