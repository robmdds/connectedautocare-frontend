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
      setHeroProducts(response.data.hero_products || {})
      setVscProducts(response.data.vsc_products || {})
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
        },
        auto_advantage: {
          id: 'auto_advantage',
          name: 'Auto Advantage DDR',
          category: 'deductible_reimbursement',
          description: 'Auto deductible reimbursement program',
          active: true,
          pricing: {
            '1': { base_price: 120, admin_fee: 15 },
            '2': { base_price: 180, admin_fee: 15 },
            '3': { base_price: 225, admin_fee: 15 }
          },
          features: ['Collision coverage', 'Comprehensive coverage', 'Glass protection'],
          terms_available: [1, 2, 3],
          tax_rate: 0.08,
          wholesale_discount: 0.15
        }
      })
      setVscProducts({
        silver: {
          id: 'silver',
          name: 'Silver VSC Coverage',
          description: 'Basic vehicle service contract',
          active: true,
          coverage_items: ['Engine', 'Transmission', 'Drive axle'],
          deductible_options: [0, 50, 100, 200],
          term_options: [12, 24, 36, 48]
        },
        gold: {
          id: 'gold',
          name: 'Gold VSC Coverage',
          description: 'Enhanced vehicle service contract',
          active: true,
          coverage_items: ['All Silver coverage', 'A/C', 'Power steering'],
          deductible_options: [0, 50, 100, 200],
          term_options: [12, 24, 36, 48, 60]
        }
      })
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
                        <Switch
                          checked={product.active}
                          onCheckedChange={() => toggleProductStatus('hero', product.id)}
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

