import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car, Shield, CheckCircle, ArrowRight, Star, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VSCPage = () => {
  const [vscData, setVscData] = useState({
    coverageLevels: {},
    vehicleClasses: {},
    termOptions: {},
    deductibleOptions: {},
    loading: true,
    error: null
  });

  const [healthStatus, setHealthStatus] = useState({
    database_integration: false,
    pdf_rates_available: false
  });

  // Fetch VSC data from backend
  useEffect(() => {
    const fetchVSCData = async () => {
      try {
        setVscData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch coverage options from your API
        const [coverageResponse, healthResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/vsc/coverage-options`),
          fetch(`${API_BASE_URL}/api/vsc/health`)
        ]);

        if (!coverageResponse.ok) {
          throw new Error(`Failed to fetch coverage options: ${coverageResponse.status}`);
        }

        const coverageData = await coverageResponse.json();
        const healthData = healthResponse.ok ? await healthResponse.json() : {};

        // Handle array response format [data, statusCode] or direct object
        let apiData;
        if (Array.isArray(coverageData)) {
          // Response is [responseData, statusCode]
          apiData = coverageData[0];
        } else {
          apiData = coverageData;
        }

        // Extract data from the nested structure
        const data = apiData.success && apiData.data ? apiData.data : apiData;
        
        setVscData({
          coverageLevels: data.coverage_levels || {},
          vehicleClasses: data.vehicle_classes || {},
          termOptions: data.term_options || {},
          deductibleOptions: data.deductible_options || {},
          loading: false,
          error: null
        });

        // Handle health data response format
        let healthInfo;
        if (Array.isArray(healthData)) {
          healthInfo = healthData[0];
        } else {
          healthInfo = healthData;
        }
        
        setHealthStatus({
          database_integration: healthInfo?.database_integration?.status === 'connected' || 
                               healthInfo?.status === 'healthy',
          pdf_rates_available: healthInfo?.database_integration?.pdf_rates_available || 
                              healthInfo?.enhanced_features?.database_rates || false
        });

      } catch (error) {
        console.error('Error fetching VSC data:', error);
        setVscData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
        
        // Set fallback data
        setVscData(prev => ({
          ...prev,
          coverageLevels: getFallbackCoverageLevels(),
          vehicleClasses: getFallbackVehicleClasses(),
          termOptions: { available_terms: [12, 24, 36, 48, 60, 72] },
          deductibleOptions: { available_deductibles: [0, 50, 100, 200, 500, 1000] }
        }));
      }
    };

    fetchVSCData();
  }, []);

  // Fallback data in case API fails
  const getFallbackCoverageLevels = () => ({
    silver: {
      name: "Silver Coverage",
      description: "Essential protection for your vehicle's most important components"
    },
    gold: {
      name: "Gold Coverage", 
      description: "Comprehensive protection with enhanced coverage options"
    },
    platinum: {
      name: "Platinum Coverage",
      description: "Maximum protection with premium benefits and services"
    }
  });

  const getFallbackVehicleClasses = () => ({
    A: {
      description: "Class A - Most Reliable",
      example_makes: ["Honda", "Toyota", "Nissan", "Hyundai", "Kia"]
    },
    B: {
      description: "Class B - Moderate Risk",
      example_makes: ["Ford", "Chevrolet", "Buick", "Chrysler", "Dodge"]
    },
    C: {
      description: "Class C - Higher Risk", 
      example_makes: ["BMW", "Mercedes-Benz", "Audi", "Cadillac", "Lincoln"]
    }
  });

  // Transform API data to component format
  const transformCoverageLevels = () => {
    const levels = vscData.coverageLevels;
    const baseRates = {
      silver: "$1,500 - $2,500",
      gold: "$1,800 - $2,800", 
      platinum: "$2,200 - $3,500"
    };

    return Object.entries(levels).map(([key, level]) => ({
      name: level.name || `${key.charAt(0).toUpperCase() + key.slice(1)} Coverage`,
      description: level.description || `${key.charAt(0).toUpperCase() + key.slice(1)} level protection`,
      features: getCoverageFeatures(key),
      priceRange: baseRates[key] || "Contact for pricing",
      color: getCoverageColor(key),
      popular: key === 'gold'
    }));
  };

  const getCoverageFeatures = (level) => {
    const features = {
      silver: [
        "Engine coverage",
        "Transmission protection", 
        "Basic electrical systems",
        "24/7 roadside assistance",
        "Nationwide coverage"
      ],
      gold: [
        "All Silver benefits",
        "Air conditioning system",
        "Power steering", 
        "Fuel system coverage",
        "Rental car reimbursement"
      ],
      platinum: [
        "All Gold benefits",
        "Complete electrical coverage",
        "Advanced diagnostics",
        "Trip interruption coverage", 
        "Concierge services"
      ]
    };
    return features[level] || ["Comprehensive vehicle protection"];
  };

  const getCoverageColor = (level) => {
    const colors = {
      silver: "bg-gray-500",
      gold: "bg-yellow-500",
      platinum: "bg-purple-500"
    };
    return colors[level] || "bg-blue-500";
  };

  const transformVehicleClasses = () => {
    const classes = vscData.vehicleClasses;
    const rateDescriptions = {
      A: "Lowest Rates",
      B: "Standard Rates", 
      C: "Premium Rates"
    };

    return Object.entries(classes).map(([key, classInfo]) => ({
      class: `Class ${key}`,
      description: classInfo.description || `Class ${key} vehicles`,
      makes: classInfo.example_makes || [],
      rateMultiplier: rateDescriptions[key] || "Standard Rates"
    }));
  };

  // Static testimonials (these would typically come from a CMS or separate API)
  const testimonials = [
    {
      name: "David Thompson",
      vehicle: "2019 Honda Accord",
      content: "My transmission failed at 85,000 miles. VSC covered the entire $4,200 repair. Best investment I ever made!",
      rating: 5,
      savings: "$4,200"
    },
    {
      name: "Maria Garcia", 
      vehicle: "2020 Ford Explorer",
      content: "The air conditioning system went out in summer. Quick approval and repair - no hassle at all.",
      rating: 5,
      savings: "$1,800"
    },
    {
      name: "Robert Chen",
      vehicle: "2018 BMW X5", 
      content: "Multiple electrical issues covered under my Platinum plan. The peace of mind is worth every penny.",
      rating: 5,
      savings: "$3,500"
    }
  ];

  const benefits = [
    {
      title: "Nationwide Coverage",
      description: "Get service at any ASE-certified repair facility across the United States"
    },
    {
      title: "24/7 Roadside Assistance", 
      description: "Emergency roadside help whenever and wherever you need it"
    },
    {
      title: "Rental Car Coverage",
      description: "Reimbursement for rental car expenses during covered repairs"
    },
    {
      title: "Trip Interruption",
      description: "Coverage for lodging and meals if your trip is interrupted by a breakdown"
    },
    {
      title: "Transferable Coverage",
      description: "Transfer your contract to a new owner to help maintain vehicle value"
    },
    {
      title: "Flexible Deductible Options",
      description: `Choose from ${vscData.deductibleOptions.available_deductibles?.length || 6} deductible options`
    }
  ];

  if (vscData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg">Loading VSC information...</p>
        </div>
      </div>
    );
  }

  const coverageLevels = transformCoverageLevels();
  const vehicleClasses = transformVehicleClasses();
  const maxTerm = Math.max(...(vscData.termOptions.available_terms || [72]));
  const totalCoverageLevels = Object.keys(vscData.coverageLevels).length || 3;

  return (
    <div className="min-h-screen">
      {/* Error Alert */}
      {vscData.error && (
        <Alert className="mx-4 mt-4 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Using cached data due to connection issue. Some information may not be current.
            {healthStatus.database_integration && (
              <span className="text-green-600 ml-2">✓ Database connected</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Database Status Indicator */}
      {!vscData.error && healthStatus.database_integration && (
        <div className="bg-green-50 border-b border-green-200 py-2">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-green-700">
            ✓ Live pricing from database
            {healthStatus.pdf_rates_available && " • PDF rates active"}
          </div>
        </div>
      )}

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
                Vehicle Service Contracts
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold">
                Protect Your Vehicle Investment
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto">
                Comprehensive vehicle protection with industry-leading coverage, competitive rates, 
                and professional service from licensed administrators.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                <Link to="/quote">
                  Get VSC Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                View Coverage Options
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalCoverageLevels}</div>
                <div className="text-white/80">Coverage Levels</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{maxTerm}</div>
                <div className="text-white/80">Months Max Term</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-white/80">Roadside Assistance</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coverage Levels */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Choose Your Coverage Level</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the protection level that best fits your vehicle and budget. All plans include professional service and nationwide coverage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coverageLevels.map((level, index) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {level.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <Card className={`card-hover h-full ${level.popular ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className={`${level.color} p-3 rounded-full w-fit mb-4`}>
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{level.name}</CardTitle>
                    <CardDescription className="text-lg price-highlight">
                      {level.priceRange}
                    </CardDescription>
                    <CardDescription>{level.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {level.features.map((feature) => (
                        <li key={feature} className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full">
                      <Link to={`/quote?coverage=${level.name.toLowerCase().replace(' ', '_')}`}>
                        Get {level.name.split(' ')[0]} Quote
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Classes */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Vehicle Classification System</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our pricing is based on vehicle reliability data and manufacturer quality ratings to ensure fair and accurate pricing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vehicleClasses.map((vehicleClass, index) => (
              <motion.div
                key={vehicleClass.class}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover h-full">
                  <CardHeader className="text-center">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                      <Car className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{vehicleClass.class}</CardTitle>
                    <CardDescription className="text-lg">{vehicleClass.description}</CardDescription>
                    <Badge variant="secondary">{vehicleClass.rateMultiplier}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Example Makes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {vehicleClass.makes.slice(0, 8).map((make) => (
                          <Badge key={make} variant="outline" className="text-xs">
                            {make}
                          </Badge>
                        ))}
                        {vehicleClass.makes.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{vehicleClass.makes.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">VSC Benefits & Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive protection with professional service and industry-leading benefits.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Real Customer Savings</h2>
            <p className="text-xl text-muted-foreground">
              See how VSC protection saved our customers thousands in unexpected repair costs.
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
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Saved {testimonial.savings}
                      </Badge>
                    </div>
                    <blockquote className="text-lg mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.vehicle}</div>
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
              Protect Your Vehicle Today
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Don't wait for expensive repairs. Get comprehensive VSC protection with competitive rates and professional service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                <Link to="/quote">
                  Get Your VSC Quote
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

export default VSCPage