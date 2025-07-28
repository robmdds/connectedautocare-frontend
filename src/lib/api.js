// Configuration
const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 
    (import.meta.env.MODE === 'production' 
      ? 'https://api.connectedautocare.com'
      : 'http://localhost:5000'),
  
  PRICING_RANGES: {
    'HOME_PROTECTION_PLAN': { min: 199, max: 599 },
    'COMPREHENSIVE_AUTO_PROTECTION': { min: 339, max: 1099 },
    'HOME_DEDUCTIBLE_REIMBURSEMENT': { min: 160, max: 255 },
    'MULTI_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': { min: 150, max: 275 },
    'AUTO_ADVANTAGE_DEDUCTIBLE_REIMBURSEMENT': { min: 120, max: 225 },
    'ALL_VEHICLE_DEDUCTIBLE_REIMBURSEMENT': { min: 150, max: 275 },
    'AUTO_RV_DEDUCTIBLE_REIMBURSEMENT': { min: 175, max: 280 },
    'HERO_LEVEL_HOME_PROTECTION': { min: 789, max: 1295 }
  },

  ROLE_PERMISSIONS: {
    admin: ['all'],
    wholesale_reseller: ['view_wholesale_pricing', 'create_quotes', 'manage_customers', 'view_analytics'],
    customer: ['view_retail_pricing', 'create_quotes', 'view_own_policies'],
  },

  ROLE_LEVELS: {
    admin: 100,
    wholesale_reseller: 50,
    customer: 10,
  },

  // VIN Configuration
  VIN_CONFIG: {
    length: 17,
    invalidChars: ['I', 'O', 'Q'],
    validPattern: /^[A-HJ-NPR-Z0-9]{17}$/,
    debounceDelay: 500,
  },

  // VSC Eligibility Rules
  VSC_ELIGIBILITY: {
    maxAge: 15,
    maxMileage: 150000,
    warningAge: 10,
    warningMileage: 125000,
    luxuryBrands: ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti'],
    highMaintenanceBrands: ['Land Rover', 'Jaguar', 'Porsche', 'Maserati', 'Bentley', 'Rolls-Royce']
  }
};

// Core API Client
class APIClient {
  constructor(baseURL = CONFIG.API_BASE_URL) {
    this.baseURL = baseURL;
  }

  getAuthHeaders() {
    // Check for both possible token keys for backward compatibility
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check for HTML response (potential CORS/config issue)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        const htmlText = await response.text();
        console.error('Server returned HTML instead of JSON:', htmlText.substring(0, 500));
        throw new Error('Server returned HTML instead of JSON. This might be a CORS issue or server configuration problem.');
      }
      
      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        const responseText = await response.text();
        console.error('Raw response:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  handleRequestError(error) {
    console.error('API request failed:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to server. This could be a CORS issue or the backend might be down.');
    }
    
    if (error.message.includes('CORS')) {
      throw new Error('CORS error: The backend is not properly configured to accept requests from this domain.');
    }
  }

  // HTTP Methods
  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

// Initialize API client
const api = new APIClient();

// API Modules
export const healthAPI = {
  checkHealth: () => api.get('/health'),
  checkAPIHealth: () => api.get('/api/health'),
};

export const heroAPI = {
  checkHealth: () => api.get('/api/hero/health'),
  getAllProducts: () => api.get('/api/hero/products'),
  getProductsByCategory: (category) => api.get(`/api/hero/products/${category}`),
  generateQuote: (quoteData) => api.post('/api/hero/quote', quoteData),
  getDatabaseProducts: () => api.get('/api/pricing/products'),
  getProductPricing: (productCode) => api.get(`/api/pricing/${productCode}`),
  getContactInfo: () => api.get('/api/contact'),
};

