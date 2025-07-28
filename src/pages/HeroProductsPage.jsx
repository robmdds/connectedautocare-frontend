import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Home, Car, DollarSign, CheckCircle, ArrowRight, Star } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { heroAPI, formatCurrency } from '../lib/api'

const HeroProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Helper function to generate product names from product_code
  const generateProductNameFromType = (productCode) => {
    const nameMap = {
      'HOME_PROTECTION_PLAN': 'Home Protection Plan',
      'COMPREHENSIVE_AUTO_PROTECTION': 'Comprehensive Auto Protection',
      'HOME_DEDUCTIBLE_REIMBURSEMENT': 'Home Deductible Reimbursement',
      'MULTI_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': 'Multi Vehicle Deductible Reimbursement',
      'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT': 'Auto Advantage Deductible Reimbursement',
      'ALL_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': 'All Vehicle Deductible Reimbursement',
      'AUTO_RV_DEDUCTIBLE_REIMBURSEMENT': 'Auto & RV Deductible Reimbursement',
      'HERO_LEVEL_HOME_PROTECTION': 'Hero-Level Protection for Your Home'
    }
    
    return nameMap[productCode] || productCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await heroAPI.getAllProducts()
        
        // Handle response format: [responseData, statusCode]
        let responseData = response
        if (Array.isArray(response) && response.length >= 1) {
          responseData = response[0] // Get the actual data from the array
        }
        
        const allProducts = []
        
        // Check if we have the new database format
        if (responseData && responseData.data && responseData.data.products && Array.isArray(responseData.data.products)) {
          
          responseData.data.products.forEach((product, index) => {
            
            // Validate required fields
            if (!product.product_code || !product.base_price) {
              return
            }
            
            // Use product_code and product_name directly
            const productCode = product.product_code
            const productName = product.product_name || generateProductNameFromType(product.product_code)
            
            // Determine category from product_code
            let category = 'deductible_reimbursement'
            let categoryName = 'Deductible Reimbursement'
            
            const productCodeLower = product.product_code.toLowerCase()
            
            if (productCodeLower.includes('home_protection') || productCodeLower.includes('hero_level_protection_home')) {
              category = 'home_protection'
              categoryName = 'Home Protection'
            } else if (productCodeLower.includes('auto_protection')) {
              category = 'auto_protection'  
              categoryName = 'Auto Protection'
            }
            
            // Calculate price range from pricing data
            let minPrice = product.base_price || 0
            let maxPrice = product.base_price || 0
            
            if (product.pricing && typeof product.pricing === 'object') {
              try {
                const prices = Object.values(product.pricing)
                  .filter(p => p && typeof p === 'object' && p.price)
                  .map(p => p.price)
                
                if (prices.length > 0) {
                  minPrice = Math.min(...prices)
                  maxPrice = Math.max(...prices)
                }
              } catch (e) {
                console.warn('Error processing pricing data for product:', productCode, e)
              }
            }
            
            // Get available terms from pricing data
            let availableTerms = [1]
            if (product.pricing && typeof product.pricing === 'object') {
              availableTerms = Object.keys(product.pricing)
                .map(Number)
                .filter(n => !isNaN(n))
                .sort()
              
              if (availableTerms.length === 0) {
                availableTerms = [1]
              }
            }
            
            const processedProduct = {
              id: productCode,
              product_code: productCode,
              name: productName,
              category: category,
              category_name: categoryName,
              description: generateProductDescription(productName),
              short_description: generateShortDescription(productName),
              base_price: product.base_price || 0,
              min_price: Math.round(minPrice),
              max_price: Math.round(maxPrice),
              terms: availableTerms,
              features: generateProductFeatures(productCode),
              coverage_limits: [500, 1000],
              pricing: product.pricing || {},
              data_source: responseData.data.data_source || 'database'
            }
            
            allProducts.push(processedProduct)
          })
        } 
        // Fallback to old format if needed
        else if (responseData && responseData.data && typeof responseData.data === 'object') {
          Object.entries(responseData.data).forEach(([categoryKey, categoryInfo]) => {
            if (categoryInfo && categoryInfo.products && Array.isArray(categoryInfo.products)) {
              categoryInfo.products.forEach(product => {
                if (product.product_code && product.product_name) {
                  allProducts.push({
                    ...product,
                    category: categoryKey,
                    category_name: categoryInfo.category_name,
                    category_description: categoryInfo.category_description,
                    id: product.product_code,
                    name: product.product_name,
                    description: product.detailed_description,
                    short_description: product.short_description,
                    min_price: product.price_range?.min_price || product.base_price,
                    max_price: product.price_range?.max_price || product.base_price,
                    terms: product.terms_available || [1, 2, 3],
                    features: product.features || [],
                    coverage_limits: product.coverage_limits || []
                  })
                }
              })
            }
          })
        }
        // If no valid format found, use fallback
        else {
          allProducts.push(...getFallbackProducts())
        }
        setProducts(allProducts)
        
      } catch (error) {
        console.error('Failed to fetch products:', error)
        // Set fallback products with July 2025 pricing
        setProducts(getFallbackProducts())
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Helper function to generate product descriptions
  const generateProductDescription = (productName) => {
    const descriptions = {
      'Home Protection Plan': 'Comprehensive home protection plan including deductible reimbursement for covered claims, glass repair coverage, lockout assistance, and emergency services.',
      'Comprehensive Auto Protection': 'All-inclusive automotive protection plan covering deductible reimbursement, dent repair, emergency roadside assistance, and more.',
      'Home Deductible Reimbursement': 'Specialized coverage for home insurance deductibles with additional identity theft restoration and warranty vault services.',
      'Auto Advantage Deductible Reimbursement': 'Targeted deductible reimbursement for a single vehicle with additional identity restoration and warranty vault services.',
      'Multi Vehicle Deductible Reimbursement': 'Flexible deductible reimbursement plan covering multiple vehicles with the ability to add or remove vehicles during the coverage term.',
      'All Vehicle Deductible Reimbursement': 'Comprehensive deductible reimbursement covering cars, motorcycles, ATVs, boats, and RVs.',
      'Auto & RV Deductible Reimbursement': 'Specialized deductible reimbursement for both automobiles and recreational vehicles with enhanced benefits for RV owners.',
      'Hero-Level Protection for Your Home': 'Our most comprehensive home protection plan offering maximum coverage limits, premium services, and enhanced benefits.'
    }
    return descriptions[productName] || `Professional ${productName.toLowerCase()} with comprehensive coverage and competitive rates.`
  }

  const generateShortDescription = (productName) => {
    const shortDescriptions = {
      'Home Protection Plan': 'Complete home protection coverage',
      'Comprehensive Auto Protection': 'Complete automotive protection package',
      'Home Deductible Reimbursement': 'Home insurance deductible coverage',
      'Auto Advantage Deductible Reimbursement': 'Single vehicle deductible coverage',
      'Multi Vehicle Deductible Reimbursement': 'Multiple vehicle protection plan',
      'All Vehicle Deductible Reimbursement': 'Multi-vehicle protection coverage',
      'Auto & RV Deductible Reimbursement': 'Auto and RV specialized coverage',
      'Hero-Level Protection for Your Home': 'Premium home protection package'
    }
    return shortDescriptions[productName] || `Professional ${productName.toLowerCase()}`
  }

  const generateProductFeatures = (productCode) => {
    const features = {
      'HOME_PROTECTION_PLAN': [
        'Deductible reimbursement up to policy limits',
        'Glass repair and replacement coverage',
        '24/7 lockout assistance',
        'Emergency plumbing and electrical services',
        'HVAC emergency coverage'
      ],
      'COMPREHENSIVE_AUTO_PROTECTION': [
        'Auto insurance deductible reimbursement',
        'Paintless dent repair coverage',
        '24/7 emergency roadside assistance',
        'Towing and labor coverage',
        'Rental car assistance'
      ],
      'HOME_DEDUCTIBLE_REIMBURSEMENT': [
        'Home insurance deductible reimbursement',
        'Identity theft restoration services',
        'Warranty vault document storage',
        '24/7 customer support',
        'Fast claim processing'
      ],
      'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT': [
        'Single VIN auto deductible reimbursement',
        'Identity theft restoration services',
        'Warranty vault document storage',
        'Fast claim processing',
        '24/7 customer support'
      ],
      'MULTI_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': [
        'Multiple vehicle protection',
        'Flexible vehicle additions/removals',
        'Comprehensive deductible reimbursement',
        'Identity theft restoration services',
        'Family-friendly customer support'
      ],
      'ALL_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': [
        'Multi-vehicle coverage (cars, motorcycles, ATVs, boats, RVs)',
        'Unlimited vehicle additions during term',
        'Identity theft restoration services',
        'Priority claim processing',
        '24/7 customer support'
      ],
      'AUTO_RV_DEDUCTIBLE_REIMBURSEMENT': [
        'Auto and RV deductible coverage',
        'Enhanced RV emergency services',
        'Specialized RV roadside assistance',
        'Identity theft restoration services',
        'RV-specific customer support'
      ],
      'HERO_LEVEL_HOME_PROTECTION': [
        'Maximum deductible reimbursement coverage',
        'Premium glass repair and replacement',
        'Priority 24/7 emergency services',
        'Enhanced HVAC and appliance coverage',
        'Concierge-level customer service'
      ]
    }
    return features[productCode] || ['Professional coverage', 'Expert customer service', 'Competitive rates']
  }

  const getFallbackProducts = () => {
    // Fallback products with July 2025 pricing
    return [
      {
        id: 'HOME_PROTECTION_PLAN',
        product_code: 'HOME_PROTECTION_PLAN',
        name: 'Home Protection Plan',
        category: 'home_protection',
        category_name: 'Home Protection',
        description: generateProductDescription('Home Protection Plan'),
        short_description: 'Complete home protection coverage',
        base_price: 199,
        min_price: 199,
        max_price: 599,
        terms: [1, 2, 3, 4, 5],
        features: generateProductFeatures('HOME_PROTECTION_PLAN'),
        coverage_limits: [500, 1000],
        data_source: 'fallback'
      },
      {
        id: 'COMPREHENSIVE_AUTO_PROTECTION',
        product_code: 'COMPREHENSIVE_AUTO_PROTECTION',
        name: 'Comprehensive Auto Protection',
        category: 'auto_protection',
        category_name: 'Auto Protection',
        description: generateProductDescription('Comprehensive Auto Protection'),
        short_description: 'Complete automotive protection package',
        base_price: 339,
        min_price: 339,
        max_price: 1099,
        terms: [1, 2, 3, 4, 5],
        features: generateProductFeatures('COMPREHENSIVE_AUTO_PROTECTION'),
        coverage_limits: [500, 1000],
        data_source: 'fallback'
      },
      {
        id: 'HOME_DEDUCTIBLE_REIMBURSEMENT',
        product_code: 'HOME_DEDUCTIBLE_REIMBURSEMENT',
        name: 'Home Deductible Reimbursement',
        category: 'home_protection',
        category_name: 'Home Protection',
        description: generateProductDescription('Home Deductible Reimbursement'),
        short_description: 'Home insurance deductible coverage',
        base_price: 160,
        min_price: 160,
        max_price: 255,
        terms: [1, 2, 3],
        features: generateProductFeatures('HOME_DEDUCTIBLE_REIMBURSEMENT'),
        coverage_limits: [500, 1000],
        data_source: 'fallback'
      },
      {
        id: 'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT',
        product_code: 'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT',
        name: 'Auto Advantage Deductible Reimbursement',
        category: 'deductible_reimbursement',
        category_name: 'Deductible Reimbursement',
        description: generateProductDescription('Auto Advantage Deductible Reimbursement'),
        short_description: 'Single vehicle deductible coverage',
        base_price: 120,
        min_price: 120,
        max_price: 225,
        terms: [1, 2, 3],
        features: generateProductFeatures('AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT'),
        coverage_limits: [500, 1000],
        data_source: 'fallback'
      }
    ]
  }

  const categories = [
    { id: 'all', name: 'All Products', icon: Shield },
    { id: 'home_protection', name: 'Home Protection', icon: Home },
    { id: 'auto_protection', name: 'Auto Protection', icon: Car },
    { id: 'deductible_reimbursement', name: 'Deductible Reimbursement', icon: DollarSign }
  ]

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  const features = [
    {
      title: "Comprehensive Coverage",
      description: "Complete protection for your most valuable assets with industry-leading coverage options."
    },
    {
      title: "Competitive Pricing", 
      description: "Updated July 2025 rates with flexible payment options and wholesale pricing for resellers."
    },
    {
      title: "Fast Claims Processing",
      description: "Quick and efficient claims handling with dedicated support throughout the process."
    },
    {
      title: "Professional Service",
      description: "Expert customer service and support from licensed insurance professionals."
    }
  ]

  const testimonials = [
    {
      name: "Sarah M.",
      product: "Home Protection Plan",
      content: "When my water heater failed, Hero covered the replacement completely. The process was seamless!",
      rating: 5
    },
    {
      name: "Mike R.",
      product: "Auto Protection Plan",
      content: "Great coverage and even better customer service. Highly recommend for peace of mind.",
      rating: 5
    },
    {
      name: "Jennifer L.",
      product: "Deductible Reimbursement",
      content: "Saved me hundreds on my insurance deductible. Worth every penny!",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30">
                Hero Protection Products - July 2025 Pricing
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold">
                Professional Protection Plans
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto">
                Comprehensive coverage for your home, auto, and peace of mind. 
                Industry-leading protection with updated competitive rates and professional service.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                <Link to="/quote">
                  Get Instant Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                View All Products
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Choose Your Protection Category</h2>
            <p className="text-muted-foreground">
              Select a category to view specific protection plans with our latest July 2025 pricing.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            <>
                            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="card-hover h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-primary/10 p-3 rounded-full">
                            {product.category === 'home_protection' && <Home className="h-6 w-6 text-primary" />}
                            {product.category === 'auto_protection' && <Car className="h-6 w-6 text-primary" />}
                            {product.category === 'deductible_reimbursement' && <DollarSign className="h-6 w-6 text-primary" />}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary">
                              {product.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            {product.data_source && (
                              <Badge variant="outline" className="text-xs">
                                {product.data_source === 'database' ? 'Live Pricing' : 'Updated 2025'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price Range:</span>
                            <span className="font-semibold price-highlight">
                              {formatCurrency(product.min_price)} - {formatCurrency(product.max_price)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Terms Available:</span>
                            <span className="text-sm">{product.terms.join(', ')} years</span>
                          </div>
                          {product.base_price && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Starting at:</span>
                              <span className="text-sm font-medium">{formatCurrency(product.base_price)}</span>
                            </div>
                          )}
                        </div>

                        {product.features && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Key Features:</h4>
                            <ul className="space-y-1">
                              {product.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-center space-x-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Button asChild className="w-full">
                            <Link to={`/quote?product=${product.id}`}>
                              Get Quote
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" className="w-full">
                            Learn More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try selecting a different category or check back later.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Why Choose Hero Products?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Industry-leading protection with professional service, updated competitive rates, and comprehensive coverage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover h-full text-center">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Customer Success Stories</h2>
            <p className="text-xl text-muted-foreground">
              Real experiences from customers who chose Hero protection products.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-lg mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.product}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Protect What Matters Most?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Get an instant quote with our updated July 2025 pricing for any Hero protection product and discover why thousands of customers trust us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                <Link to="/quote">
                  Get Your Quote Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link to="/contact">
                  Speak with an Expert
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HeroProductsPage