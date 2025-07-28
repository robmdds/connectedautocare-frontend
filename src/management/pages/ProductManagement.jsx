import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Package,
  DollarSign,
  Tag,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { apiCall } from '../lib/auth'

export default function ProductManagement() {
  const [heroProducts, setHeroProducts] = useState({})
  const [vscProducts, setVscProducts] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/api/admin/products')
      
      // Handle the array response format [responseObject, statusCode]
      let actualResponse = response;
      
      if (Array.isArray(response) && response.length >= 1 && typeof response[0] === 'object') {
        actualResponse = response[0];
      }
      
      // Handle the success_response format
      let responseData = actualResponse;
      if (actualResponse && actualResponse.success && actualResponse.data) {
        responseData = actualResponse.data;
      }
            
      // Helper function to get correct pricing data based on July 2025 pricing document
      const getCorrectPricingData = (productCode, basePrice) => {
        const pricingMap = {
          'HOME_PROTECTION_PLAN': { min: 199, max: 599, terms: [1, 2, 3, 4, 5] },
          'COMPREHENSIVE_AUTO_PROTECTION': { min: 339, max: 1099, terms: [1, 2, 3, 4, 5] },
          'HOME_DEDUCTIBLE_REIMBURSEMENT': { min: 160, max: 255, terms: [1, 2, 3] },
          'MULTI_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': { min: 150, max: 275, terms: [1, 2, 3] },
          'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT': { min: 120, max: 225, terms: [1, 2, 3] },
          'ALL_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': { min: 150, max: 275, terms: [1, 2, 3] },
          'AUTO_RV_DEDUCTIBLE_REIMBURSEMENT': { min: 175, max: 280, terms: [1, 2, 3] },
          'HERO_LEVEL_HOME_PROTECTION': { min: 789, max: 1295, terms: [1, 2, 3] }
        }
        
        const pricing = pricingMap[productCode.toUpperCase()]
        if (pricing) {
          return {
            minPrice: pricing.min,
            maxPrice: pricing.max,
            terms: pricing.terms,
            pricing: pricing.terms.reduce((acc, term, index) => {
              const termPrice = pricing.min + ((pricing.max - pricing.min) * (index / (pricing.terms.length - 1)))
              acc[term] = { base_price: Math.round(termPrice), admin_fee: 25 }
              return acc
            }, {})
          }
        }
        
        // Fallback to base price if not found
        return {
          minPrice: basePrice,
          maxPrice: basePrice,
          terms: [1, 2, 3],
          pricing: { '1': { base_price: basePrice, admin_fee: 25 } }
        }
      }

      // Helper function to determine category from product_code
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

      // Helper function to generate features based on product code
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

      if (responseData.products && Array.isArray(responseData.products)) {
        const heroProductsObj = {}
        
        // Process all products from database as Hero products (no VSC products in database)
        responseData.products.forEach(product => {
          // Use product_code as the key instead of id
          const productKey = product.product_code || `product_${product.id}`
          const category = getCategoryFromProductCode(product.product_code || '')
          const features = generateFeatures(product.product_code || '')
          
          // Get correct pricing data from July 2025 document
          const pricingData = getCorrectPricingData(product.product_code || '', product.base_price || 0)

          heroProductsObj[productKey] = {
            id: productKey,
            name: product.product_name || 'Unknown Product',
            category: category,
            description: product.description || `${product.product_name} with comprehensive coverage`,
            active: product.active ?? true,
            pricing: pricingData.pricing,
            features: features,
            terms_available: pricingData.terms,
            tax_rate: 0.08,
            wholesale_discount: 0.15,
            base_price: product.base_price || 0,
            min_price: pricingData.minPrice,
            max_price: pricingData.maxPrice,
            product_code: product.product_code,
            created_at: product.created_at,
            pricing_count: product.pricing_count
          }
        })
        
        // Hard-coded VSC products since they're not in the database
        const vscProductsObj = {
          silver: {
            id: 'silver',
            name: 'Silver VSC Coverage',
            description: 'Basic vehicle service contract with essential coverage',
            active: true,
            coverage_items: ['Engine', 'Transmission', 'Drive axle', 'A/C Compressor', 'Power steering'],
            deductible_options: [0, 50, 100, 200],
            term_options: [12, 24, 36, 48],
            category: 'vsc',
            base_price: 1200
          },
          gold: {
            id: 'gold',
            name: 'Gold VSC Coverage',
            description: 'Enhanced vehicle service contract with expanded coverage',
            active: true,
            coverage_items: ['All Silver coverage', 'Electrical system', 'Fuel system', 'Cooling system', 'Brake system'],
            deductible_options: [0, 50, 100, 200],
            term_options: [12, 24, 36, 48, 60],
            category: 'vsc',
            base_price: 1800
          },
          platinum: {
            id: 'platinum',
            name: 'Platinum VSC Coverage',
            description: 'Comprehensive vehicle service contract with maximum protection',
            active: true,
            coverage_items: ['All Gold coverage', 'Suspension', 'Climate control', 'Navigation system', 'Advanced electronics'],
            deductible_options: [0, 50, 100, 200],
            term_options: [12, 24, 36, 48, 60, 72],
            category: 'vsc',
            base_price: 2400
          }
        }
        
        setHeroProducts(heroProductsObj)
        setVscProducts(vscProductsObj)
      } else {
        // Fallback
        setHeroProducts({})
        setVscProducts({})
      }
      
    } catch (error) {
      console.error('Failed to load products:', error)
      // Set mock data for demo
      setHeroProducts({
        home_protection: {
          id: 'home_protection',
          name: 'Home Protection Plan',
          category: 'home_protection',
          description: 'Comprehensive home protection coverage',
          active: true,
          pricing: {
            '1': { base_price: 199, admin_fee: 25 },
            '2': { base_price: 299, admin_fee: 25 },
            '3': { base_price: 399, admin_fee: 25 }
          },
          features: ['HVAC coverage', 'Plumbing protection', '24/7 support'],
          terms_available: [1, 2, 3, 4, 5],
          tax_rate: 0.08,
          wholesale_discount: 0.15
        }
      })
      setVscProducts({})
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (productType, productId) => {
    try {
      await apiCall(`/api/admin/products/toggle-status/${productType}/${productId}`, {
        method: 'POST'
      })
      
      if (productType === 'hero') {
        setHeroProducts(prev => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            active: !prev[productId].active
          }
        }))
      } else {
        setVscProducts(prev => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            active: !prev[productId].active
          }
        }))
      }
    } catch (error) {
      console.error('Failed to toggle product status:', error)
    }
  }

  const saveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        await apiCall(`/api/admin/products/hero/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        })
        
        setHeroProducts(prev => ({
          ...prev,
          [editingProduct.id]: { ...editingProduct, ...productData }
        }))
      } else {
        // Create new product
        await apiCall('/api/admin/products/hero', {
          method: 'POST',
          body: JSON.stringify(productData)
        })
        
        setHeroProducts(prev => ({
          ...prev,
          [productData.id]: productData
        }))
      }
      
      setEditingProduct(null)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Product Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Hero products and VSC coverage options
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new Hero product to your platform
              </DialogDescription>
            </DialogHeader>
            <ProductForm onSave={saveProduct} onCancel={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hero">Hero Products</TabsTrigger>
          <TabsTrigger value="vsc">VSC Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(heroProducts).map((product, index) => (
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
                        
                        <Badge variant={product.active ? 'default' : 'secondary'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {product.category?.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Pricing Range</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-sm">
                          ${Math.min(...Object.values(product.pricing || {}).map(p => p.base_price))} - 
                          ${Math.max(...Object.values(product.pricing || {}).map(p => p.base_price))}
                        </span>
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
        </TabsContent>

        <TabsContent value="vsc" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(vscProducts).map((product, index) => (
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
                        <Settings className="w-5 h-5 text-purple-500" />
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.active}
                          onCheckedChange={() => toggleProductStatus('vsc', product.id)}
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
                      <Label className="text-sm font-medium">Coverage Items</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(product.coverage_items || []).slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {(product.coverage_items || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(product.coverage_items || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Term Options</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(product.term_options || []).join(', ')} months
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Deductible Options</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${(product.deductible_options || []).join(', $')}
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information and pricing
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
    </div>
  )
}

// Product form component
function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: product?.id || '',
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    active: product?.active ?? true,
    features: product?.features?.join('\n') || '',
    tax_rate: product?.tax_rate || 0.08,
    wholesale_discount: product?.wholesale_discount || 0.15
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const productData = {
      ...formData,
      features: formData.features.split('\n').filter(f => f.trim())
    }
    onSave(productData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="id">Product ID</Label>
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            placeholder="product_id"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Product Name"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Product description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tax_rate">Tax Rate</Label>
          <Input
            id="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.tax_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="wholesale_discount">Wholesale Discount</Label>
          <Input
            id="wholesale_discount"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.wholesale_discount}
            onChange={(e) => setFormData(prev => ({ ...prev, wholesale_discount: parseFloat(e.target.value) }))}
          />
        </div>
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