export const pricingAPI = {
  getAllProducts: () => api.get('/api/pricing/products'),
  getProductPricing: (productCode, termYears = 1, customerType = 'retail') => 
    api.get(`/api/pricing/${productCode}?term_years=${termYears}&customer_type=${customerType}`),
  generateQuote: (quoteData) => api.post('/api/pricing/quote', quoteData),
  updatePricing: (pricingData) => api.post('/api/pricing/admin/pricing/update', pricingData),
};

// Enhanced VSC API with VIN integration
export const vscAPI = {
  checkHealth: () => api.get('/api/vsc/health'),
  getCoverageOptions: () => api.get('/api/vsc/coverage-options'),
  generateQuote: (quoteData) => api.post('/api/vsc/quote', quoteData),
  
  // Enhanced VSC methods with VIN support
  generateEnhancedQuote: (quoteData) => api.post('/api/vsc/quote/enhanced', quoteData),
  generateQuoteFromVIN: (vinData) => api.post('/api/vsc/quote/vin', vinData),
  checkEligibility: (vehicleData) => api.post('/api/vsc/eligibility', vehicleData),
  getRecommendations: (vehicleData) => api.post('/api/vsc/recommendations', vehicleData),
  getPricingFactors: (vehicleData) => api.post('/api/vsc/pricing/factors', vehicleData),
};

// Enhanced VIN API
export const vinAPI = {
  checkHealth: () => api.get('/api/vin/health'),
  checkEnhancedHealth: () => api.get('/api/vin/health/enhanced'),
  
  // Basic VIN operations
  validateVIN: (vin) => api.post('/api/vin/validate', { vin }),
  decodeVIN: (vin, includeEligibility = true, mileage = 0) => 
    api.post('/api/vin/decode', { vin, include_eligibility: includeEligibility, mileage }),
  
  // Enhanced VIN operations
  validateVINEnhanced: (vin) => api.post('/api/vin/enhanced/validate', { vin }),
  decodeVINEnhanced: (vin, mileage = 0) => 
    api.post('/api/vin/enhanced/decode', { vin, mileage }),
  getVINInfoWithEligibility: (vin, mileage = 0) => 
    api.post('/api/vin/enhanced/decode', { vin, mileage }),
  
  // Batch operations
  batchDecodeVINs: (vins) => api.post('/api/vin/batch/decode', { vins }),
  
  // Manufacturer lookup
  getManufacturerInfo: (wmi) => api.get(`/api/vin/manufacturer/${wmi}`),
};

export const paymentAPI = {
  getPaymentMethods: () => api.get('/api/payments/methods'),
};

export const contractAPI = {
  generateContract: (contractData) => api.post('/api/contracts/generate', contractData),
};

export const contactAPI = {
  getContactInfo: () => api.get('/api/contact'),
};

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/profile'),
};

export const customerAPI = {
  getAllCustomers: () => api.get('/api/customers'),
  getCustomer: (customerId) => api.get(`/api/customers/${customerId}`),
  createCustomer: (customerData) => api.post('/api/customers', customerData),
  updateCustomer: (customerId, customerData) => api.put(`/api/customers/${customerId}`, customerData),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getCustomerDashboard: () => api.get('/api/analytics/customer-dashboard'),
  generateReport: (reportType, startDate = null, endDate = null) => {
    let url = `/api/analytics/reports/${reportType}`;
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    return api.get(url);
  },
  exportReport: (reportType, format = 'json') => 
    api.get(`/api/analytics/export/${reportType}?format=${format}`),
};

