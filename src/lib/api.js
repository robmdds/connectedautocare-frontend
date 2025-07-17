// Enhanced API Configuration and Utilities for ConnectedAutoCare.com

// API Base URL with fallback logic
const getAPIBaseURL = () => {
  // Your actual production API URL
  const productionURL = 'https://connectedautocare-backend-robs-projects-ec1694cd.vercel.app'
  
  // Check if we're in development
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'
  
  // Use environment variable if available, otherwise use production URL
  const apiURL = import.meta.env.VITE_API_URL || productionURL
  
  console.log('Environment:', isDevelopment ? 'development' : 'production')
  console.log('API_BASE_URL:', apiURL)
  
  return apiURL
}

const API_BASE_URL = getAPIBaseURL()

// Enhanced API Client class with better error handling and CORS support
class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    // Enhanced request configuration
    const config = {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Important for CORS with credentials
      mode: 'cors', // Explicitly set CORS mode
      ...options,
    }

    try {
      console.log(`Making ${config.method} request to: ${url}`)
      
      const response = await fetch(url, config)
      
      // Log response status for debugging
      console.log(`Response status: ${response.status}`)
      
      // Check if response is ok
      if (!response.ok) {
        // Try to parse error from response
        let errorMessage = `HTTP error! status: ${response.status}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If parsing fails, use generic message
          errorMessage = `Request failed with status ${response.status}`
        }
        
        throw new Error(errorMessage)
      }

      // Parse JSON response
      const data = await response.json()
      console.log('Response data:', data)
      
      return data
    } catch (error) {
      console.error('API request failed:', error)
      
      // Enhanced error handling
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.')
      }
      
      if (error.message.includes('CORS')) {
        throw new Error('CORS error: Cross-origin request blocked. Please contact support.')
      }
      
      throw error
    }
  }

  // GET request
  async get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers })
  }

  // POST request with enhanced options
  async post(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
      },
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        ...headers,
      },
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers })
  }

  // Options request for CORS preflight testing
  async options(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'OPTIONS', headers })
  }
}

// Create API client instance
const api = new APIClient()

// Health Check APIs
export const healthAPI = {
  checkHealth: () => api.get('/health'),
  checkAPIHealth: () => api.get('/api/health'),
  testCORS: () => api.options('/api/health'), // Test CORS preflight
  debugCORS: () => api.get('/api/debug/cors'), // Debug CORS configuration
}

// Hero Products APIs
export const heroAPI = {
  checkHealth: () => api.get('/api/hero/health'),
  getAllProducts: () => api.get('/api/hero/products'),
  getProductsByCategory: (category) => api.get(`/api/hero/products/${category}`),
  generateQuote: (quoteData) => api.post('/api/hero/quote', quoteData),
}

// VSC APIs
export const vscAPI = {
  checkHealth: () => api.get('/api/vsc/health'),
  getCoverageOptions: () => api.get('/api/vsc/coverage-options'),
  generateQuote: (quoteData) => api.post('/api/vsc/quote', quoteData),
}

// VIN Decoder APIs
export const vinAPI = {
  checkHealth: () => api.get('/api/vin/health'),
  validateVIN: (vin) => api.post('/api/vin/validate', { vin }),
  decodeVIN: (vin) => api.post('/api/vin/decode', { vin }),
}

// Payment APIs
export const paymentAPI = {
  getPaymentMethods: () => api.get('/api/payments/methods'),
}

// Contract APIs
export const contractAPI = {
  generateContract: (contractData) => api.post('/api/contracts/generate', contractData),
}

// Connection test utility
export const testConnection = async () => {
  try {
    console.log('Testing connection to backend...')
    const response = await healthAPI.checkHealth()
    console.log('Connection successful:', response)
    return { success: true, data: response }
  } catch (error) {
    console.error('Connection failed:', error)
    return { success: false, error: error.message }
  }
}

// CORS test utility
export const testCORS = async () => {
  try {
    console.log('Testing CORS configuration...')
    await healthAPI.testCORS()
    console.log('CORS test successful')
    return { success: true }
  } catch (error) {
    console.error('CORS test failed:', error)
    return { success: false, error: error.message }
  }
}

// Utility functions for data formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

// Enhanced quote data validation
export const validateQuoteData = (data, type) => {
  const errors = []

  if (type === 'hero') {
    if (!data.product_type) errors.push('Product type is required')
    if (!data.term_years) errors.push('Term is required')
    if (data.term_years && (data.term_years < 1 || data.term_years > 5)) {
      errors.push('Term must be between 1 and 5 years')
    }
  }

  if (type === 'vsc') {
    if (!data.make) errors.push('Vehicle make is required')
    if (!data.year) errors.push('Vehicle year is required')
    if (!data.mileage) errors.push('Vehicle mileage is required')
    if (data.year && (data.year < 1990 || data.year > new Date().getFullYear() + 1)) {
      errors.push('Invalid vehicle year')
    }
    if (data.mileage && (data.mileage < 0 || data.mileage > 500000)) {
      errors.push('Invalid mileage')
    }
  }

  return errors
}

// Enhanced error handling utility
export const handleAPIError = (error) => {
  console.error('API Error:', error)
  
  // Network errors
  if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
    return 'Unable to connect to server. Please check your internet connection and try again.'
  }
  
  // CORS errors
  if (error.message.includes('CORS')) {
    return 'Cross-origin request blocked. Please contact support if this issue persists.'
  }
  
  // HTTP status errors
  if (error.message.includes('404')) {
    return 'Service not found. Please try again later.'
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  if (error.message.includes('503')) {
    return 'Service temporarily unavailable. Please try again in a few moments.'
  }
  
  // Validation errors
  if (error.message.includes('validation')) {
    return `Validation error: ${error.message}`
  }
  
  // Default error message
  return error.message || 'An unexpected error occurred. Please try again.'
}

// Debug information
export const getDebugInfo = () => {
  return {
    apiBaseURL: API_BASE_URL,
    environment: import.meta.env.DEV ? 'development' : 'production',
    currentOrigin: window.location.origin,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }
}

// Default export
export default api