import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Download,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Archive,
  TrendingUp,
  Users,
  Clock,
  FileCheck
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { useAuth } from '../lib/auth'

export default function ContractManagement() {
  const { token, isAdmin, isReseller } = useAuth()
  const [templates, setTemplates] = useState([])
  const [generatedContracts, setGeneratedContracts] = useState([])
  const [uploadHistory, setUploadHistory] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productTypeFilter, setProductTypeFilter] = useState('all')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [selectedContracts, setSelectedContracts] = useState([])
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    if (token && (isAdmin || isReseller)) {
      loadContractData()
    }
  }, [token, isAdmin, isReseller])

  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    // Handle file downloads
    if (options.responseType === 'blob') {
      return response.blob()
    }

    return response.json()
  }

  const loadContractData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load templates
      const templatesResponse = await apiCall('/api/admin/contracts/templates')
      setTemplates(templatesResponse.data?.templates || [])
      
      // Load generated contracts
      const contractsResponse = await apiCall('/api/admin/contracts/generated')
      setGeneratedContracts(contractsResponse.data?.contracts || [])
      
      // Load upload history (admin/reseller only)
      if (isAdmin || isReseller) {
        try {
          const historyResponse = await apiCall('/api/admin/contracts/upload-history')
          setUploadHistory(historyResponse.data?.uploads || [])
        } catch (error) {
          console.warn('Failed to load upload history:', error)
          setUploadHistory([])
        }
      }

      // Load statistics
      const statsResponse = await apiCall('/api/admin/contracts/stats')
      setStats(statsResponse.data || {})
      
    } catch (error) {
      console.error('Failed to load contract data:', error)
      setError(error.message)
      
      // Set minimal mock data for demo when API fails
      setTemplates([])
      setGeneratedContracts([])
      setUploadHistory([])
      setStats({
        templates: { total: 0, active: 0, inactive: 0 },
        contracts: { total_generated: 0, generated_today: 0 },
        uploads: { total: 0, recent: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (templateData) => {
    try {
      await apiCall('/api/admin/contracts/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: templateData.name,
          product_type: templateData.product_type,
          product_id: templateData.product_id,
          template_id: templateData.template_id || `${templateData.product_type}_${templateData.product_id}`,
          fields: templateData.fields,
          active: templateData.active
        })
      })
      
      await loadContractData()
      setShowCreateTemplate(false)
    } catch (error) {
      console.error('Failed to create template:', error)
      setError('Failed to create template: ' + error.message)
    }
  }

  const updateTemplate = async (templateId, templateData) => {
    try {
      await apiCall(`/api/admin/contracts/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: templateData.name,
          fields: templateData.fields,
          active: templateData.active,
          template_file: templateData.template_file
        })
      })
      
      await loadContractData()
      setEditingTemplate(null)
    } catch (error) {
      console.error('Failed to update template:', error)
      setError('Failed to update template: ' + error.message)
    }
  }

  const toggleTemplateStatus = async (templateId) => {
    try {
      await apiCall(`/api/admin/contracts/templates/${templateId}/toggle-status`, {
        method: 'POST'
      })
      
      // Update local state
      setTemplates(prev => prev.map(template => 
        template.template_id === templateId 
          ? { ...template, active: !template.active }
          : template
      ))
    } catch (error) {
      console.error('Failed to toggle template status:', error)
      setError('Failed to toggle template status: ' + error.message)
    }
  }

  const handleFileUpload = async (event, templateId) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('template_id', templateId)

      await apiCall('/api/admin/contracts/upload-template', {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type to let browser set it for FormData
      })

      // Reload data
      await loadContractData()
    } catch (error) {
      console.error('Failed to upload file:', error)
      setError('Failed to upload file: ' + error.message)
    }
  }

  const downloadContract = async (contractId) => {
    try {
      const blob = await apiCall(`/api/admin/contracts/generated/${contractId}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contract_${contractId}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download contract:', error)
      setError('Failed to download contract: ' + error.message)
    }
  }

  const bulkExportContracts = async () => {
    if (selectedContracts.length === 0) return

    try {
      const blob = await apiCall('/api/admin/contracts/bulk-export', {
        method: 'POST',
        body: JSON.stringify({ contract_ids: selectedContracts }),
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contracts_export_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setSelectedContracts([])
    } catch (error) {
      console.error('Failed to export contracts:', error)
      setError('Failed to export contracts: ' + error.message)
    }
  }

  // Filter functions
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.product_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProductType = productTypeFilter === 'all' || template.product_type === productTypeFilter
    
    return matchesSearch && matchesProductType
  })

  const filteredContracts = generatedContracts.filter(contract => {
    const matchesSearch = contract.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customer_data?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Get unique product types for filter
  const productTypes = [...new Set(templates.map(t => t.product_type))].filter(Boolean)
  const contractStatuses = [...new Set(generatedContracts.map(c => c.status))].filter(Boolean)

  if (!isAdmin && !isReseller) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Contract management access is restricted to administrators and resellers.</p>
        </div>
      </div>
    )
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contract Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage contract templates and generated customer contracts
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedContracts.length > 0 && (
            <Button onClick={bulkExportContracts} variant="outline">
              <Archive className="w-4 h-4 mr-2" />
              Export Selected ({selectedContracts.length})
            </Button>
          )}
          {(isAdmin || isReseller) && (
            <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Contract Template</DialogTitle>
                  <DialogDescription>
                    Create a new contract template for your products
                  </DialogDescription>
                </DialogHeader>
                <TemplateForm onSave={createTemplate} onCancel={() => setShowCreateTemplate(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-md p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div className="text-red-800">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.templates?.total || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {stats.templates?.active || 0} active
                </p>
              </div>
              <FileText className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Generated Contracts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.contracts?.total_generated || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.contracts?.generated_today || 0} today
                </p>
              </div>
              <FileCheck className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.contracts?.active_contracts || 0}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  {stats.contracts?.signed_contracts || 0} signed
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
                <p className="text-sm font-medium text-gray-600">File Uploads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.uploads?.total || 0}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  {stats.uploads?.recent || 0} recent
                </p>
              </div>
              <Upload className="text-orange-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center space-x-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates or contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setProductTypeFilter('all')
          }}
        >
          Clear Filters
        </Button>
      </motion.div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Contract Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="generated">Generated Contracts ({filteredContracts.length})</TabsTrigger>
          {(isAdmin || isReseller) && (
            <TabsTrigger value="uploads">Upload History ({uploadHistory.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Product Type Filter */}
          <div className="flex items-center space-x-4">
            <Label>Filter by Product Type:</Label>
            <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All product types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Product Types</SelectItem>
                {productTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(isAdmin || isReseller) && (
                          <Switch
                            checked={template.active}
                            onCheckedChange={() => toggleTemplateStatus(template.template_id)}
                          />
                        )}
                        <Badge variant={template.active ? 'default' : 'secondary'}>
                          {template.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {template.product_type} • {template.product_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Template ID</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {template.template_id}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Template File</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.template_file || 'No file uploaded'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Fields ({template.fields?.length || 0})</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(template.fields || []).slice(0, 3).map((field, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {field.name} {field.required && '*'}
                          </Badge>
                        ))}
                        {(template.fields || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.fields || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {(isAdmin || isReseller) && (
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <label className="flex-1">
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-1" />
                              Upload
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileUpload(e, template.template_id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No templates found matching your criteria.</p>
                {(isAdmin || isReseller) && (
                  <Button
                    onClick={() => setShowCreateTemplate(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Template
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <Label>Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {contractStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generated Contracts</CardTitle>
              <CardDescription>
                Customer contracts generated from templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredContracts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContracts(filteredContracts.map(c => c.id))
                            } else {
                              setSelectedContracts([])
                            }
                          }}
                          checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                        />
                      </TableHead>
                      <TableHead>Contract Number</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Generated Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedContracts.includes(contract.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedContracts(prev => [...prev, contract.id])
                              } else {
                                setSelectedContracts(prev => prev.filter(id => id !== contract.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {contract.contract_number || `${contract.id.slice(0, 8)}...`}
                        </TableCell>
                        <TableCell>{contract.template_name}</TableCell>
                        <TableCell>
                          {contract.customer_data?.customer_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(contract.generated_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={contract.status === 'active' ? 'default' : 
                                   contract.status === 'signed' ? 'default' : 
                                   contract.status === 'cancelled' ? 'destructive' : 'secondary'}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadContract(contract.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No contracts found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {(isAdmin || isReseller) && (
          <TabsContent value="uploads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>
                  History of template file uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>File Size</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadHistory.map((upload) => (
                        <TableRow key={upload.id}>
                          <TableCell className="font-medium">
                            {upload.original_filename}
                          </TableCell>
                          <TableCell>
                            {upload.template_name || upload.template_id || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {upload.file_size ? `${(upload.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {upload.upload_date ? new Date(upload.upload_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {upload.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No file uploads yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update template information and fields
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSave={(templateData) => updateTemplate(editingTemplate.template_id, templateData)}
              onCancel={() => setEditingTemplate(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Template form component
function TemplateForm({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    template_id: template?.template_id || '',
    name: template?.name || '',
    product_type: template?.product_type || '',
    product_id: template?.product_id || '',
    active: template?.active ?? true,
    fields: template?.fields || []
  });

  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    required: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addField = () => {
    if (newField.name.trim()) {
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, { ...newField, name: newField.name.trim() }]
      }));
      setNewField({ name: '', type: 'text', required: true });
    }
  };

  const removeField = (index) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const updateField = (index, field) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Template name is required');
      }
      if (!formData.product_type.trim()) {
        throw new Error('Product type is required');
      }
      if (!formData.product_id.trim()) {
        throw new Error('Product ID is required');
      }

      // Auto-generate template_id for new templates
      if (!formData.template_id.trim()) {
        formData.template_id = `${formData.product_type}_${formData.product_id}`.toLowerCase();
      }

      await onSave(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'currency', label: 'Currency' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'select', label: 'Select' },
    { value: 'textarea', label: 'Text Area' }
  ];

  const productTypes = [
    { value: 'vsc', label: 'VSC (Vehicle Service Contract)' },
    { value: 'hero', label: 'HERO (Home Protection)' },
    { value: 'gap', label: 'GAP Insurance' },
    { value: 'tire_wheel', label: 'Tire & Wheel Protection' },
    { value: 'key_replacement', label: 'Key Replacement' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="VSC Silver Coverage Contract"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product_type">Product Type *</Label>
            <Select
              value={formData.product_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, product_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="product_id">Product ID *</Label>
            <Input
              id="product_id"
              value={formData.product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
              placeholder="silver, gold, premium"
              required
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label htmlFor="active">Template Active</Label>
        </div>
      </div>

      {/* Template Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Template Fields</h3>
        
        {/* Existing Fields */}
        <div className="space-y-2">
          {formData.fields.map((field, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
              <div className="flex-1">
                <Input
                  value={field.name}
                  onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                  placeholder="Field name"
                  className="mb-2"
                />
                <div className="flex items-center space-x-2">
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(index, { ...field, type: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                    />
                    <span className="text-sm">Required</span>
                  </label>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeField(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {/* Add New Field */}
        <div className="flex items-end space-x-2 p-3 border-2 border-dashed border-gray-200 rounded-md">
          <div className="flex-1">
            <Label htmlFor="new-field-name">Add New Field</Label>
            <Input
              id="new-field-name"
              placeholder="Field name"
              value={newField.name}
              onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addField();
                }
              }}
            />
          </div>
          <Select
            value={newField.type}
            onValueChange={(value) => setNewField(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center space-x-1 whitespace-nowrap">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
            />
            <span className="text-sm">Required</span>
          </label>
          <Button type="button" onClick={addField} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-500">
          Fields define what information will be collected when generating contracts from this template.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {template ? 'Update Template' : 'Create Template'}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}