export const adminAPI = {
  // User Management
  getAllUsers: () => api.get('/api/admin/users'),
  updateUserStatus: (userId, status) => api.put(`/api/admin/users/${userId}/status`, { status }),
  
  // Pricing Control
  updateProductPricing: (productCode, pricingData) => 
    api.put(`/api/admin/pricing/${productCode}`, pricingData),
  createProduct: (productData) => api.post('/api/admin/products', productData),
  getAllProducts: () => api.get('/api/admin/products'),
  deleteProduct: (productCode) => api.delete(`/api/admin/products/${productCode}`),
  
  // TPA Management
  getAllTPAs: () => api.get('/api/admin/tpas'),
  createTPA: (tpaData) => api.post('/api/admin/tpas', tpaData),
  updateTPA: (tpaId, tpaData) => api.put(`/api/admin/tpas/${tpaId}`, tpaData),
  deleteTPA: (tpaId) => api.delete(`/api/admin/tpas/${tpaId}`),
  
  // Settings Management
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (settings) => api.put('/api/admin/settings', settings),
  getSetting: (category, key) => api.get(`/api/admin/settings/${category}/${key}`),
  updateSetting: (category, key, value) => api.put(`/api/admin/settings/${category}/${key}`, { value }),
  
  // Contact Management
  updateContactInfo: (contactData) => api.put('/api/admin/contact', contactData),
  
  // Video Management
  getLandingVideo: () => api.get('/api/admin/video'),
  updateLandingVideo: (videoData) => api.put('/api/admin/video', videoData),
  uploadVideo: (formData) => api.post('/api/admin/video/upload', formData),
  
  // Dealer Management
  getDealerPricing: (dealerId) => api.get(`/api/admin/dealer-pricing/${dealerId}`),
  updateDealerPricing: (dealerId, pricingData) => 
    api.put(`/api/admin/dealer-pricing/${dealerId}`, pricingData),
  getAllDealers: () => api.get('/api/admin/dealers'),
  createDealer: (dealerData) => api.post('/api/admin/dealers', dealerData),
};

export const quoteAPI = {
  routeToTPA: (tpaId, quoteData) => api.post(`/api/quotes/route/${tpaId}`, quoteData),
};

export const adminAuthAPI = {
  login: (username, password) => api.post('/api/admin/auth/login', { username, password }),
  logout: () => api.post('/api/admin/auth/logout'),
  verifyToken: () => api.get('/api/admin/auth/verify'),
  changePassword: (currentPassword, newPassword) => 
    api.post('/api/admin/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
};

// VIN Utilities
export const vinUtils = {
  /**
   * Validate VIN format locally
   */
  validateVINFormat(vin) {
    if (!vin || typeof vin !== 'string') {
      return { valid: false, message: 'VIN is required' };
    }

    const cleanVIN = vin.trim().toUpperCase();
    
    if (cleanVIN.length !== CONFIG.VIN_CONFIG.length) {
      return { valid: false, message: `VIN must be exactly ${CONFIG.VIN_CONFIG.length} characters` };
    }

    // Check for invalid characters
    const invalidChars = CONFIG.VIN_CONFIG.invalidChars.filter(char => cleanVIN.includes(char));
    if (invalidChars.length > 0) {
      return { valid: false, message: `VIN cannot contain ${invalidChars.join(', ')}` };
    }

    // Check pattern
    if (!CONFIG.VIN_CONFIG.validPattern.test(cleanVIN)) {
      return { valid: false, message: 'VIN contains invalid characters' };
    }

    return { valid: true, message: 'Valid VIN format' };
  },

  /**
   * Extract basic info from VIN structure
   */
  extractBasicVINInfo(vin) {
    if (!vin || vin.length !== 17) return null;

    const cleanVIN = vin.toUpperCase();
    
    // Year mappings for 10th position (simplified)
    const yearMappings = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
      'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
      'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
    };

    // Basic manufacturer mappings
    const manufacturerMappings = {
      '1HG': 'Honda', '1FA': 'Ford', '1G1': 'Chevrolet', '4T1': 'Toyota',
      'JHM': 'Honda', 'WBA': 'BMW', 'WDD': 'Mercedes-Benz', 'KMH': 'Hyundai'
    };

    const wmi = cleanVIN.substring(0, 3);
    const yearChar = cleanVIN.charAt(9);
    
    return {
      wmi,
      year: yearMappings[yearChar] || null,
      make: manufacturerMappings[wmi] || 'Unknown',
      plantCode: cleanVIN.charAt(10)
    };
  },

  /**
   * Calculate vehicle age
   */
  calculateVehicleAge(year) {
    if (!year) return null;
    return new Date().getFullYear() - year;
  }
};

