import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Edit, Trash2, Save, X, Package, DollarSign, AlertCircle,
  CheckCircle, RefreshCw, Calculator, Database, Percent
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { apiCall } from '../lib/auth'

export default function EnhancedProductManagement() {
  const [heroProducts, setHeroProducts] = useState({})
  const [systemSettings, setSystemSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    loadProducts()
    loadSystemSettings() // NEW: Load system settings
  }, [])

  // NEW: Load system settings
  const loadSystemSettings = async () => {
    try {
      const [response, stausCode] = await apiCall('/api/admin/system-settings')
      if (response.success) {
        setSystemSettings({
        fees: response.data.settings.fees,
        discounts: response.data.settings.discounts,
        taxes: response.data.settings.taxes,
        hero_settings: response.data.settings.hero_settings,
        database_driven: response.data.database_driven,
        timestamp: response.data.timestamp
      })
      }
    } catch (error) {
      console.error('Failed to load system settings:', error)
      // Set fallback settings
      setSystemSettings({
        fees: { admin_fee: 25.00, processing_fee: 15.00 },
        discounts: { wholesale_discount_rate: 0.15 },
        taxes: { default_tax_rate: 0.08 }
      })
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/api/admin/products')
      
      let actualResponse = response
      if (Array.isArray(response) && response.length >= 1 && typeof response[0] === 'object') {
        actualResponse = response[0]
      }
      
      let responseData = actualResponse
      if (actualResponse && actualResponse.success && actualResponse.data) {
        responseData = actualResponse.data
      }

      if (responseData.products && Array.isArray(responseData.products)) {
        const heroProductsObj = {}
        
        responseData.products.forEach(product => {
          const productKey = product.product_code || `product_${product.id}`
          const category = getCategoryFromProductCode(product.product_code || '')
          const features = generateFeatures(product.product_code || '')
          
          heroProductsObj[productKey] = {
            id: productKey,
            name: product.product_name || 'Unknown Product',
            category: category,
            description: product.description || `${product.product_name} with comprehensive coverage`,
            active: product.active ?? true,
            pricing: product.pricing || {},
            features: features,
            terms_available: product.terms_available || [1, 2, 3],
            base_price: product.base_price || 0,
            min_price: product.min_price || 0,
            max_price: product.max_price || 0,
            product_code: product.product_code,
            created_at: product.created_at,
            pricing_count: product.pricing_count || 0
          }
        })
        
        setHeroProducts(heroProductsObj)
        
        // NEW: Update system settings from response if available
        if (responseData.system_settings) {
          setSystemSettings(responseData.system_settings)
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      showNotification('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryFromProductCode = (productCode) => {
    const code = productCode.toUpperCase()
    if (code.includes('HOME_PROTECTION') || code.includes('HERO_LEVEL_HOME')) {
      return 'home_protection'
    } else if (code.includes('COMPREHENSIVE_AUTO')) {
      return 'auto_protection'
    } else {
      return 'deductible_reimbursement'
    }
  }

  const generateFeatures = (productCode) => {
    const code = productCode.toUpperCase()
    const featureMap = {
      'HOME_PROTECTION_PLAN': ['HVAC coverage', 'Plumbing protection', '24/7 support', 'Glass repair', 'Emergency services'],
      'COMPREHENSIVE_AUTO_PROTECTION': ['Auto deductible coverage', 'Roadside assistance', 'Rental car coverage', 'Towing service'],
      'HOME_DEDUCTIBLE_REIMBURSEMENT': ['Home insurance deductible coverage', 'Identity theft protection', 'Fast claims processing'],
      'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT': ['Single vehicle coverage', 'Identity theft protection', 'Warranty vault'],
      'MULTI_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': ['Multiple vehicle coverage', 'Flexible additions', 'Family protection'],
      'ALL_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': ['All vehicle types', 'Unlimited additions', 'Priority processing'],
      'AUTO_RV_DEDUCTIBLE_REIMBURSEMENT': ['Auto & RV coverage', 'Enhanced RV services', 'Specialized support'],
      'HERO_LEVEL_HOME_PROTECTION': ['Premium home coverage', 'Concierge service', 'Maximum protection']
    }
    
    return featureMap[code] || ['Professional coverage', 'Expert service', 'Competitive rates']
  }

  const saveProduct = async (productData) => {
    try {
      if (editingProduct) {
        const response = await apiCall(`/api/admin/products/${editingProduct.product_code}`, {
          method: 'PUT',
          body: JSON.stringify({
            product_name: productData.name,
            description: productData.description,
            active: productData.active,
            base_price: productData.base_price
          })
        })
        
        if (response.success) {
          setHeroProducts(prev => ({
            ...prev,
            [editingProduct.id]: { ...editingProduct, ...productData }
          }))
          await loadProducts();
          showNotification('Product updated successfully')
          setEditingProduct(null)
        }
      } else {
        const response = await apiCall('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify({
            product_code: productData.product_code,
            product_name: productData.name,
            description: productData.description,
            base_price: productData.base_price,
            active: productData.active
          })
        })
        
        if (response.success) {
          await loadProducts()
          showNotification('Product created successfully')
        }
      }
      
      setEditingProduct(null)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to save product:', error)
      showNotification('Failed to save product', 'error')
    }
  }

  const updateProductPricing = async (productCode, pricingData) => {
    try {
      const response = await apiCall(`/api/admin/pricing/${productCode}`, {
        method: 'PUT',
        body: JSON.stringify(pricingData)
      });
      
      if (response.success) {
        await loadProducts();
        showNotification('Pricing updated successfully');
      } else {
        showNotification('Failed to update pricing: Invalid response', 'error');
      }
    } catch (error) {
      console.error('Failed to update pricing:', error);
      showNotification('Failed to update pricing', 'error');
    } finally {
      setShowPricingDialog(false);
      setSelectedProduct(null);
    }
  }

  const deleteProduct = async (productCode) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiCall(`/api/admin/products/${productCode}`, {
        method: 'DELETE'
      })
      
      if (response.success) {
        await loadProducts()
        showNotification('Product deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      showNotification('Failed to delete product', 'error')
    }
  }

  const toggleProductStatus = async (productCode) => {
    try {
      const product = heroProducts[productCode]
      const response = await apiCall(`/api/admin/products/${productCode}`, {
        method: 'PUT',
        body: JSON.stringify({
          active: !product.active
        })
      })
      
      if (response.success) {
        setHeroProducts(prev => ({
          ...prev,
          [productCode]: {
            ...prev[productCode],
            active: !prev[productCode].active
          }
        }))
        showNotification(`Product ${!product.active ? 'activated' : 'deactivated'} successfully`)
      }
    } catch (error) {
      console.error('Failed to toggle product status:', error)
      showNotification('Failed to update product status', 'error')
    }
  }

  const filteredProducts = Object.values(heroProducts).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.product_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {notification && (
        <Alert className={notification.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{notification.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Product Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Hero products with database-driven pricing
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadProducts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Hero Product</DialogTitle>
                <DialogDescription>
                  Add a new Hero product to your platform
                </DialogDescription>
              </DialogHeader>
              <ProductForm onSave={saveProduct} onCancel={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="home_protection">Home Protection</SelectItem>
            <SelectItem value="auto_protection">Auto Protection</SelectItem>
            <SelectItem value="deductible_reimbursement">Deductible Reimbursement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Hero Products ({filteredProducts.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={product.active}
                        onCheckedChange={() => toggleProductStatus(product.product_code)}
                      />
                      <Badge variant={product.active ? 'default' : 'secondary'}>
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Product Code</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {product.product_code}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {product.category?.replace('_', ' ')}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Base Price</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-lg font-semibold">${product.base_price}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm">
                        ${product.min_price} - ${product.max_price}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Available Terms</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(product.terms_available || []).map((term) => (
                        <Badge key={term} variant="outline" className="text-xs">
                          {term} year{term > 1 ? 's' : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Features</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(product.features || []).slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {(product.features || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(product.features || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowPricingDialog(true)
                      }}
                      className="flex-1"
                    >
                      <Calculator className="w-4 h-4 mr-1" />
                      Pricing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProduct(product.product_code)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first Hero product'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            )}
          </div>
        )}
      </div>

      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information and settings
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSave={saveProduct}
              onCancel={() => setEditingProduct(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showPricingDialog && selectedProduct && (
        <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Manage Pricing - {selectedProduct.name}</DialogTitle>
              <DialogDescription>
                Update pricing with database-driven fees and discounts
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <PricingForm
                product={selectedProduct}
                systemSettings={systemSettings}
                onSave={updateProductPricing}
                onCancel={() => {
                  setShowPricingDialog(false)
                  setSelectedProduct(null)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    product_code: product?.product_code || '',
    name: product?.name || '',
    description: product?.description || '',
    base_price: product?.base_price || '',
    active: product?.active ?? true,
    features: product?.features?.join('\n') || ''
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.product_code.trim()) {
      newErrors.product_code = 'Product code is required'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.base_price || isNaN(formData.base_price) || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Valid base price is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      const productData = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        features: formData.features.split('\n').filter(f => f.trim())
      }
      onSave(productData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_code">Product Code *</Label>
          <Input
            id="product_code"
            value={formData.product_code}
            onChange={(e) => setFormData(prev => ({ ...prev, product_code: e.target.value.toUpperCase() }))}
            placeholder="HOME_PROTECTION_PLAN"
            disabled={!!product}
            className={errors.product_code ? 'border-red-500' : ''}
          />
          {errors.product_code && <p className="text-red-500 text-sm mt-1">{errors.product_code}</p>}
        </div>
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Home Protection Plan"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Comprehensive home protection coverage"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="base_price">Base Price (USD) *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="base_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_price}
            onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
            placeholder="199.00"
            className={`pl-10 ${errors.base_price ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.base_price && <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>}
      </div>

      <div>
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
          placeholder="HVAC coverage&#10;Plumbing protection&#10;24/7 support"
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Product Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Product
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}

// UPDATED: PricingForm with database-driven calculations
function PricingForm({ product, systemSettings, onSave, onCancel }) {
  const [pricingData, setPricingData] = useState(() => {
    const initialData = {
      base_price: product.base_price || 0,
      pricing: {}
    }
    
    const availableTerms = product.terms_available || [1, 2, 3, 4, 5]
    availableTerms.forEach(term => {
      if (product.pricing && product.pricing[term]) {
        initialData.pricing[term] = {
          retail: product.pricing[term].base_price || product.base_price,
          wholesale: (product.pricing[term].base_price || product.base_price) * 0.85
        }
      } else {
        const multiplier = getDefaultMultiplier(term)
        initialData.pricing[term] = {
          retail: Math.round(product.base_price * multiplier),
          wholesale: Math.round(product.base_price * multiplier * 0.85)
        }
      }
    })
    
    return initialData
  })

  // NEW: State for real-time pricing calculation
  const [pricingPreviews, setPricingPreviews] = useState({})

  function getDefaultMultiplier(term) {
    const multipliers = { 1: 1.0, 2: 1.8, 3: 2.5, 4: 3.2, 5: 3.8 }
    return multipliers[term] || 1.0
  }

  // NEW: Function to calculate preview using system settings
  const calculatePreview = async (term, customerType, price) => {
    try {
      const response = await apiCall('/api/admin/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify({
          base_price: parseFloat(price) || 0,
          term_years: term,
          customer_type: customerType,
          state: 'FL' // Default state, could be made configurable
        })
      })

      if (response.success) {
        return response.data.calculation
      }
    } catch (error) {
      console.error('Failed to calculate preview:', error)
    }

    // Fallback calculation
    const basePrice = parseFloat(price) || 0
    const adminFee = systemSettings?.fees?.admin_fee ?? 25
    const taxRate = systemSettings?.taxes?.default_tax_rate || 0.08
    const discountRate = systemSettings?.discounts?.wholesale_discount_rate ?? 0.15
    
    let finalPrice = basePrice
    let discountAmount = 0
    
    if (customerType === 'wholesale') {
      discountAmount = basePrice * discountRate
      finalPrice = basePrice - discountAmount
    }
    
    const subtotal = finalPrice + adminFee
    const tax = subtotal * taxRate
    const total = subtotal + tax
    const monthly = total / (term * 12)
    
    return {
      base_price: basePrice.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      discounted_price: finalPrice.toFixed(2),
      admin_fee: adminFee.toFixed(2),
      subtotal: subtotal.toFixed(2),
      tax_amount: tax.toFixed(2),
      total_price: total.toFixed(2),
      monthly_payment: monthly.toFixed(2),
      discount_rate: customerType === 'wholesale' ? discountRate : 0
    }
  }

  // NEW: Update pricing preview when values change  
  const updatePricing = async (term, customerType, value) => {
    const numValue = parseFloat(value) || 0
    setPricingData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [term]: {
          ...prev.pricing[term],
          [customerType]: numValue
        }
      }
    }))

    // Calculate preview
    const preview = await calculatePreview(term, customerType, numValue)
    setPricingPreviews(prev => ({
      ...prev,
      [`${term}_${customerType}`]: preview
    }))
  }

  const updateBasePrice = async (value) => {
    const numValue = parseFloat(value) || 0
    setPricingData(prev => ({
      ...prev,
      base_price: numValue
    }))
    
    const availableTerms = product.terms_available || [1, 2, 3, 4, 5]
    const wholesaleRate = systemSettings?.discounts?.wholesale_discount_rate ?? 0.15
    
    // Update all term pricing and previews
    for (const term of availableTerms) {
      const multiplier = getDefaultMultiplier(term)
      const retailPrice = Math.round(numValue * multiplier)
      const wholesalePrice = Math.round(retailPrice * (1 - wholesaleRate))
      
      setPricingData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [term]: {
            retail: retailPrice,
            wholesale: wholesalePrice
          }
        }
      }))

      // Calculate previews for both customer types
      const retailPreview = await calculatePreview(term, 'retail', retailPrice)
      const wholesalePreview = await calculatePreview(term, 'wholesale', wholesalePrice)
      
      setPricingPreviews(prev => ({
        ...prev,
        [`${term}_retail`]: retailPreview,
        [`${term}_wholesale`]: wholesalePreview
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const formattedPricing = {
      base_price: pricingData.base_price,
      pricing: {}
    }
    
    Object.entries(pricingData.pricing).forEach(([term, prices]) => {
      const retailMultiplier = prices.retail / pricingData.base_price
      const wholesaleMultiplier = prices.wholesale / pricingData.base_price
      
      formattedPricing.pricing[term] = {
        retail: retailMultiplier,
        wholesale: wholesaleMultiplier
      }
    })
    
    onSave(product.product_code, formattedPricing)
  }

  const availableTerms = product.terms_available || [1, 2, 3, 4, 5]

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* System Settings Display - NEW */}
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Current System Settings
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Admin Fee</div>
              <div className="font-mono">${typeof systemSettings.fees?.admin_fee === 'number' ? systemSettings.fees.admin_fee : 25}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Wholesale Discount</div>
              <div className="font-mono flex items-center">
                <Percent className="w-3 h-3 mr-1" />
                {((systemSettings?.discounts?.wholesale_discount_rate || 0.15) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Tax Rate</div>
              <div className="font-mono">{((systemSettings?.taxes?.default_tax_rate || 0.08) * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Source</div>
              <div className="flex items-center">
                {systemSettings?.database_driven ? (
                  <><CheckCircle className="w-4 h-4 text-green-500 mr-1" />Database</>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-orange-500 mr-1" />Fallback</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Base Pricing Section */}
        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 sticky top-0 z-10">
          <h3 className="text-lg font-semibold mb-3">Base Pricing</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Base Price (1 Year)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricingData.base_price}
                  onChange={(e) => updateBasePrice(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This will auto-calculate pricing for all terms using database settings
              </p>
            </div>
            <div className="flex items-center">
              <Alert className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Database-Driven Calculations</AlertTitle>
                <AlertDescription className="text-sm">
                  Pricing uses current admin fees (${typeof systemSettings.fees?.admin_fee === 'number' ? systemSettings.fees.admin_fee : 25}), 
                  wholesale discount ({((systemSettings?.discounts?.wholesale_discount_rate || 0.15) * 100).toFixed(1)}%), 
                  and tax rate ({((systemSettings?.taxes?.default_tax_rate || 0.08) * 100).toFixed(1)}%) from your database settings.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>

        {/* Term-based Pricing Section - UPDATED */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Term-based Pricing</h3>
          <div className="space-y-6">
            {availableTerms.map(term => {
              const retailPreview = pricingPreviews[`${term}_retail`]
              const wholesalePreview = pricingPreviews[`${term}_wholesale`]
              
              return (
                <div key={term} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                  <h4 className="font-medium mb-4 text-lg border-b pb-2">
                    {term} Year{term > 1 ? 's' : ''} Coverage
                  </h4>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Retail Pricing */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Retail Price</Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pricingData.pricing[term]?.retail || 0}
                            onChange={(e) => updatePricing(term, 'retail', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <div className="font-medium mb-2 text-sm">Customer Pays:</div>
                        {retailPreview ? (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Base Price:</span>
                              <span className="font-mono">${retailPreview.base_price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Admin Fee:</span>
                              <span className="font-mono">${typeof systemSettings.fees?.admin_fee === 'number' ? systemSettings.fees.admin_fee : 25}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax ({((systemSettings?.taxes?.default_tax_rate || 0.08) * 100).toFixed(1)}%):</span>
                              <span className="font-mono">${retailPreview.tax_amount}</span>
                            </div>
                            <hr className="my-1" />
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span className="font-mono">${retailPreview.total_price}</span>
                            </div>
                            <div className="flex justify-between text-blue-600 dark:text-blue-400">
                              <span>Monthly:</span>
                              <span className="font-mono">${retailPreview.monthly_payment}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Calculating...</div>
                        )}
                      </div>
                    </div>

                    {/* Wholesale Pricing - UPDATED */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          Wholesale Price ({((systemSettings?.discounts?.wholesale_discount_rate || 0.15) * 100).toFixed(1)}% discount)
                        </Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pricingData.pricing[term]?.wholesale || 0}
                            onChange={(e) => updatePricing(term, 'wholesale', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-md">
                        <div className="font-medium mb-2 text-sm">Reseller Pays:</div>
                        {wholesalePreview ? (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Base Price:</span>
                              <span className="font-mono">${wholesalePreview.base_price}</span>
                            </div>
                            {parseFloat(wholesalePreview.discount_amount) > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount ({((wholesalePreview.discount_rate || 0) * 100).toFixed(1)}%):</span>
                                <span className="font-mono">-${wholesalePreview.discount_amount}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Discounted Price:</span>
                              <span className="font-mono">${wholesalePreview.discounted_price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Admin Fee:</span>
                              <span className="font-mono">${typeof systemSettings.fees?.admin_fee === 'number' ? systemSettings.fees.admin_fee : 25}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span className="font-mono">${wholesalePreview.tax_amount}</span>
                            </div>
                            <hr className="my-1" />
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span className="font-mono">${wholesalePreview.total_price}</span>
                            </div>
                            <div className="flex justify-between text-orange-600 dark:text-orange-400">
                              <span>vs Retail Savings:</span>
                              <span className="font-mono">
                                ${retailPreview ? (parseFloat(retailPreview.total_price) - parseFloat(wholesalePreview.total_price)).toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Calculating...</div>
                        )}
                        </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pricing Summary - UPDATED */}
        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <h3 className="text-lg font-semibold mb-3">Pricing Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Price Range</div>
              <div className="font-mono">
                ${Math.min(...Object.values(pricingData.pricing).map(p => p.retail))} - 
                ${Math.max(...Object.values(pricingData.pricing).map(p => p.retail))}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Available Terms</div>
              <div>{availableTerms.join(', ')} year{availableTerms.length > 1 ? 's' : ''}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Wholesale Discount</div>
              <div>{((systemSettings?.discounts?.wholesale_discount_rate ?? 0.15) * 100).toFixed(1)}% off retail</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Additional Fees</div>
              <div>${typeof systemSettings.fees?.admin_fee === 'number' ? systemSettings.fees.admin_fee : 25} admin + {((systemSettings?.taxes?.default_tax_rate || 0.08) * 100).toFixed(1)}% tax</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t bg-white dark:bg-gray-800 sticky bottom-0 pb-4">
          <Button type="submit" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Update Pricing
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}