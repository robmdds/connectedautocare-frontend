// API Configuration and Utilities for ConnectedAutoCare.com

// API Base URL - Update this for production deployment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.connectedautocare.com'
  : 'http://localhost:5000'

// API Client class for making requests
class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    // Default configuration with improved CORS handling
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      mode: 'cors',  // Explicitly set CORS mode
      credentials: 'omit',  // Don't send credentials
      ...options,
    }

    try {
      const response = await fetch(url, config)      
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await response.text()
        console.error('Server returned HTML instead of JSON:', htmlText.substring(0, 500))
        throw new Error('Server returned HTML instead of JSON. This might be a CORS issue or server configuration problem.')
      }
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        const responseText = await response.text()
        console.error('Raw response:', responseText.substring(0, 500))
        throw new Error('Invalid JSON response from server')
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      
      // Enhanced error handling for common issues
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. This could be a CORS issue or the backend might be down.')
      }
      
      if (error.message.includes('CORS')) {
        throw new Error('CORS error: The backend is not properly configured to accept requests from this domain.')
      }
      
      throw error
    }
  }

  // GET request
  async get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers })
  }

  // POST request
  async post(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers })
  }
}

// Test connection function with detailed debugging
export const testConnection = async () => {
  const api = new APIClient()
  try {
    console.log('Testing connection to:', API_BASE_URL)
    const response = await api.get('/health')
    console.log('Backend connection successful:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Backend connection failed:', error)
    return { success: false, error: error.message }
  }
}

// Test CORS specifically
export const testCORS = async () => {
  const api = new APIClient()
  try {
    console.log('Testing CORS with preflight request...')
    
    // First test a simple GET request
    const getResponse = await api.get('/health')
    console.log('GET request successful:', getResponse)
    
    // Then test a POST request which triggers preflight
    const postResponse = await api.post('/api/hero/quote', {
      product_type: 'home_protection',
      term_years: 1,
      coverage_limit: 500,
      customer_type: 'retail'
    })
    console.log('POST request successful:', postResponse)
    
    return { success: true, message: 'CORS is working correctly' }
  } catch (error) {
    console.error('CORS test failed:', error)
    return { success: false, error: error.message }
  }
}

const api = new APIClient()

// Health Check APIs
export const healthAPI = {
  checkHealth: () => api.get('/health'),
  checkAPIHealth: () => api.get('/api/health'),
}

// Hero Products APIs
export const heroAPI = {
  checkHealth: () => api.get('/api/hero/health'),
  getAllProducts: () => api.get('/api/hero/products'),
  getProductsByCategory: (category) => api.get(`/api/hero/products/${category}`),
  generateQuote: async (quoteData) => {
    try {
      const response = await api.post('/api/hero/quote', quoteData)
      return response
    } catch (error) {
      console.error('HeroAPI.generateQuote error:', error)
      throw error
    }
  },
}

// VSC APIs
export const vscAPI = {
  checkHealth: () => api.get('/api/vsc/health'),
  getCoverageOptions: () => api.get('/api/vsc/coverage-options'),
  generateQuote: async (quoteData) => {
    try {
      const response = await api.post('/api/vsc/quote', quoteData)
      return response
    } catch (error) {
      console.error('VSCAPI.generateQuote error:', error)
      throw error
    }
  },
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

// Enhanced error handling utility
export const handleAPIError = (error) => {
  console.error('API Error:', error)
  
  if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
    return 'Unable to connect to server. Please check your internet connection and try again.'
  }
  
  if (error.message.includes('HTML instead of JSON')) {
    return 'Server configuration error. Please contact support.'
  }
  
  if (error.message.includes('CORS')) {
    return 'Server CORS configuration issue. Please contact support.'
  }
  
  if (error.message.includes('404')) {
    return 'Service not found. Please try again later.'
  }
  
  if (error.message.includes('401')) {
    return 'Authentication required. Please check server configuration.'
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}

// Utility functions
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

// Validation function
export const validateQuoteData = (data, type) => {
  const errors = []

  if (type === 'hero') {
    if (!data.product_type) errors.push('Product type is required')
    if (!data.term_years) errors.push('Term is required')
    if (!data.coverage_limit) errors.push('Coverage limit is required')
    
    // Validate term_years range
    const termYears = parseInt(data.term_years)
    if (termYears && (termYears < 1 || termYears > 5)) {
      errors.push('Term must be between 1 and 5 years')
    }
    
    // Validate coverage_limit
    const coverageLimit = parseInt(data.coverage_limit)
    if (data.coverage_limit !== 'unlimited' && coverageLimit && coverageLimit < 100) {
      errors.push('Coverage limit must be at least $100')
    }
  }

  if (type === 'vsc') {
    if (!data.make) errors.push('Vehicle make is required')
    if (!data.year) errors.push('Vehicle year is required')
    if (!data.mileage) errors.push('Vehicle mileage is required')
    if (!data.coverage_level) errors.push('Coverage level is required')
    if (!data.term_months) errors.push('Term is required')
    
    const year = parseInt(data.year)
    const mileage = parseInt(data.mileage)
    
    if (year && (year < 1990 || year > new Date().getFullYear() + 1)) {
      errors.push('Invalid vehicle year')
    }
    if (mileage && (mileage < 0 || mileage > 500000)) {
      errors.push('Invalid mileage')
    }
  }

  return errors
}

export default api