// Vehicle Eligibility Utilities
export const vehicleUtils = {
  /**
   * Check basic VSC eligibility
   */
  checkBasicEligibility(year, mileage, make = '') {
    const age = vinUtils.calculateVehicleAge(year);
    const rules = CONFIG.VSC_ELIGIBILITY;

    const eligible = age <= rules.maxAge && mileage <= rules.maxMileage;
    const warnings = [];
    const restrictions = [];

    if (age > rules.maxAge) {
      restrictions.push(`Vehicle is ${age} years old (maximum ${rules.maxAge} years)`);
    } else if (age > rules.warningAge) {
      warnings.push(`Vehicle is ${age} years old - limited coverage options`);
    }

    if (mileage > rules.maxMileage) {
      restrictions.push(`Vehicle has ${mileage.toLocaleString()} miles (maximum ${rules.maxMileage.toLocaleString()})`);
    } else if (mileage > rules.warningMileage) {
      warnings.push('High mileage vehicle - premium rates may apply');
    }

    // Check for luxury vehicles
    const makeUpper = make.toUpperCase();
    if (rules.luxuryBrands.some(brand => makeUpper.includes(brand.toUpperCase()))) {
      warnings.push('Luxury vehicle - specialized coverage options available');
    }

    // Check for high-maintenance vehicles
    if (rules.highMaintenanceBrands.some(brand => makeUpper.includes(brand.toUpperCase()))) {
      warnings.push('High-maintenance vehicle - limited coverage options');
    }

    return {
      eligible,
      warnings,
      restrictions,
      age,
      rules
    };
  },

  /**
   * Get vehicle class for pricing
   */
  getVehicleClass(make) {
    if (!make) return 'B';

    const makeUpper = make.toUpperCase();
    
    // Class A - Most Reliable
    const classA = ['HONDA', 'ACURA', 'TOYOTA', 'LEXUS', 'NISSAN', 'INFINITI', 
                   'HYUNDAI', 'KIA', 'MAZDA', 'MITSUBISHI', 'SUBARU'];
    
    // Class C - Higher Risk
    const classC = ['BMW', 'MERCEDES', 'AUDI', 'CADILLAC', 'LINCOLN', 'VOLKSWAGEN',
                   'VOLVO', 'JAGUAR', 'LAND ROVER', 'PORSCHE'];
    
    if (classA.some(brand => makeUpper.includes(brand))) return 'A';
    if (classC.some(brand => makeUpper.includes(brand))) return 'C';
    
    return 'B'; // Default
  }
};

// Quote Storage Utilities
export const quoteStorage = {
  /**
   * Save quote to local storage
   */
  saveQuote(quote) {
    try {
      const quotes = this.getSavedQuotes();
      const quoteWithId = {
        ...quote,
        savedAt: new Date().toISOString(),
        id: quote.quote_id || `QUOTE-${Date.now()}`
      };
      
      quotes.push(quoteWithId);
      
      // Keep only last 10 quotes
      const limitedQuotes = quotes.slice(-10);
      
      localStorage.setItem('connectedautocare_quotes', JSON.stringify(limitedQuotes));
      return quoteWithId;
    } catch (error) {
      console.error('Error saving quote:', error);
      return null;
    }
  },

  /**
   * Get saved quotes from local storage
   */
  getSavedQuotes() {
    try {
      const quotes = localStorage.getItem('connectedautocare_quotes');
      return quotes ? JSON.parse(quotes) : [];
    } catch (error) {
      console.error('Error loading saved quotes:', error);
      return [];
    }
  },

  /**
   * Remove a saved quote
   */
  removeQuote(quoteId) {
    try {
      const quotes = this.getSavedQuotes();
      const filteredQuotes = quotes.filter(q => q.id !== quoteId);
      localStorage.setItem('connectedautocare_quotes', JSON.stringify(filteredQuotes));
      return true;
    } catch (error) {
      console.error('Error removing quote:', error);
      return false;
    }
  },

  /**
   * Clear all saved quotes
   */
  clearAllQuotes() {
    try {
      localStorage.removeItem('connectedautocare_quotes');
      return true;
    } catch (error) {
      console.error('Error clearing quotes:', error);
      return false;
    }
  }
};

