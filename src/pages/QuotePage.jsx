import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Car, Home, Shield, DollarSign, CheckCircle, AlertCircle, Loader, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { heroAPI, vscAPI, formatCurrency, validateQuoteData, handleAPIError } from '../lib/api'

const QuotePage = () => {
  const [activeTab, setActiveTab] = useState('hero')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')
  const [vinDecoding, setVinDecoding] = useState(false)
  const [vinError, setVinError] = useState('')
  const [vinInfo, setVinInfo] = useState(null)
  const [eligibilityCheck, setEligibilityCheck] = useState(null)

  // Hero Products Form State
  const [heroForm, setHeroForm] = useState({
    product_type: '',
    term_years: '',
    coverage_limit: '',
    customer_type: 'retail'
  })

  // Enhanced VSC Form State with VIN
  const [vscForm, setVscForm] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    coverage_level: '',
    term_months: '',
    customer_type: 'retail',
    auto_populated: false
  })

  const heroProducts = [
    { value: 'home_protection', label: 'Home Protection Plan', icon: Home },
    { value: 'auto_protection', label: 'Auto Protection Plan', icon: Car },
    { value: 'home_deductible', label: 'Home Deductible Reimbursement', icon: Shield },
    { value: 'auto_advantage', label: 'Auto Advantage DDR', icon: Car },
    { value: 'all_vehicle', label: 'All Vehicle DDR', icon: Car },
    { value: 'auto_rv', label: 'Auto & RV DDR', icon: Car },
    { value: 'multi_vehicle', label: 'Multi Vehicle DDR', icon: Car }
  ]

  const vehicleMakes = [
    'Honda', 'Toyota', 'Nissan', 'Hyundai', 'Kia', 'Lexus', 'Mazda', 'Mitsubishi', 'Subaru',
    'Ford', 'Chevrolet', 'Buick', 'Chrysler', 'Dodge', 'GMC', 'Jeep', 'Mercury', 'Oldsmobile',
    'Plymouth', 'Pontiac', 'Saturn', 'BMW', 'Mercedes-Benz', 'Audi', 'Cadillac', 'Lincoln',
    'Volkswagen', 'Volvo', 'Acura', 'Infiniti'
  ]

  // VIN Validation
  const validateVIN = (vin) => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i
    if (!vin) return { valid: false, message: 'VIN is required' }
    if (vin.length !== 17) return { valid: false, message: 'VIN must be 17 characters' }
    if (!vinRegex.test(vin)) return { valid: false, message: 'Invalid VIN format' }
    return { valid: true, message: 'Valid VIN format' }
  }

  // Decode VIN and populate vehicle fields
  const decodeVIN = async (vin) => {
    const validation = validateVIN(vin)
    if (!validation.valid) {
      setVinError(validation.message)
      return
    }

    setVinDecoding(true)
    setVinError('')
    setVinInfo(null)
    setEligibilityCheck(null)

    try {
      // Call VIN decoder API
      const response = await fetch('/api/vin/decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vin: vin.toUpperCase() })
      })

      const rawResult = await response.json()
      
      // Handle array response format: [responseData, statusCode]
      const result = Array.isArray(rawResult) ? rawResult[0] : rawResult
      
      console.log('VIN decode result:', result) // Debug log

      if (result.success && result.data) {
        const vehicleInfo = result.data.vehicle_info || result.data
        const eligibilityInfo = result.data.eligibility
        
        setVinInfo(vehicleInfo)

        // Auto-populate form fields
        setVscForm(prev => ({
          ...prev,
          make: vehicleInfo.make || '',
          model: vehicleInfo.model || '',
          year: vehicleInfo.year ? vehicleInfo.year.toString() : '',
          auto_populated: true
        }))

        // Use backend eligibility if available, otherwise check locally
        if (eligibilityInfo) {
          setEligibilityCheck({
            eligible: eligibilityInfo.eligible,
            warnings: eligibilityInfo.warnings || [],
            restrictions: eligibilityInfo.restrictions || [],
            vehicleAge: eligibilityInfo.eligibility_details?.vehicle_age,
            assessmentDate: eligibilityInfo.assessment_date
          })
        } else {
          checkVehicleEligibility(vehicleInfo)
        }

        setVinError('')
      } else {
        setVinError(result.error || 'Failed to decode VIN')
        // Reset auto-populated fields on error
        setVscForm(prev => ({
          ...prev,
          make: '',
          model: '',
          year: '',
          auto_populated: false
        }))
      }
    } catch (err) {
      console.error('VIN decode error:', err)
      setVinError('VIN decoder service unavailable')
      setVscForm(prev => ({
        ...prev,
        make: '',
        model: '',
        year: '',
        auto_populated: false
      }))
    } finally {
      setVinDecoding(false)
    }
  }

  // Check vehicle eligibility for VSC
  const checkVehicleEligibility = (vehicleInfo) => {
    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - (vehicleInfo.year || 0)
    const maxMileage = parseInt(vscForm.mileage) || 0

    let eligible = true
    let warnings = []
    let restrictions = []

    // Age eligibility (typically 15 years max)
    if (vehicleAge > 15) {
      eligible = false
      restrictions.push(`Vehicle is ${vehicleAge} years old (maximum 15 years)`)
    } else if (vehicleAge > 10) {
      warnings.push(`Vehicle is ${vehicleAge} years old - limited coverage options available`)
    }

    // Mileage eligibility (typically 150k max)
    if (maxMileage > 150000) {
      eligible = false
      restrictions.push(`Vehicle has ${maxMileage.toLocaleString()} miles (maximum 150,000)`)
    } else if (maxMileage > 125000) {
      warnings.push(`High mileage vehicle - premium rates may apply`)
    }

    // Luxury vehicle considerations
    const luxuryBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti']
    if (luxuryBrands.some(brand => vehicleInfo.make?.toUpperCase().includes(brand.toUpperCase()))) {
      warnings.push('Luxury vehicle - specialized coverage options available')
    }

    setEligibilityCheck({
      eligible,
      warnings,
      restrictions,
      vehicleAge,
      assessmentDate: new Date().toISOString()
    })
  }

  // Handle VIN input with debounced decoding
  useEffect(() => {
    if (vscForm.vin && vscForm.vin.length === 17) {
      const timer = setTimeout(() => {
        decodeVIN(vscForm.vin)
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timer)
    } else if (vscForm.vin.length < 17 && vscForm.auto_populated) {
      // Clear auto-populated fields if VIN becomes invalid
      setVscForm(prev => ({
        ...prev,
        make: '',
        model: '',
        year: '',
        auto_populated: false
      }))
      setVinInfo(null)
      setEligibilityCheck(null)
      setVinError('')
    }
  }, [vscForm.vin])

  // Re-check eligibility when mileage changes
  useEffect(() => {
    if (vinInfo && vscForm.mileage) {
      checkVehicleEligibility(vinInfo)
    }
  }, [vscForm.mileage, vinInfo])

  const handleHeroSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setQuote(null)

    try {
      const errors = validateQuoteData(heroForm, 'hero')
      if (errors.length > 0) {
        setError(errors.join(', '))
        return
      }

      const quoteData = {
        product_type: heroForm.product_type,
        term_years: parseInt(heroForm.term_years),
        coverage_limit: parseInt(heroForm.coverage_limit),
        customer_type: heroForm.customer_type
      }

      const response = await heroAPI.generateQuote(quoteData)
      const responseData = Array.isArray(response) ? response[0] : response
      
      if (responseData.success && responseData.data) {
        setQuote(responseData.data)
      } else {
        setError(responseData.error || 'Quote generation failed')
      }
    } catch (err) {
      console.error('Hero quote error:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVSCSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setQuote(null)

    try {
      // Check eligibility first
      if (eligibilityCheck && !eligibilityCheck.eligible) {
        setError(`Vehicle not eligible: ${eligibilityCheck.restrictions.join(', ')}`)
        return
      }

      const errors = validateQuoteData(vscForm, 'vsc')
      if (errors.length > 0) {
        setError(errors.join(', '))
        return
      }

      const quoteData = {
        make: vscForm.make,
        model: vscForm.model,
        year: parseInt(vscForm.year),
        mileage: parseInt(vscForm.mileage),
        coverage_level: vscForm.coverage_level,
        term_months: parseInt(vscForm.term_months),
        customer_type: vscForm.customer_type,
        // Include VIN and decoded info for reference
        vin: vscForm.vin,
        vin_decoded: vinInfo,
        auto_populated: vscForm.auto_populated
      }

      const response = await vscAPI.generateQuote(quoteData)
      const responseData = Array.isArray(response) ? response[0] : response

      if (responseData.success && responseData.data) {
        setQuote(responseData.data)
      } else {
        setError(responseData.error || 'Quote generation failed')
      }
    } catch (err) {
      console.error('VSC quote error:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-12"
        >
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Get Your Instant Quote</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional protection plans with competitive pricing. Get accurate quotes in seconds with our advanced rating engine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quote Form */}
          <div className="lg:col-span-2">
            <Card className="quote-form">
              <CardHeader>
                <CardTitle className="text-2xl">Quote Calculator</CardTitle>
                <CardDescription>
                  Select your protection type and get an instant quote with detailed pricing breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hero">Hero Products</TabsTrigger>
                    <TabsTrigger value="vsc">Vehicle Service Contracts</TabsTrigger>
                  </TabsList>

                  {/* Hero Products Tab */}
                  <TabsContent value="hero" className="space-y-6">
                    <form onSubmit={handleHeroSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="hero-product">Product Type</Label>
                          <Select 
                            value={heroForm.product_type} 
                            onValueChange={(value) => setHeroForm({...heroForm, product_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {heroProducts.map((product) => (
                                <SelectItem key={product.value} value={product.value}>
                                  <div className="flex items-center space-x-2">
                                    <product.icon className="h-4 w-4" />
                                    <span>{product.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hero-term">Term (Years)</Label>
                          <Select 
                            value={heroForm.term_years} 
                            onValueChange={(value) => setHeroForm({...heroForm, term_years: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Year</SelectItem>
                              <SelectItem value="2">2 Years</SelectItem>
                              <SelectItem value="3">3 Years</SelectItem>
                              <SelectItem value="4">4 Years</SelectItem>
                              <SelectItem value="5">5 Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hero-coverage">Coverage Limit</Label>
                          <Select 
                            value={heroForm.coverage_limit} 
                            onValueChange={(value) => setHeroForm({...heroForm, coverage_limit: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="500">$500</SelectItem>
                              <SelectItem value="1000">$1,000</SelectItem>
                              <SelectItem value="unlimited">Unlimited</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hero-customer">Customer Type</Label>
                          <Select 
                            value={heroForm.customer_type} 
                            onValueChange={(value) => setHeroForm({...heroForm, customer_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="retail">Retail Customer</SelectItem>
                              <SelectItem value="wholesale">Wholesale/Reseller</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Calculating...' : 'Get Hero Products Quote'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Enhanced VSC Tab with VIN Auto-Detection */}
                  <TabsContent value="vsc" className="space-y-6">
                    <form onSubmit={handleVSCSubmit} className="space-y-6">
                      {/* VIN Input Section */}
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                        <div className="flex items-center space-x-2">
                          <Search className="h-5 w-5 text-blue-600" />
                          <Label className="text-lg font-semibold text-blue-900">VIN Auto-Detection</Label>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vsc-vin">Vehicle Identification Number (VIN)</Label>
                          <div className="relative">
                            <Input
                              id="vsc-vin"
                              placeholder="Enter 17-character VIN"
                              value={vscForm.vin}
                              onChange={(e) => setVscForm({...vscForm, vin: e.target.value.toUpperCase()})}
                              maxLength={17}
                              className={`${vinError ? 'border-red-500' : ''} ${vinInfo ? 'border-green-500' : ''}`}
                            />
                            {vinDecoding && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader className="h-4 w-4 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                          
                          {vinError && (
                            <div className="flex items-center space-x-2 text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>{vinError}</span>
                            </div>
                          )}
                          
                          {vinInfo && (
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-800 font-medium">VIN Decoded Successfully</span>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><strong>Make:</strong> {vinInfo.make}</p>
                                <p><strong>Model:</strong> {vinInfo.model}</p>
                                <p><strong>Year:</strong> {vinInfo.year}</p>
                                {vinInfo.trim && <p><strong>Trim:</strong> {vinInfo.trim}</p>}
                                {vinInfo.engine && <p><strong>Engine:</strong> {vinInfo.engine}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Information Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="vsc-make">
                            Vehicle Make
                            {vscForm.auto_populated && <Badge variant="secondary" className="ml-2 text-xs">Auto-filled</Badge>}
                          </Label>
                          <Select 
                            value={vscForm.make} 
                            onValueChange={(value) => setVscForm({...vscForm, make: value})}
                          >
                            <SelectTrigger className={vscForm.auto_populated ? 'bg-green-50 border-green-300' : ''}>
                              <SelectValue placeholder="Select make" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicleMakes.map((make) => (
                                <SelectItem key={make} value={make}>
                                  {make}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vsc-model">
                            Vehicle Model
                            {vscForm.auto_populated && <Badge variant="secondary" className="ml-2 text-xs">Auto-filled</Badge>}
                          </Label>
                          <Input
                            id="vsc-model"
                            placeholder="Enter model"
                            value={vscForm.model}
                            onChange={(e) => setVscForm({...vscForm, model: e.target.value})}
                            className={vscForm.auto_populated ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vsc-year">
                            Vehicle Year
                            {vscForm.auto_populated && <Badge variant="secondary" className="ml-2 text-xs">Auto-filled</Badge>}
                          </Label>
                          <Input
                            id="vsc-year"
                            type="number"
                            placeholder="2020"
                            min="1990"
                            max={new Date().getFullYear() + 1}
                            value={vscForm.year}
                            onChange={(e) => setVscForm({...vscForm, year: e.target.value})}
                            className={vscForm.auto_populated ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vsc-mileage">Current Mileage</Label>
                          <Input
                            id="vsc-mileage"
                            type="number"
                            placeholder="50000"
                            min="0"
                            max="500000"
                            value={vscForm.mileage}
                            onChange={(e) => setVscForm({...vscForm, mileage: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vsc-coverage">Coverage Level</Label>
                          <Select 
                            value={vscForm.coverage_level} 
                            onValueChange={(value) => setVscForm({...vscForm, coverage_level: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="silver">Silver Coverage</SelectItem>
                              <SelectItem value="gold">Gold Coverage</SelectItem>
                              <SelectItem value="platinum">Platinum Coverage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vsc-term">Term (Months)</Label>
                          <Select 
                            value={vscForm.term_months} 
                            onValueChange={(value) => setVscForm({...vscForm, term_months: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12 Months</SelectItem>
                              <SelectItem value="24">24 Months</SelectItem>
                              <SelectItem value="36">36 Months</SelectItem>
                              <SelectItem value="48">48 Months</SelectItem>
                              <SelectItem value="60">60 Months</SelectItem>
                              <SelectItem value="72">72 Months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Eligibility Check Results */}
                      {eligibilityCheck && (
                        <div className={`p-4 rounded-lg border ${
                          eligibilityCheck.eligible 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            {eligibilityCheck.eligible ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className={`font-medium ${
                              eligibilityCheck.eligible ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {eligibilityCheck.eligible ? 'Vehicle Eligible' : 'Vehicle Not Eligible'}
                            </span>
                          </div>
                          
                          {eligibilityCheck.restrictions.length > 0 && (
                            <div className="mb-2">
                              <p className="text-red-800 font-medium text-sm mb-1">Restrictions:</p>
                              <ul className="text-red-700 text-sm space-y-1">
                                {eligibilityCheck.restrictions.map((restriction, index) => (
                                  <li key={index}>• {restriction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {eligibilityCheck.warnings.length > 0 && (
                            <div>
                              <p className="text-yellow-800 font-medium text-sm mb-1">Warnings:</p>
                              <ul className="text-yellow-700 text-sm space-y-1">
                                {eligibilityCheck.warnings.map((warning, index) => (
                                  <li key={index}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading || (eligibilityCheck && !eligibilityCheck.eligible)}
                      >
                        {loading ? 'Calculating...' : 'Get VSC Quote'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quote Results - keeping the existing quote display logic */}
          <div className="space-y-6">
            {quote ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span>Your Quote</span>
                    </CardTitle>
                    <CardDescription>
                      Professional protection plan pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold price-highlight">
                        {formatCurrency(quote.pricing?.total_price || quote.total_price)}
                      </div>
                      <Badge variant="secondary">
                        {quote.product_info?.customer_type === 'wholesale' ? 'Wholesale Price' : 'Retail Price'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrency(quote.pricing?.base_price || quote.base_price)}</span>
                      </div>
                      {quote.pricing?.admin_fee && (
                        <div className="flex justify-between">
                          <span>Admin Fee:</span>
                          <span>{formatCurrency(quote.pricing.admin_fee)}</span>
                        </div>
                      )}
                      {quote.pricing?.tax_amount && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(quote.pricing.tax_amount)}</span>
                        </div>
                      )}
                      {quote.discount && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(quote.discount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-3 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(quote.pricing?.total_price || quote.total_price)}</span>
                      </div>
                    </div>

                    {(quote.pricing?.monthly_payment || quote.monthly_payment) && (
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Monthly Payment</div>
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(quote.pricing?.monthly_payment || quote.monthly_payment)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button className="w-full">
                        Purchase This Plan
                      </Button>
                      <Button variant="outline" className="w-full">
                        Save Quote
                      </Button>
                    </div>

                    {quote.coverage_details && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Coverage Details:</h4>
                        <ul className="text-sm space-y-1">
                          {quote.coverage_details.map((detail, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* VIN Information Display in Quote */}
                    {activeTab === 'vsc' && vinInfo && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-semibold">Vehicle Information:</h4>
                        <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                          <p><strong>VIN:</strong> {vscForm.vin}</p>
                          <p><strong>Vehicle:</strong> {vinInfo.year} {vinInfo.make} {vinInfo.model}</p>
                          {vinInfo.trim && <p><strong>Trim:</strong> {vinInfo.trim}</p>}
                          {vinInfo.engine && <p><strong>Engine:</strong> {vinInfo.engine}</p>}
                          <p><strong>Mileage:</strong> {parseInt(vscForm.mileage).toLocaleString()} miles</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-semibold">Get Your Quote</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === 'vsc' 
                          ? 'Enter your VIN or vehicle details to see personalized pricing'
                          : 'Fill out the form to see your personalized pricing'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits Card */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Our Protection?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Instant quotes with real-time pricing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>VIN-based auto-detection for accuracy</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Competitive rates and flexible terms</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Professional claims processing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>24/7 customer support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Nationwide coverage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* VIN Decoder Help Card */}
            {activeTab === 'vsc' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>VIN Help</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <p><strong>Where to find your VIN:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Dashboard (driver's side, visible through windshield)</li>
                    <li>• Driver's side door jamb sticker</li>
                    <li>• Vehicle registration or title</li>
                    <li>• Insurance documents</li>
                  </ul>
                  <p className="text-muted-foreground">
                    The VIN automatically fills vehicle details and checks eligibility for our service contracts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotePage