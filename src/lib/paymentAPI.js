// lib/paymentAPI.js - Payment processing utilities

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Process payment for a quote
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Validate credit card information
 * @param {Object} cardInfo - Credit card details
 * @returns {Promise<Object>} Validation result
 */
export const validateCreditCard = async (cardInfo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/validate-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardInfo)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Card validation failed');
    }

    return result;
  } catch (error) {
    console.error('Card validation error:', error);
    throw error;
  }
};

/**
 * Get payment status by transaction ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Payment status
 */
export const getPaymentStatus = async (transactionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get payment status');
    }

    return result;
  } catch (error) {
    console.error('Payment status error:', error);
    throw error;
  }
};

/**
 * Get payment history for authenticated user
 * @param {Object} options - Query options (page, per_page, status)
 * @returns {Promise<Object>} Payment history
 */
export const getPaymentHistory = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams(options).toString();
    const response = await fetch(`${API_BASE_URL}/api/payments/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get payment history');
    }

    return result;
  } catch (error) {
    console.error('Payment history error:', error);
    throw error;
  }
};

/**
 * Get available payment methods
 * @returns {Promise<Object>} Available payment methods
 */
export const getPaymentMethods = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get payment methods');
    }

    return result;
  } catch (error) {
    console.error('Payment methods error:', error);
    throw error;
  }
};

// Utility Functions

/**
 * Get authentication token from storage
 * @returns {string|null} Auth token
 */
const getAuthToken = () => {
  // Implement based on your auth system
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Format credit card number with spaces
 * @param {string} cardNumber - Raw card number
 * @returns {string} Formatted card number
 */
export const formatCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = cleaned.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];
  
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  
  if (parts.length) {
    return parts.join(' ');
  } else {
    return cleaned;
  }
};

/**
 * Determine credit card type from number
 * @param {string} cardNumber - Credit card number
 * @returns {string} Card type
 */
export const getCardType = (cardNumber) => {
  const number = cardNumber.replace(/\s+/g, '');
  
  if (number.startsWith('4')) return 'Visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'MasterCard';
  if (number.startsWith('34') || number.startsWith('37')) return 'American Express';
  if (number.startsWith('6011') || number.startsWith('65')) return 'Discover';
  return 'Unknown';
};

/**
 * Validate credit card number using Luhn algorithm
 * @param {string} cardNumber - Credit card number
 * @returns {boolean} Is valid
 */
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate expiry date
 * @param {string} month - Expiry month (MM)
 * @param {string} year - Expiry year (YYYY)
 * @returns {boolean} Is valid
 */
export const validateExpiryDate = (month, year) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear();
  
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);
  
  if (expMonth < 1 || expMonth > 12) {
    return false;
  }
  
  if (expYear < currentYear) {
    return false;
  }
  
  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }
  
  return true;
};

/**
 * Validate CVV
 * @param {string} cvv - CVV code
 * @param {string} cardType - Card type
 * @returns {boolean} Is valid
 */
export const validateCVV = (cvv, cardType) => {
  if (!cvv || !/^\d+$/.test(cvv)) {
    return false;
  }
  
  // American Express has 4-digit CVV, others have 3-digit
  if (cardType === 'American Express') {
    return cvv.length === 4;
  } else {
    return cvv.length === 3;
  }
};

/**
 * Calculate monthly payment for financing
 * @param {number} totalAmount - Total amount to finance
 * @param {number} termMonths - Term in months
 * @param {number} apr - Annual percentage rate (default 0 for 0% APR)
 * @returns {number} Monthly payment
 */
export const calculateMonthlyPayment = (totalAmount, termMonths, apr = 0) => {
  if (apr === 0) {
    return totalAmount / termMonths;
  }
  
  const monthlyRate = apr / 12 / 100;
  const payment = totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment * 100) / 100;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default USD)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Generate quote ID
 * @param {string} productType - Type of product (hero, vsc)
 * @returns {string} Quote ID
 */
export const generateQuoteId = (productType = 'quote') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${productType.toUpperCase()}-${timestamp}-${random}`;
};

/**
 * Validate required payment fields
 * @param {Object} paymentData - Payment data to validate
 * @param {string} paymentMethod - Payment method (credit_card, financing)
 * @returns {Array} Array of validation errors
 */
export const validatePaymentData = (paymentData, paymentMethod) => {
  const errors = [];
  
  // Customer info validation
  if (!paymentData.customer_info?.first_name) {
    errors.push('First name is required');
  }
  if (!paymentData.customer_info?.last_name) {
    errors.push('Last name is required');
  }
  if (!paymentData.customer_info?.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.customer_info.email)) {
    errors.push('Valid email is required');
  }
  
  // Payment method specific validation
  if (paymentMethod === 'credit_card') {
    if (!paymentData.card_info?.card_number) {
      errors.push('Credit card number is required');
    } else if (!validateCardNumber(paymentData.card_info.card_number)) {
      errors.push('Valid credit card number is required');
    }
    
    if (!paymentData.card_info?.expiry_month || !paymentData.card_info?.expiry_year) {
      errors.push('Expiry date is required');
    } else if (!validateExpiryDate(paymentData.card_info.expiry_month, paymentData.card_info.expiry_year)) {
      errors.push('Valid expiry date is required');
    }
    
    if (!paymentData.card_info?.cvv) {
      errors.push('CVV is required');
    } else if (!validateCVV(paymentData.card_info.cvv, getCardType(paymentData.card_info.card_number))) {
      errors.push('Valid CVV is required');
    }
    
    if (!paymentData.card_info?.cardholder_name) {
      errors.push('Cardholder name is required');
    }
    
    // Billing address validation
    if (!paymentData.billing_info?.address) {
      errors.push('Billing address is required');
    }
    if (!paymentData.billing_info?.city) {
      errors.push('Billing city is required');
    }
    if (!paymentData.billing_info?.state) {
      errors.push('Billing state is required');
    }
    if (!paymentData.billing_info?.zip_code) {
      errors.push('Billing ZIP code is required');
    }
  }
  
  if (paymentMethod === 'financing') {
    if (!paymentData.financing_terms) {
      errors.push('Financing terms are required');
    }
    
    // Additional customer info for financing
    if (!paymentData.customer_info?.phone) {
      errors.push('Phone number is required for financing');
    }
  }
  
  return errors;
};

// Error handling utilities
export const handlePaymentError = (error) => {
  console.error('Payment error:', error);
  
  // Common error messages mapping
  const errorMessages = {
    'card_declined': 'Your card was declined. Please try a different card or contact your bank.',
    'insufficient_funds': 'Insufficient funds. Please try a different card or contact your bank.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'invalid_cvv': 'Invalid CVV code. Please check and try again.',
    'processing_error': 'Payment processing error. Please try again.',
    'network_error': 'Network error. Please check your connection and try again.',
    'timeout': 'Request timeout. Please try again.'
  };
  
  // Return user-friendly error message
  if (error.message && errorMessages[error.message.toLowerCase()]) {
    return errorMessages[error.message.toLowerCase()];
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
};

export default {
  processPayment,
  validateCreditCard,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentMethods,
  formatCardNumber,
  getCardType,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  calculateMonthlyPayment,
  formatCurrency,
  generateQuoteId,
  validatePaymentData,
  handlePaymentError
};