// Utility Functions
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatUserRole = (role) => {
  const roleNames = {
    admin: 'Administrator',
    wholesale_reseller: 'Wholesale Reseller',
    customer: 'Customer',
  };
  return roleNames[role] || role;
};

export const formatUserStatus = (status) => {
  const statusNames = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    pending: 'Pending Approval',
  };
  return statusNames[status] || status;
};

// Permission and Role Utilities
export const hasPermission = (user, permission) => {
  if (!user) return false;
  const userPermissions = CONFIG.ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes('all') || userPermissions.includes(permission);
};

export const hasRole = (user, role) => {
  if (!user) return false;
  const userLevel = CONFIG.ROLE_LEVELS[user.role] || 0;
  const requiredLevel = CONFIG.ROLE_LEVELS[role] || 0;
  return userLevel >= requiredLevel;
};

// Business Logic Utilities
export const calculateQuoteTotal = (basePrice, fees = {}, taxes = {}, discounts = {}) => {
  let total = basePrice;
  
  Object.values(fees).forEach(fee => total += fee || 0);
  Object.values(taxes).forEach(tax => total += tax || 0);
  Object.values(discounts).forEach(discount => total -= discount || 0);
  
  return Math.max(0, total);
};

export const validatePricingRange = (productCode, price) => {
  const range = CONFIG.PRICING_RANGES[productCode];
  if (!range) return true;
  return price >= range.min && price <= range.max;
};

// Enhanced Validation Functions with VIN support
export const validateQuoteData = (data, type) => {
  const errors = [];

  if (type === 'hero') {
    if (!data.product_type && !data.product_code) {
      errors.push('Product type or product code is required');
    }
    if (!data.term_years) errors.push('Term is required');
    if (!data.coverage_limit) errors.push('Coverage limit is required');
    
    const termYears = parseInt(data.term_years);
    if (termYears && (termYears < 1 || termYears > 5)) {
      errors.push('Term must be between 1 and 5 years');
    }
    
    const coverageLimit = parseInt(data.coverage_limit);
    if (data.coverage_limit !== 'unlimited' && coverageLimit && coverageLimit < 100) {
      errors.push('Coverage limit must be at least $100');
    }
    
    if (data.customer_type && !['retail', 'wholesale'].includes(data.customer_type)) {
      errors.push('Customer type must be retail or wholesale');
    }
  }

  if (type === 'vsc') {
    // VIN validation (optional but preferred)
    if (data.vin) {
      const vinValidation = vinUtils.validateVINFormat(data.vin);
      if (!vinValidation.valid) {
        errors.push(`VIN: ${vinValidation.message}`);
      }
    }

    // Vehicle info validation (required if no VIN or VIN decode failed)
    if (!data.vin || !data.auto_populated) {
      if (!data.make) errors.push('Vehicle make is required');
      if (!data.year) errors.push('Vehicle year is required');
    }
    
    if (!data.mileage) errors.push('Vehicle mileage is required');
    if (!data.coverage_level) errors.push('Coverage level is required');
    if (!data.term_months) errors.push('Term is required');

    // Validate year range
    if (data.year) {
      const currentYear = new Date().getFullYear();
      const year = parseInt(data.year);
      if (year < 1990 || year > currentYear + 1) {
        errors.push(`Vehicle year must be between 1990 and ${currentYear + 1}`);
      }
    }

    // Validate mileage
    if (data.mileage) {
      const mileage = parseInt(data.mileage);
      if (mileage < 0 || mileage > 500000) {
        errors.push('Mileage must be between 0 and 500,000');
      }
    }

    // Validate coverage level
    if (data.coverage_level && !['silver', 'gold', 'platinum'].includes(data.coverage_level)) {
      errors.push('Coverage level must be silver, gold, or platinum');
    }

    // Validate term
    if (data.term_months) {
      const validTerms = [12, 24, 36, 48, 60, 72];
      const term = parseInt(data.term_months);
      if (!validTerms.includes(term)) {
        errors.push(`Term must be one of: ${validTerms.join(', ')} months`);
      }
    }
  }

  return errors;
};

