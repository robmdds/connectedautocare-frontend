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
  Archive
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
import { apiCall } from '../lib/auth'

export default function ContractManagement() {
  const [templates, setTemplates] = useState([])
  const [generatedContracts, setGeneratedContracts] = useState([])
  const [uploadHistory, setUploadHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [selectedContracts, setSelectedContracts] = useState([])

  useEffect(() => {
    loadContractData()
  }, [])

  const loadContractData = async () => {
    try {
      setLoading(true)
      
      // Load templates
      const templatesResponse = await apiCall('/api/admin/contracts/templates')
      setTemplates(templatesResponse.data.templates || [])
      
      // Load generated contracts
      const contractsResponse = await apiCall('/api/admin/contracts/generated')
      setGeneratedContracts(contractsResponse.data.contracts || [])
      
      // Load upload history
      const historyResponse = await apiCall('/api/admin/contracts/upload-history')
      setUploadHistory(historyResponse.data.uploads || [])
      
    } catch (error) {
      console.error('Failed to load contract data:', error)
      // Set mock data for demo
      setTemplates([
        {
          id: 'vsc_silver',
          name: 'VSC Silver Coverage Contract',
          product_type: 'vsc',
          product_id: 'silver',
          template_file: 'vsc_silver_template.pdf',
          active: true,
          created_date: '2024-01-15',
          fields: [
            { name: 'customer_name', type: 'text', required: true },
            { name: 'vehicle_vin', type: 'text', required: true },
            { name: 'coverage_term', type: 'number', required: true }
          ]
        },
        {
          id: 'home_protection',
          name: 'Home Protection Plan Contract',
          product_type: 'hero',
          product_id: 'home_protection',
          template_file: 'home_protection_template.pdf',
          active: true,
          created_date: '2024-01-15',
          fields: [
            { name: 'customer_name', type: 'text', required: true },
            { name: 'property_address', type: 'text', required: true },
            { name: 'coverage_term', type: 'number', required: true }
          ]
        }
      ])
      
      setGeneratedContracts([
        {
          id: 'contract_001',
          template_id: 'vsc_silver',
          template_name: 'VSC Silver Coverage Contract',
          customer_data: {
            customer_name: 'John Smith',
            vehicle_vin: '1HGBH41JXMN109186',
            coverage_term: 36
          },
          generated_date: '2024-01-20T10:30:00Z',
          status: 'generated'
        },
        {
          id: 'contract_002',
          template_id: 'home_protection',
          template_name: 'Home Protection Plan Contract',
          customer_data: {
            customer_name: 'Jane Doe',
            property_address: '123 Main St, Anytown, ST 12345',
            coverage_term: 24
          },
          generated_date: '2024-01-19T14:15:00Z',
          status: 'generated'
        }
      ])
      
      setUploadHistory([
        {
          id: 'upload_001',
          template_id: 'vsc_silver',
          filename: 'vsc_silver_template.pdf',
          original_filename: 'VSC Silver Template.pdf',
          file_size: 245760,
          upload_date: '2024-01-15T09:00:00Z',
          status: 'uploaded'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleTemplateStatus = async (templateId) => {
    try {
      await apiCall(`/api/admin/contracts/templates/${templateId}/toggle-status`, {
        method: 'POST'
      })
      
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, active: !template.active }
          : template
      ))
    } catch (error) {
      console.error('Failed to toggle template status:', error)
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
      loadContractData()
    } catch (error) {
      console.error('Failed to upload file:', error)
    }
  }

  const downloadContract = async (contractId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contracts/generated/${contractId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contract_${contractId}.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download contract:', error)
    }
  }

  const bulkExportContracts = async () => {
    if (selectedContracts.length === 0) return

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/contracts/bulk-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contract_ids: selectedContracts })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contracts_export_${new Date().toISOString().slice(0, 10)}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSelectedContracts([])
      }
    } catch (error) {
      console.error('Failed to export contracts:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.product_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredContracts = generatedContracts.filter(contract =>
    contract.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.customer_data.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Contract Template</DialogTitle>
                <DialogDescription>
                  Create a new contract template for your products
                </DialogDescription>
              </DialogHeader>
              <TemplateForm onSave={() => setShowCreateTemplate(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates or contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Contract Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Contracts</TabsTrigger>
          <TabsTrigger value="uploads">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
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
                        <Switch
                          checked={template.active}
                          onCheckedChange={() => toggleTemplateStatus(template.id)}
                        />
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
                            {field.name}
                          </Badge>
                        ))}
                        {(template.fields || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.fields || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

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
                          onChange={(e) => handleFileUpload(e, template.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Contracts</CardTitle>
              <CardDescription>
                Customer contracts generated from templates
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    <TableHead>Contract ID</TableHead>
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
                        {contract.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{contract.template_name}</TableCell>
                      <TableCell>{contract.customer_data.customer_name}</TableCell>
                      <TableCell>
                        {new Date(contract.generated_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>
                History of template file uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <TableCell>{upload.original_filename}</TableCell>
                      <TableCell>{upload.template_id}</TableCell>
                      <TableCell>{(upload.file_size / 1024).toFixed(1)} KB</TableCell>
                      <TableCell>
                        {new Date(upload.upload_date).toLocaleDateString()}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update template information and fields
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSave={() => setEditingTemplate(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Template form component
function TemplateForm({ template, onSave }) {
  const [formData, setFormData] = useState({
    id: template?.id || '',
    name: template?.name || '',
    product_type: template?.product_type || '',
    product_id: template?.product_id || '',
    active: template?.active ?? true,
    fields: template?.fields || []
  })

  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    required: true
  })

  const addField = () => {
    if (newField.name) {
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, { ...newField }]
      }))
      setNewField({ name: '', type: 'text', required: true })
    }
  }

  const removeField = (index) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="id">Template ID</Label>
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            placeholder="template_id"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Template Name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_type">Product Type</Label>
          <Input
            id="product_type"
            value={formData.product_type}
            onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
            placeholder="hero, vsc"
            required
          />
        </div>
        <div>
          <Label htmlFor="product_id">Product ID</Label>
          <Input
            id="product_id"
            value={formData.product_id}
            onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
            placeholder="product_id"
            required
          />
        </div>
      </div>

      <div>
        <Label>Template Fields</Label>
        <div className="space-y-2 mt-2">
          {formData.fields.map((field, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <span className="flex-1">{field.name}</span>
              <Badge variant="outline">{field.type}</Badge>
              <Badge variant={field.required ? 'default' : 'secondary'}>
                {field.required ? 'Required' : 'Optional'}
              </Badge>
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
        
        <div className="flex items-center space-x-2 mt-2">
          <Input
            placeholder="Field name"
            value={newField.name}
            onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
          />
          <select
            value={newField.type}
            onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border rounded"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="currency">Currency</option>
          </select>
          <label className="flex items-center space-x-1">
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
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Template Active</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          Save Template
        </Button>
        <Button type="button" variant="outline" onClick={onSave}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

