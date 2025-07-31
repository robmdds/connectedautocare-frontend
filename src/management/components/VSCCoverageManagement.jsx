import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  DollarSign,
  Tag,
  Settings,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  RefreshCw,
  Calculator,
  Car,
  Database,
  BarChart3,
  FileText,
  Eye,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { apiCall } from '../lib/auth';

export default function VSCCoverageManagement() {
  const [coverageLevels, setCoverageLevels] = useState([]);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [baseRates, setBaseRates] = useState([]);
  const [rateMatrix, setRateMatrix] = useState([]);
  const [multipliers, setMultipliers] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coverage-levels');
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bulkImportData, setBulkImportData] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showMultiplierDialog, setShowMultiplierDialog] = useState(false);
  const [editingMultiplierType, setEditingMultiplierType] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCoverageLevels(),
        loadVehicleClasses(),
        loadBaseRates(),
        loadRateMatrix(),
        loadMultipliers(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load VSC data:', error);
      showNotification('Failed to load VSC data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCoverageLevels = async () => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/coverage-levels');
      if (response.success && status === 200 && Array.isArray(response.data.coverage_levels)) {
        const validLevels = response.data.coverage_levels
          .filter(level =>
            level.id &&
            level.level_code &&
            level.level_name &&
            level.description &&
            level.display_order !== undefined &&
            level.active !== undefined
          )
          .sort((a, b) => a.display_order - b.display_order);
        setCoverageLevels(validLevels);
        if (validLevels.length !== response.data.coverage_levels.length) {
          showNotification('Some coverage levels were invalid and filtered out', 'error');
        }
      } else {
        showNotification('Invalid coverage levels response', 'error');
      }
    } catch (error) {
      console.error('Failed to load coverage levels:', error);
      showNotification('Failed to load coverage levels', 'error');
    }
  };

  const loadBaseRates = async () => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/base-rates');
      if (response.success && status === 200 && Array.isArray(response.data.base_rates)) {
        const validRates = response.data.base_rates
          .filter(rate =>
            rate.id &&
            rate.vehicle_class &&
            rate.coverage_level &&
            rate.base_rate !== undefined &&
            rate.effective_date &&
            rate.active !== undefined
          )
          .sort((a, b) => a.vehicle_class.localeCompare(b.vehicle_class) || a.base_rate - b.base_rate);
        setBaseRates(validRates);
        if (validRates.length !== response.data.base_rates.length) {
          showNotification('Some base rates were invalid and filtered out', 'error');
        }
      } else {
        showNotification('Invalid base rates response', 'error');
      }
    } catch (error) {
      console.error('Failed to load base rates:', error);
      showNotification('Failed to load base rates', 'error');
    }
  };

  const loadVehicleClasses = async () => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/vehicle-classes');
      if (response.success && status === 200 && Array.isArray(response.data.vehicle_classifications)) {
        const validClasses = response.data.vehicle_classifications
          .filter(vClass => 
            vClass.id &&
            vClass.make &&
            vClass.vehicle_class &&
            vClass.active !== undefined
          )
          .map(vClass => ({
            ...vClass,
            make_name: vClass.make // Map 'make' to 'make_name' for UI compatibility
          }))
          .sort((a, b) => a.vehicle_class.localeCompare(b.vehicle_class) || a.make_name.localeCompare(b.make_name));
        setVehicleClasses(validClasses);
        if (validClasses.length !== response.data.vehicle_classifications.length) {
          showNotification('Some vehicle classes were invalid and filtered out', 'error');
        }
      } else {
        showNotification('Invalid vehicle classes response', 'error');
      }
    } catch (error) {
      console.error('Failed to load vehicle classes:', error);
      showNotification('Failed to load vehicle classes', 'error');
    }
  };

  const loadRateMatrix = async () => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/rates?per_page=100');
      if (response.success && status === 200 && Array.isArray(response.data.rates)) {
        const validRates = response.data.rates
          .filter(rate =>
            rate.id &&
            rate.vehicle_class &&
            rate.coverage_level &&
            rate.term_months !== undefined &&
            rate.mileage_range_key &&
            rate.min_mileage !== undefined &&
            rate.max_mileage !== undefined &&
            rate.rate_amount !== undefined
          )
          .sort((a, b) => 
            a.vehicle_class.localeCompare(b.vehicle_class) || 
            a.coverage_level.localeCompare(b.coverage_level) || 
            a.term_months - b.term_months
          );
        setRateMatrix(validRates);
        if (validRates.length !== response.data.rates.length) {
          showNotification('Some rates were invalid and filtered out', 'error');
        }
      } else {
        showNotification('Invalid rate matrix response', 'error');
      }
    } catch (error) {
      console.error('Failed to load rate matrix:', error);
      showNotification('Failed to load rate matrix', 'error');
    }
  };

  const loadMultipliers = async () => {
    try {
      const types = ['term', 'mileage'];
      const multiplierData = {};

      for (const type of types) {
        const [response, status] = await apiCall(`/api/admin/vsc/multipliers/${type}`);
        if (response.success && status === 200 && Array.isArray(response.data.multipliers)) {
          // Improved filtering logic for different multiplier types
          multiplierData[type] = response.data.multipliers.filter(multiplier => {
            // Basic validation
            if (!multiplier.id || multiplier.multiplier === undefined) {
              return false;
            }
            
            // Type-specific validation
            switch (type) {
              case 'term':
                return multiplier.term_months !== undefined;
              case 'deductible':
                return multiplier.deductible_amount !== undefined;
              case 'mileage':
              case 'age':
                return multiplier.category !== undefined;
              default:
                return true;
            }
          });
        } else {
          console.error(`Invalid response for ${type} multipliers:`, response);
          showNotification(`Failed to load ${type} multipliers`, 'error');
          multiplierData[type] = [];
        }
      }

      setMultipliers(multiplierData);
      
      // More specific error reporting
      const emptyTypes = Object.entries(multiplierData)
        .filter(([type, data]) => data.length === 0)
        .map(([type]) => type);
      
      if (emptyTypes.length > 0) {
        showNotification(`Could not load multipliers for: ${emptyTypes.join(', ')}`, 'error');
      }
    } catch (error) {
      console.error('Failed to load multipliers:', error);
      showNotification('Failed to load multipliers', 'error');
    }
  };

  const loadAnalytics = async () => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/analytics/rates-summary');
      if (response.success && status === 200 && response.data?.summary) {
        setAnalytics(response.data);
      } else {
        showNotification('Invalid analytics response', 'error');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      showNotification('Failed to load analytics', 'error');
    }
  };

  const createCoverageLevel = async (levelData) => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/coverage-levels', {
        method: 'POST',
        body: JSON.stringify(levelData),
      });

      if (response.success && status === 200) {
        await loadCoverageLevels();
        showNotification('Coverage level created successfully');
        setShowCreateDialog(false); // Close create dialog
      } else {
        showNotification('Failed to create coverage level', 'error');
      }
    } catch (error) {
      console.error('Failed to create coverage level:', error);
      showNotification('Failed to create coverage level', 'error');
    }
  };

  const updateCoverageLevel = async (id, levelData) => {
    try {
      const [response, status] = await apiCall(`/api/admin/vsc/coverage-levels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(levelData),
      });

      if (response.success && status === 200) {
        await loadCoverageLevels();
        showNotification('Coverage level updated successfully');
        setEditingItem(null); // Close dialog
      } else {
        showNotification('Failed to update coverage level', 'error');
      }
    } catch (error) {
      console.error('Failed to update coverage level:', error);
      showNotification('Failed to update coverage level', 'error');
    }
  };

  const createVehicleClass = async (classData) => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/vehicle-classes', {
        method: 'POST',
        body: JSON.stringify(classData),
      });

      if (response.success && status === 200) {
        await loadVehicleClasses();
        showNotification('Vehicle classification created successfully');
        setShowCreateDialog(false); // Close create dialog
      } else {
        showNotification('Failed to create vehicle classification', 'error');
      }
    } catch (error) {
      console.error('Failed to create vehicle classification:', error);
      showNotification('Failed to create vehicle classification', 'error');
    }
  };

  const updateVehicleClass = async (id, classData) => {
    try {
      const [response, status] = await apiCall(`/api/admin/vsc/vehicle-classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(classData),
      });

      if (response.success && status === 200) {
        await loadVehicleClasses();
        showNotification('Vehicle classification updated successfully');
        setEditingItem(null); // Close dialog
      } else {
        showNotification('Failed to update vehicle classification', 'error');
      }
    } catch (error) {
      console.error('Failed to update vehicle classification:', error);
      showNotification('Failed to update vehicle classification', 'error');
    }
  };

  const createBaseRate = async (rateData) => {
    try {
      const [response, status] = await apiCall('/api/admin/vsc/base-rates', {
        method: 'POST',
        body: JSON.stringify(rateData),
      });

      if (response.success && status === 200) {
        await loadBaseRates();
        showNotification('Base rate created successfully');
        setShowCreateDialog(false); // Close create dialog
      } else {
        showNotification('Failed to create base rate', 'error');
      }
    } catch (error) {
      console.error('Failed to create base rate:', error);
      showNotification('Failed to create base rate', 'error');
    }
  };

  const updateBaseRate = async (id, rateData) => {
    try {
      const [response, status] = await apiCall(`/api/admin/vsc/base-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rateData),
      });

      if (response.success && status === 200) {
        await loadBaseRates();
        showNotification('Base rate updated successfully');
        setEditingItem(null); // Close dialog
      } else {
        showNotification('Failed to update base rate', 'error');
      }
    } catch (error) {
      console.error('Failed to update base rate:', error);
      showNotification('Failed to update base rate', 'error');
    }
  };

  const bulkImportRates = async () => {
    try {
      const rates = JSON.parse(bulkImportData);
      const response = await apiCall('/api/admin/vsc/rates/bulk', {
        method: 'POST',
        body: JSON.stringify({ rates }),
      });

      if (response.success) {
        await loadRateMatrix();
        showNotification(`Bulk import completed: ${response.data.imported_count} rates processed`);
        setShowBulkDialog(false);
        setBulkImportData('');
      }
    } catch (error) {
      console.error('Failed to bulk import rates:', error);
      showNotification('Failed to bulk import rates', 'error');
    }
  };

  const exportRates = async (format = 'csv') => {
    try {
      const params = new URLSearchParams({ format });
      if (filterClass !== 'all') params.append('vehicle_class', filterClass);
      if (filterLevel !== 'all') params.append('coverage_level', filterLevel);

      const response = await fetch(`/api/admin/vsc/export/rates?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vsc_rates_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vsc_rates_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
        showNotification('Export completed successfully');
      }
    } catch (error) {
      console.error('Failed to export rates:', error);
      showNotification('Failed to export rates', 'error');
    }
  };

  const clearCache = async () => {
    try {
      const response = await apiCall('/api/admin/vsc/cache/clear', {
        method: 'POST',
      });

      if (response.success) {
        showNotification('Cache cleared successfully');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showNotification('Failed to clear cache', 'error');
    }
  };

  const updateRate = async (id, rateData) => {
    try {
      const [response, status] = await apiCall(`/api/admin/vsc/rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rateData),
      });

      if (response.success && status === 200) {
        await loadRateMatrix();
        showNotification('Rate updated successfully');
        setEditingItem(null); // Close dialog
      } else {
        showNotification('Failed to update rate', 'error');
      }
    } catch (error) {
      console.error('Failed to update rate:', error);
      showNotification('Failed to update rate', 'error');
    }
  };

  const handleEditMultiplier = (multiplier, type) => {
    setEditingItem(multiplier);
    setEditingMultiplierType(type);
    setShowMultiplierDialog(true);
  };

  const updateMultiplier = async (id, multiplierData, type) => {
    try {
      const [response, status] = await apiCall(`/api/admin/vsc/multipliers/${type}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(multiplierData),
      });

      if (response.success && status === 200) {
        await loadMultipliers();
        showNotification(`${type} multiplier updated successfully`);
        setEditingItem(null); // Close dialog
        setShowMultiplierDialog(false); // Close multiplier dialog
        setEditingMultiplierType(null); // Reset type
      } else {
        showNotification(`Failed to update ${type} multiplier`, 'error');
      }
    } catch (error) {
      console.error(`Failed to update ${type} multiplier:`, error);
      showNotification(`Failed to update ${type} multiplier`, 'error');
    }
  };

  // Filter functions
  const filteredRateMatrix = rateMatrix.filter((rate) => {
    const matchesSearch =
      searchTerm === '' ||
      rate.vehicle_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.coverage_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.mileage_range_key.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = filterClass === 'all' || rate.vehicle_class === filterClass;
    const matchesLevel = filterLevel === 'all' || rate.coverage_level === filterLevel;

    return matchesSearch && matchesClass && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Alert className={notification.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{notification.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            VSC Coverage Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Vehicle Service Contract coverage levels, rates, and classifications
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={clearCache}>
            <Database className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
          <Button onClick={() => setShowBulkDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Rates</p>
                  <p className="text-2xl font-bold">{analytics.summary.total_rates}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Classes</p>
                  <p className="text-2xl font-bold">{analytics.summary.vehicle_classes}</p>
                </div>
                <Car className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage Levels</p>
                  <p className="text-2xl font-bold">{analytics.summary.coverage_levels}</p>
                </div>
                <Settings className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rate</p>
                  <p className="text-2xl font-bold">${analytics.summary.rate_range.average}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="coverage-levels">Coverage Levels</TabsTrigger>
          <TabsTrigger value="vehicle-classes">Vehicle Classes</TabsTrigger>
          <TabsTrigger value="base-rates">Base Rates</TabsTrigger>
          <TabsTrigger value="rate-matrix">Rate Matrix</TabsTrigger>
          <TabsTrigger value="multipliers">Multipliers</TabsTrigger>
        </TabsList>

        {/* Coverage Levels Tab */}
        <TabsContent value="coverage-levels" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Coverage Levels ({coverageLevels.length})</h3>
            <Dialog open={showCreateDialog && activeTab === 'coverage-levels'} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Coverage Level
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Coverage Level</DialogTitle>
                  <DialogDescription>Add a new VSC coverage level</DialogDescription>
                </DialogHeader>
                <CoverageLevelForm onSave={createCoverageLevel} onCancel={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverageLevels.map((level, index) => (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <CardTitle className="text-lg">{level.level_name}</CardTitle>
                      </div>
                      <Badge variant={level.active ? 'default' : 'secondary'}>
                        {level.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>{level.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Level Code</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {level.level_code}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Display Order</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {level.display_order}
                      </p>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(level)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Vehicle Classes Tab */}
        <TabsContent value="vehicle-classes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vehicle Classifications ({vehicleClasses.length})</h3>
            <Dialog open={showCreateDialog && activeTab === 'vehicle-classes'} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Vehicle Classification</DialogTitle>
                  <DialogDescription>Add a new vehicle make classification</DialogDescription>
                </DialogHeader>
                <VehicleClassForm onSave={createVehicleClass} onCancel={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleClasses.map((vClass, index) => (
              <motion.div
                key={vClass.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Car className="w-5 h-5 text-green-500" />
                        <CardTitle className="text-lg">{vClass.make_name}</CardTitle>
                      </div>
                      <Badge
                        variant={
                          vClass.vehicle_class === 'A'
                            ? 'default'
                            : vClass.vehicle_class === 'B'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        Class {vClass.vehicle_class}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Classification</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {vClass.vehicle_class === 'A' && 'Most Reliable (Lowest Rates)'}
                        {vClass.vehicle_class === 'B' && 'Moderate Risk (Medium Rates)'}
                        {vClass.vehicle_class === 'C' && 'Higher Risk (Highest Rates)'}
                      </p>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(vClass)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Base Rates Tab */}
        <TabsContent value="base-rates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Base Rates ({baseRates.length})</h3>
            <Dialog open={showCreateDialog && activeTab === 'base-rates'} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Base Rate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Base Rate</DialogTitle>
                  <DialogDescription>Add a new base rate for vehicle class and coverage level</DialogDescription>
                </DialogHeader>
                <BaseRateForm onSave={createBaseRate} onCancel={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {baseRates.map((rate, index) => (
              <motion.div
                key={rate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <CardTitle className="text-lg">
                          Class {rate.vehicle_class} - {rate.coverage_level}
                        </CardTitle>
                      </div>
                      <Badge variant={rate.active ? 'default' : 'secondary'}>
                        {rate.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Base Rate</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-semibold">${rate.base_rate}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Effective Date</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(rate.effective_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(rate)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Rate Matrix Tab */}
        <TabsContent value="rate-matrix" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search rates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="A">Class A</SelectItem>
                <SelectItem value="B">Class B</SelectItem>
                <SelectItem value="C">Class C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportRates('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Rate Matrix ({filteredRateMatrix.length} rates)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vehicle Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Coverage Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Term (Months)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mileage Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rate Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRateMatrix.slice(0, 50).map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            rate.vehicle_class === 'A'
                              ? 'default'
                              : rate.vehicle_class === 'B'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          Class {rate.vehicle_class}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="capitalize">
                          {rate.coverage_level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {rate.term_months}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {rate.mileage_range_key}
                        <div className="text-xs text-gray-500">
                          {rate.min_mileage?.toLocaleString()} - {rate.max_mileage?.toLocaleString()} miles
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm font-semibold">${rate.rate_amount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => setEditingItem(rate)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRateMatrix.length > 50 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing first 50 of {filteredRateMatrix.length} rates. Use filters to narrow results.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Multipliers Tab */}
        <TabsContent value="multipliers" className="space-y-6">
          <h3 className="text-lg font-semibold">Pricing Multipliers</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(multipliers).map(([type, data]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="capitalize">{type} Multipliers</CardTitle>
                  <CardDescription>Adjust pricing based on {type} factors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data || []).slice(0, 6).map((multiplier) => (
                      <div key={multiplier.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {type === 'term' && `${multiplier.term_months} months`}
                            {type === 'mileage' && multiplier.category}
                          </div>
                          {multiplier.description && (
                            <div className="text-sm text-gray-500">{multiplier.description}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{multiplier.multiplier}x</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMultiplier(multiplier, type)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(data || []).length > 6 && (
                      <div className="text-center">
                        <Button variant="outline" size="sm">
                          View All {data.length} {type} multipliers
                        </Button>
                      </div>
                    )}
                    {(data || []).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p>No {type} multipliers found</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={loadMultipliers}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Loading
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Import VSC Rates</DialogTitle>
            <DialogDescription>
              Import multiple rates using JSON format. Maximum 1000 rates per import.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rate Data (JSON Format)</Label>
              <Textarea
                value={bulkImportData}
                onChange={(e) => setBulkImportData(e.target.value)}
                placeholder={`[
                  {
                    "vehicle_class": "A",
                    "coverage_level": "gold",
                    "term_months": 36,
                    "mileage_range_key": "0_50k",
                    "min_mileage": 0,
                    "max_mileage": 50000,
                    "rate_amount": 1200.00
                  }
                ]`}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={bulkImportRates} disabled={!bulkImportData.trim()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Rates
              </Button>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialogs */}
      {editingItem && activeTab === 'coverage-levels' && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Coverage Level</DialogTitle>
              <DialogDescription>Modify the details of the selected VSC coverage level.</DialogDescription>
            </DialogHeader>
            <CoverageLevelForm
              level={editingItem}
              onSave={(data) => updateCoverageLevel(editingItem.id, data)}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingItem && activeTab === 'vehicle-classes' && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vehicle Classification</DialogTitle>
              <DialogDescription>Modify the details of the selected Vehicle Classification.</DialogDescription>
            </DialogHeader>
            <VehicleClassForm
              vehicleClass={editingItem}
              onSave={(data) => updateVehicleClass(editingItem.id, data)}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingItem && activeTab === 'base-rates' && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Base Rate</DialogTitle>
              <DialogDescription>Modify the details of the selected Base Rate.</DialogDescription>
            </DialogHeader>
            <BaseRateForm
              baseRate={editingItem}
              onSave={(data) => updateBaseRate(editingItem.id, data)}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingItem && activeTab === 'rate-matrix' && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rate</DialogTitle>
              <DialogDescription>Modify the details of the selected rate.</DialogDescription>
            </DialogHeader>
            <RateForm
              rate={editingItem}
              onSave={(data) => updateRate(editingItem.id, data)}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      {/* Multiplier Edit Dialog */}
      {editingItem && showMultiplierDialog && (
        <Dialog open={showMultiplierDialog} onOpenChange={() => {
          setShowMultiplierDialog(false);
          setEditingItem(null);
          setEditingMultiplierType(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editingMultiplierType} Multiplier</DialogTitle>
              <DialogDescription>
                Modify the multiplier value for this {editingMultiplierType} factor.
              </DialogDescription>
            </DialogHeader>
            <MultiplierForm
              multiplier={editingItem}
              type={editingMultiplierType}
              onSave={(data) => updateMultiplier(editingItem.id, data, editingMultiplierType)}
              onCancel={() => {
                setShowMultiplierDialog(false);
                setEditingItem(null);
                setEditingMultiplierType(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Coverage Level Form Component
function CoverageLevelForm({ level, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    level_code: level?.level_code || '',
    level_name: level?.level_name || '',
    description: level?.description || '',
    display_order: level?.display_order || 999,
    active: level?.active ?? true,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.level_code.trim()) {
      newErrors.level_code = 'Level code is required';
    }

    if (!formData.level_name.trim()) {
      newErrors.level_name = 'Level name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="level_code">Level Code *</Label>
          <Input
            id="level_code"
            value={formData.level_code}
            onChange={(e) => setFormData((prev) => ({ ...prev, level_code: e.target.value.toLowerCase() }))}
            placeholder="gold"
            className={errors.level_code ? 'border-red-500' : ''}
          />
          {errors.level_code && <p className="text-red-500 text-sm mt-1">{errors.level_code}</p>}
        </div>
        <div>
          <Label htmlFor="level_name">Level Name *</Label>
          <Input
            id="level_name"
            value={formData.level_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, level_name: e.target.value }))}
            placeholder="Gold Coverage"
            className={errors.level_name ? 'border-red-500' : ''}
          />
          {errors.level_name && <p className="text-red-500 text-sm mt-1">{errors.level_name}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enhanced vehicle service contract with expanded coverage"
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <Label htmlFor="display_order">Display Order</Label>
        <Input
          id="display_order"
          type="number"
          min="1"
          value={formData.display_order}
          onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 999 }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Vehicle Class Form Component
function VehicleClassForm({ vehicleClass, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    make_name: vehicleClass?.make_name || '',
    vehicle_class: vehicleClass?.vehicle_class || 'B',
    active: vehicleClass?.active ?? true,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.make_name.trim()) {
      newErrors.make_name = 'Make name is required';
    }

    if (!['A', 'B', 'C'].includes(formData.vehicle_class)) {
      newErrors.vehicle_class = 'Vehicle class must be A, B, or C';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="make_name">Vehicle Make *</Label>
        <Input
          id="make_name"
          value={formData.make_name}
          onChange={(e) => setFormData((prev) => ({ ...prev, make_name: e.target.value }))}
          placeholder="Honda"
          className={errors.make_name ? 'border-red-500' : ''}
        />
        {errors.make_name && <p className="text-red-500 text-sm mt-1">{errors.make_name}</p>}
      </div>

      <div>
        <Label htmlFor="vehicle_class">Vehicle Class *</Label>
        <Select
          value={formData.vehicle_class}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicle_class: value }))}
        >
          <SelectTrigger className={errors.vehicle_class ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select vehicle class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Class A - Most Reliable (Lowest Rates)</SelectItem>
            <SelectItem value="B">Class B - Moderate Risk (Medium Rates)</SelectItem>
            <SelectItem value="C">Class C - Higher Risk (Highest Rates)</SelectItem>
          </SelectContent>
        </Select>
        {errors.vehicle_class && <p className="text-red-500 text-sm mt-1">{errors.vehicle_class}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Base Rate Form Component
function BaseRateForm({ baseRate, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    vehicle_class: baseRate?.vehicle_class || 'B',
    coverage_level: baseRate?.coverage_level || 'gold',
    base_rate: baseRate?.base_rate || '',
    effective_date: baseRate?.effective_date
      ? baseRate.effective_date.split('T')[0]
      : new Date().toISOString().split('T')[0],
    active: baseRate?.active ?? true,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!['A', 'B', 'C'].includes(formData.vehicle_class)) {
      newErrors.vehicle_class = 'Vehicle class must be A, B, or C';
    }

    if (!formData.coverage_level.trim()) {
      newErrors.coverage_level = 'Coverage level is required';
    }

    if (!formData.base_rate || isNaN(formData.base_rate) || parseFloat(formData.base_rate) <= 0) {
      newErrors.base_rate = 'Valid base rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        base_rate: parseFloat(formData.base_rate),
      };
      onSave(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicle_class">Vehicle Class *</Label>
          <Select
            value={formData.vehicle_class}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicle_class: value }))}
          >
            <SelectTrigger className={errors.vehicle_class ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select vehicle class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Class A</SelectItem>
              <SelectItem value="B">Class B</SelectItem>
              <SelectItem value="C">Class C</SelectItem>
            </SelectContent>
          </Select>
          {errors.vehicle_class && <p className="text-red-500 text-sm mt-1">{errors.vehicle_class}</p>}
        </div>
        <div>
          <Label htmlFor="coverage_level">Coverage Level *</Label>
          <Select
            value={formData.coverage_level}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, coverage_level: value }))}
          >
            <SelectTrigger className={errors.coverage_level ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select coverage level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
          {errors.coverage_level && <p className="text-red-500 text-sm mt-1">{errors.coverage_level}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="base_rate">Base Rate (USD) *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="base_rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_rate}
            onChange={(e) => setFormData((prev) => ({ ...prev, base_rate: e.target.value }))}
            placeholder="1200.00"
            className={`pl-10 ${errors.base_rate ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.base_rate && <p className="text-red-500 text-sm mt-1">{errors.base_rate}</p>}
      </div>

      <div>
        <Label htmlFor="effective_date">Effective Date</Label>
        <Input
          id="effective_date"
          type="date"
          value={formData.effective_date}
          onChange={(e) => setFormData((prev) => ({ ...prev, effective_date: e.target.value }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MultiplierForm({ multiplier, type, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    multiplier: multiplier?.multiplier || 1.0,
    description: multiplier?.description || '',
    active: multiplier?.active ?? true,
    // Type-specific fields
    term_months: multiplier?.term_months || '',
    deductible_amount: multiplier?.deductible_amount || '',
    category: multiplier?.category || '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.multiplier || isNaN(formData.multiplier) || parseFloat(formData.multiplier) <= 0) {
      newErrors.multiplier = 'Valid multiplier value is required';
    }

    // Type-specific validation
    if (type === 'term' && (!formData.term_months || formData.term_months <= 0)) {
      newErrors.term_months = 'Valid term in months is required';
    }

    if (type === 'deductible' && (!formData.deductible_amount || formData.deductible_amount <= 0)) {
      newErrors.deductible_amount = 'Valid deductible amount is required';
    }

    if ((type === 'mileage' || type === 'age') && !formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        multiplier: parseFloat(formData.multiplier),
      };

      // Include only relevant fields based on type
      if (type === 'term') {
        submitData.term_months = parseInt(formData.term_months);
      } else if (type === 'deductible') {
        submitData.deductible_amount = parseFloat(formData.deductible_amount);
      }

      onSave(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="multiplier">Multiplier Value *</Label>
        <Input
          id="multiplier"
          type="number"
          step="0.001"
          min="0"
          value={formData.multiplier}
          onChange={(e) => setFormData((prev) => ({ ...prev, multiplier: e.target.value }))}
          placeholder="1.25"
          className={errors.multiplier ? 'border-red-500' : ''}
        />
        {errors.multiplier && <p className="text-red-500 text-sm mt-1">{errors.multiplier}</p>}
      </div>

      {/* Type-specific fields */}
      {type === 'term' && (
        <div>
          <Label htmlFor="term_months">Term (Months) *</Label>
          <Input
            id="term_months"
            type="number"
            min="1"
            value={formData.term_months}
            onChange={(e) => setFormData((prev) => ({ ...prev, term_months: e.target.value }))}
            placeholder="36"
            className={errors.term_months ? 'border-red-500' : ''}
          />
          {errors.term_months && <p className="text-red-500 text-sm mt-1">{errors.term_months}</p>}
        </div>
      )}

      {type === 'deductible' && (
        <div>
          <Label htmlFor="deductible_amount">Deductible Amount *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="deductible_amount"
              type="number"
              step="0.001"
              min="0"
              value={formData.deductible_amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, deductible_amount: e.target.value }))}
              placeholder="500"
              className={`pl-10 ${errors.deductible_amount ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.deductible_amount && <p className="text-red-500 text-sm mt-1">{errors.deductible_amount}</p>}
        </div>
      )}

      {(type === 'mileage' || type === 'age') && (
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            placeholder={type === 'mileage' ? 'High Mileage' : 'New Vehicle'}
            className={errors.category ? 'border-red-500' : ''}
          />
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description for this multiplier"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RateForm({ rate, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    vehicle_class: rate?.vehicle_class || 'B',
    coverage_level: rate?.coverage_level || 'gold',
    term_months: rate?.term_months || '',
    mileage_range_key: rate?.mileage_range_key || '',
    min_mileage: rate?.min_mileage || '',
    max_mileage: rate?.max_mileage || '',
    rate_amount: rate?.rate_amount || '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!['A', 'B', 'C'].includes(formData.vehicle_class)) {
      newErrors.vehicle_class = 'Vehicle class must be A, B, or C';
    }

    if (!formData.coverage_level.trim()) {
      newErrors.coverage_level = 'Coverage level is required';
    }

    if (!formData.term_months || isNaN(formData.term_months) || parseInt(formData.term_months) <= 0) {
      newErrors.term_months = 'Valid term in months is required';
    }

    if (!formData.mileage_range_key.trim()) {
      newErrors.mileage_range_key = 'Mileage range key is required';
    }

    if (isNaN(formData.min_mileage) || parseInt(formData.min_mileage) < 0) {
      newErrors.min_mileage = 'Valid minimum mileage is required';
    }

    if (isNaN(formData.max_mileage) || parseInt(formData.max_mileage) <= parseInt(formData.min_mileage)) {
      newErrors.max_mileage = 'Max mileage must be greater than min mileage';
    }

    if (!formData.rate_amount || isNaN(formData.rate_amount) || parseFloat(formData.rate_amount) <= 0) {
      newErrors.rate_amount = 'Valid rate amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        term_months: parseInt(formData.term_months),
        min_mileage: parseInt(formData.min_mileage),
        max_mileage: parseInt(formData.max_mileage),
        rate_amount: parseFloat(formData.rate_amount),
      };
      onSave(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicle_class">Vehicle Class *</Label>
          <Select
            value={formData.vehicle_class}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicle_class: value }))}
          >
            <SelectTrigger className={errors.vehicle_class ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select vehicle class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Class A</SelectItem>
              <SelectItem value="B">Class B</SelectItem>
              <SelectItem value="C">Class C</SelectItem>
            </SelectContent>
          </Select>
          {errors.vehicle_class && <p className="text-red-500 text-sm mt-1">{errors.vehicle_class}</p>}
        </div>
        <div>
          <Label htmlFor="coverage_level">Coverage Level *</Label>
          <Select
            value={formData.coverage_level}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, coverage_level: value }))}
          >
            <SelectTrigger className={errors.coverage_level ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select coverage level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
          {errors.coverage_level && <p className="text-red-500 text-sm mt-1">{errors.coverage_level}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="term_months">Term (Months) *</Label>
        <Input
          id="term_months"
          type="number"
          min="1"
          value={formData.term_months}
          onChange={(e) => setFormData((prev) => ({ ...prev, term_months: e.target.value }))}
          placeholder="36"
          className={errors.term_months ? 'border-red-500' : ''}
        />
        {errors.term_months && <p className="text-red-500 text-sm mt-1">{errors.term_months}</p>}
      </div>

      <div>
        <Label htmlFor="mileage_range_key">Mileage Range Key *</Label>
        <Input
          id="mileage_range_key"
          value={formData.mileage_range_key}
          onChange={(e) => setFormData((prev) => ({ ...prev, mileage_range_key: e.target.value }))}
          placeholder="0_50k"
          className={errors.mileage_range_key ? 'border-red-500' : ''}
        />
        {errors.mileage_range_key && <p className="text-red-500 text-sm mt-1">{errors.mileage_range_key}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_mileage">Min Mileage *</Label>
          <Input
            id="min_mileage"
            type="number"
            min="0"
            value={formData.min_mileage}
            onChange={(e) => setFormData((prev) => ({ ...prev, min_mileage: e.target.value }))}
            placeholder="0"
            className={errors.min_mileage ? 'border-red-500' : ''}
          />
          {errors.min_mileage && <p className="text-red-500 text-sm mt-1">{errors.min_mileage}</p>}
        </div>
        <div>
          <Label htmlFor="max_mileage">Max Mileage *</Label>
          <Input
            id="max_mileage"
            type="number"
            min="0"
            value={formData.max_mileage}
            onChange={(e) => setFormData((prev) => ({ ...prev, max_mileage: e.target.value }))}
            placeholder="50000"
            className={errors.max_mileage ? 'border-red-500' : ''}
          />
          {errors.max_mileage && <p className="text-red-500 text-sm mt-1">{errors.max_mileage}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="rate_amount">Rate Amount (USD) *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="rate_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.rate_amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, rate_amount: e.target.value }))}
            placeholder="1200.00"
            className={`pl-10 ${errors.rate_amount ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.rate_amount && <p className="text-red-500 text-sm mt-1">{errors.rate_amount}</p>}
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}