// Enhanced Error Handling
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  const errorMap = {
    'Failed to fetch': 'Unable to connect to server. Please check your internet connection and try again.',
    'HTML instead of JSON': 'Server configuration error. Please contact support.',
    'CORS': 'Server CORS configuration issue. Please contact support.',
    '404': 'Service not found. Please try again later.',
    '401': 'Authentication required. Please log in again.',
    '403': 'You do not have permission to perform this action.',
    '429': 'Too many requests. Please wait and try again.',
    '500': 'Server error. Please try again later.',
    'VIN': error.message, // Pass through VIN-specific errors
    'Vehicle not eligible': error.message, // Pass through eligibility errors
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      return message;
    }
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Enhanced Testing Functions
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', CONFIG.API_BASE_URL);
    const response = await api.get('/health');
    console.log('Backend connection successful:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Backend connection failed:', error);
    return { success: false, error: error.message };
  }
};

export const testVINServices = async () => {
  try {
    console.log('Testing VIN services...');
    
    // Test VIN health
    const healthResponse = await vinAPI.checkEnhancedHealth();
    console.log('VIN health check:', healthResponse);
    
    // Test VIN decode with sample VIN
    const testVIN = '1HGBH41JXMN109186'; // Sample Honda VIN
    const decodeResponse = await vinAPI.decodeVINEnhanced(testVIN, 50000);
    console.log('VIN decode test:', decodeResponse);
    
    // Test eligibility check
    const eligibilityResponse = await vscAPI.checkEligibility({
      make: 'Honda',
      year: 2020,
      mileage: 50000
    });
    console.log('Eligibility check test:', eligibilityResponse);
    
    return { 
      success: true, 
      message: 'VIN services are working correctly',
      results: {
        health: healthResponse,
        decode: decodeResponse,
        eligibility: eligibilityResponse
      }
    };
  } catch (error) {
    console.error('VIN services test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testDatabasePricing = async () => {
  try {
    console.log('Testing database-driven pricing...');
    
    const productsResponse = await pricingAPI.getAllProducts();
    console.log('Database products response:', productsResponse);
    
    const quoteResponse = await pricingAPI.generateQuote({
      product_code: 'HOME_PROTECTION_PLAN',
      term_years: 3,
      coverage_limit: 500,
      customer_type: 'retail'
    });
    console.log('Database quote response:', quoteResponse);
    
    return { 
      success: true, 
      message: 'Database pricing is working correctly',
      products: productsResponse,
      sampleQuote: quoteResponse
    };
  } catch (error) {
    console.error('Database pricing test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testEnhancedVSCQuoting = async () => {
  try {
    console.log('Testing enhanced VSC quoting with VIN...');
    
    // Test VIN-based quoting
    const vinQuoteResponse = await vscAPI.generateQuoteFromVIN({
      vin: '1HGBH41JXMN109186', // Sample Honda VIN
      mileage: 75000,
      coverage_level: 'gold',
      term_months: 36,
      customer_type: 'retail'
    });
    console.log('VIN-based quote response:', vinQuoteResponse);
    
    // Test enhanced quoting without VIN
    const enhancedQuoteResponse = await vscAPI.generateEnhancedQuote({
      make: 'Toyota',
      model: 'Camry',
      year: 2019,
      mileage: 60000,
      coverage_level: 'gold',
      term_months: 48,
      customer_type: 'retail'
    });
    console.log('Enhanced quote response:', enhancedQuoteResponse);
    
    // Test recommendations
    const recommendationsResponse = await vscAPI.getRecommendations({
      make: 'BMW',
      year: 2018,
      mileage: 85000
    });
    console.log('Recommendations response:', recommendationsResponse);
    
    return { 
      success: true, 
      message: 'Enhanced VSC quoting is working correctly',
      results: {
        vinQuote: vinQuoteResponse,
        enhancedQuote: enhancedQuoteResponse,
        recommendations: recommendationsResponse
      }
    };
  } catch (error) {
    console.error('Enhanced VSC quoting test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testCORS = async () => {
  try {
    console.log('Testing CORS with preflight request...');
    
    const getResponse = await api.get('/health');
    console.log('GET request successful:', getResponse);
    
    const postResponse = await heroAPI.generateQuote({
      product_type: 'home_protection',
      term_years: 1,
      coverage_limit: 500,
      customer_type: 'retail'
    });
    console.log('POST request successful:', postResponse);
    
    return { success: true, message: 'CORS is working correctly' };
  } catch (error) {
    console.error('CORS test failed:', error);
    return { success: false, error: error.message };
  }
};

// VIN-specific helper functions for the frontend
export const vinHelpers = {
  /**
   * Debounced VIN decode function for real-time input
   */
  createDebouncedVINDecode(callback, delay = CONFIG.VIN_CONFIG.debounceDelay) {
    let timeoutId;
    return (vin, mileage = 0) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (vin && vin.length === 17) {
          try {
            const result = await vinAPI.decodeVINEnhanced(vin, mileage);
            callback(result);
          } catch (error) {
            callback({ success: false, error: error.message });
          }
        }
      }, delay);
    };
  },

  /**
   * Format VIN for display (adds dashes for readability)
   */
  formatVINForDisplay(vin) {
    if (!vin || vin.length !== 17) return vin;
    return `${vin.slice(0, 3)}-${vin.slice(3, 9)}-${vin.slice(9)}`;
  },

  /**
   * Get VIN decode status icon
   */
  getVINStatusIcon(vinInfo, vinError) {
    if (vinError) return 'error';
    if (vinInfo) return 'success';
    return 'pending';
  },

  /**
   * Generate VIN input help text
   */
  getVINHelpText() {
    return {
      title: 'Where to find your VIN:',
      locations: [
        'Dashboard (driver\'s side, visible through windshield)',
        'Driver\'s side door jamb sticker',
        'Vehicle registration or title',
        'Insurance documents',
        'Engine block (stamped)'
      ],
      note: 'The VIN automatically fills vehicle details and checks eligibility for our service contracts.'
    };
  }
};

// Enhanced quote utilities with VIN support
export const quoteUtils = {
  /**
   * Generate quote reference number
   */
  generateQuoteRef(type = 'VSC') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${type}-${timestamp}-${random}`;
  },

  /**
   * Calculate quote expiry (30 days from now)
   */
  calculateQuoteExpiry() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry.toISOString();
  },

  /**
   * Check if quote is still valid
   */
  isQuoteValid(expiryDate) {
    if (!expiryDate) return true;
    return new Date(expiryDate) > new Date();
  },

  /**
   * Format quote data for display
   */
  formatQuoteForDisplay(quote) {
    return {
      ...quote,
      formattedTotal: formatCurrency(quote.total_price || quote.pricing?.total_price),
      formattedMonthly: formatCurrency(quote.monthly_payment || quote.pricing?.monthly_payment),
      formattedExpiry: formatDate(quote.valid_until),
      isValid: this.isQuoteValid(quote.valid_until),
      hasVINInfo: !!(quote.vin_info?.vin),
      isAutoPopulated: !!(quote.vin_info?.auto_populated)
    };
  },

  /**
   * Extract vehicle summary from quote
   */
  getVehicleSummary(quote) {
    const vinInfo = quote.vin_info;
    const vehicleInfo = quote.vehicle_info || vinInfo?.vehicle_info;
    
    if (!vehicleInfo) return 'Vehicle information not available';
    
    const year = vehicleInfo.year || '';
    const make = vehicleInfo.make || '';
    const model = vehicleInfo.model || '';
    
    return `${year} ${make} ${model}`.trim() || 'Unknown Vehicle';
  },

  /**
   * Get eligibility status summary
   */
  getEligibilityStatus(quote) {
    const eligibility = quote.eligibility_details || quote.eligibility;
    
    if (!eligibility) {
      return { status: 'unknown', message: 'Eligibility not checked' };
    }
    
    if (eligibility.eligible) {
      return { 
        status: 'eligible', 
        message: 'Vehicle is eligible for coverage',
        warnings: eligibility.warnings || []
      };
    } else {
      return { 
        status: 'not_eligible', 
        message: 'Vehicle is not eligible for coverage',
        restrictions: eligibility.restrictions || []
      };
    }
  }
};

// Local storage utilities for VIN history
export const vinHistory = {
  /**
   * Save VIN to search history
   */
  saveVIN(vin, vehicleInfo = null) {
    try {
      const history = this.getVINHistory();
      const entry = {
        vin,
        vehicleInfo,
        searchedAt: new Date().toISOString(),
        id: `VIN-${Date.now()}`
      };
      
      // Remove existing entry for same VIN
      const filteredHistory = history.filter(item => item.vin !== vin);
      filteredHistory.unshift(entry);
      
      // Keep only last 20 VINs
      const limitedHistory = filteredHistory.slice(0, 20);
      
      localStorage.setItem('connectedautocare_vin_history', JSON.stringify(limitedHistory));
      return entry;
    } catch (error) {
      console.error('Error saving VIN history:', error);
      return null;
    }
  },

  /**
   * Get VIN search history
   */
  getVINHistory() {
    try {
      const history = localStorage.getItem('connectedautocare_vin_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading VIN history:', error);
      return [];
    }
  },

  /**
   * Clear VIN history
   */
  clearVINHistory() {
    try {
      localStorage.removeItem('connectedautocare_vin_history');
      return true;
    } catch (error) {
      console.error('Error clearing VIN history:', error);
      return false;
    }
  },

  /**
   * Get recent VINs (last 5)
   */
  getRecentVINs() {
    return this.getVINHistory().slice(0, 5);
  }
};

// Comprehensive test suite
export const runAllTests = async () => {
  console.log('🧪 Running comprehensive API test suite...');
  
  const tests = [
    { name: 'Connection Test', fn: testConnection },
    { name: 'CORS Test', fn: testCORS },
    { name: 'Database Pricing Test', fn: testDatabasePricing },
    { name: 'VIN Services Test', fn: testVINServices },
    { name: 'Enhanced VSC Quoting Test', fn: testEnhancedVSCQuoting }
  ];

  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔍 Running ${test.name}...`);
    try {
      const result = await test.fn();
      results.push({ test: test.name, ...result });
      console.log(result.success ? '✅ Passed' : '❌ Failed', result.message);
    } catch (error) {
      results.push({ test: test.name, success: false, error: error.message });
      console.log('❌ Failed', error.message);
    }
  }

  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  return {
    summary: { passed, total, success: passed === total },
    results
  };
};

// Export everything
export default api;

// Additional exports for backward compatibility
export { 
  api, 
  CONFIG
};