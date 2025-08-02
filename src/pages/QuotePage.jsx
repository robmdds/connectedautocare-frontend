import React, { useState, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calculator, Car, Home, Shield, DollarSign, CheckCircle, AlertCircle, Loader, Search, CreditCard, FileText, Lock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { heroAPI, vscAPI, formatCurrency, validateQuoteData, handleAPIError } from '../lib/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// HelcimJS Configuration
const HELCIM_CONFIG = {
  token: import.meta.env.VITE_HELCIM_TOKEN,
  secretKey: import.meta.env.VITE_HELCIM_SECRET_KEY
};

const QuotePage = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('hero')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')
  const [vinDecoding, setVinDecoding] = useState(false)
  const [vinError, setVinError] = useState('')
  const [vinInfo, setVinInfo] = useState(null)
  const [eligibilityCheck, setEligibilityCheck] = useState(null)

  // Payment states
  const [showPayment, setShowPayment] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [paymentResult, setPaymentResult] = useState(null)
  const [customerInfo, setCustomerInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })
  
  // Billing info states
  const [billingInfo, setBillingInfo] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US'
  })

  // Financing states
  const [financingTerms, setFinancingTerms] = useState('12')

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

  // Handle URL parameters on component mount
  useEffect(() => {
    const coverage = searchParams.get('coverage')
    const tab = searchParams.get('tab')
    
    if (coverage || tab === 'vsc') {
      setActiveTab('vsc')
      
      if (coverage) {
        const coverageMap = {
          'silver_coverage': 'silver',
          'gold_coverage': 'gold', 
          'platinum_coverage': 'platinum'
        }
        const mappedCoverage = coverageMap[coverage] || coverage
        setVscForm(prev => ({
          ...prev,
          coverage_level: mappedCoverage
        }))
      }
    }
  }, [searchParams])

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

  // VSC Eligibility Check
  const checkVehicleEligibilityUpdated = (vehicleInfo, currentMileage) => {
    if (!vehicleInfo || !vehicleInfo.year) {
      return {
        eligible: false,
        warnings: [],
        restrictions: ['Vehicle year information required for eligibility check'],
        vehicleAge: null,
        assessmentDate: new Date().toISOString()
      }
    }

    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - vehicleInfo.year
    const mileage = parseInt(currentMileage) || 0

    let eligible = true
    let warnings = []
    let restrictions = []

    if (vehicleAge > 20) {
      eligible = false
      restrictions.push(`Vehicle is ${vehicleAge} years old (must be 20 model years or newer)`)
    } else if (vehicleAge > 15) {
      warnings.push(`Vehicle is ${vehicleAge} years old - limited coverage options may apply`)
    }

    if (mileage >= 200000) {
      eligible = false
      restrictions.push(`Vehicle has ${mileage.toLocaleString()} miles (must be less than 200,000 miles)`)
    } else if (mileage > 150000) {
      warnings.push(`High mileage vehicle (${mileage.toLocaleString()} miles) - premium rates may apply`)
    }

    const luxuryBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti']
    if (luxuryBrands.some(brand => vehicleInfo.make?.toUpperCase().includes(brand.toUpperCase()))) {
      warnings.push('Luxury vehicle - specialized coverage options available')
    }

    return {
      eligible,
      warnings,
      restrictions,
      vehicleAge,
      assessmentDate: new Date().toISOString()
    }
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
      const response = await fetch(`${API_BASE_URL}/api/vin/decode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          vin: vin.toUpperCase(),
          mileage: parseInt(vscForm.mileage) || null
        })
      })

      const rawResult = await response.json()
      const result = Array.isArray(rawResult) ? rawResult[0] : rawResult

      if (result.success && result.data) {
        const vehicleInfo = result.data.vehicle_info || result.data
        setVinInfo(vehicleInfo)

        const decodedMake = (vehicleInfo.make || '').toLowerCase()
        const matchedMake = vehicleMakes.find(make => make.toLowerCase() === decodedMake) || vehicleInfo.make || ''

        const updatedForm = {
          ...vscForm,
          make: matchedMake,
          model: vehicleInfo.model || vscForm.model,
          year: vehicleInfo.year ? vehicleInfo.year.toString() : '',
          auto_populated: true
        }

        setVscForm(updatedForm)
        setVinError('')
      } else {
        setVinError(result.error || 'Failed to decode VIN')
        setVscForm(prev => ({
          ...prev,
          make: '',
          model: '',
          year: '',
          auto_populated: false
        }))
      }
    } catch (err) {
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

  // Handle VIN input with debounced decoding
  useEffect(() => {
    if (vscForm.vin && vscForm.vin.length === 17) {
      const timer = setTimeout(() => {
        decodeVIN(vscForm.vin)
      }, 500)

      return () => clearTimeout(timer)
    } else if (vscForm.vin.length < 17 && vscForm.auto_populated) {
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

  // Check eligibility when both VIN info and mileage are available
  useEffect(() => {
    if (vinInfo && vscForm.mileage && parseInt(vscForm.mileage) > 0) {
      const eligibilityResult = checkVehicleEligibilityUpdated(vinInfo, vscForm.mileage)
      setEligibilityCheck(eligibilityResult)
    } else if (vinInfo && !vscForm.mileage) {
      setEligibilityCheck(null)
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
        setShowPayment(false)
        setPaymentResult(null)
      } else {
        setError(responseData.error || 'Quote generation failed')
      }
    } catch (err) {
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
        vin: vscForm.vin,
        vin_decoded: vinInfo,
        auto_populated: vscForm.auto_populated
      }

      const response = await vscAPI.generateQuote(quoteData)
      const responseData = Array.isArray(response) ? response[0] : response

      if (responseData.success && responseData.data) {
        setQuote(responseData.data)
        setShowPayment(false)
        setPaymentResult(null)
      } else {
        setError(responseData.error || 'Quote generation failed')
      }
    } catch (err) {
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  // Main Payment Processing Function
  const processPayment = async () => {
    setPaymentLoading(true);
    setError('');

    try {
      // Validate required customer information
      if (!customerInfo.first_name || !customerInfo.last_name || !customerInfo.email) {
        setError('Please fill in all customer information fields');
        return;
      }

      const totalAmount = quote.pricing_breakdown?.total_price || quote.pricing?.total_price || 0;

      if (paymentMethod === 'credit_card') {
        // Validate billing information for credit card payments
        if (!billingInfo.address || !billingInfo.city || !billingInfo.state || !billingInfo.zip_code || !billingInfo.country) {
          setError('Please fill in all billing address fields');
          return;
        }
        await processHelcimPayment(totalAmount);
      } else if (paymentMethod === 'financing') {
        await processFinancingPayment(totalAmount);
      }

    } catch (err) {
      console.error('💥 Payment error:', err);
      setError(`Payment failed: ${err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  }

  // HelcimJS Payment Processing (Form-based API)
  const processHelcimPayment = async (amount) => {
    return new Promise((resolve, reject) => {
      try {

        if (typeof window.helcimProcess !== 'function') {
          throw new Error('HelcimJS not loaded. Please refresh the page and try again.');
        }

        const formId = 'helcimPaymentForm';
        const existingForm = document.getElementById(formId);
        if (existingForm) {
          existingForm.remove();
        }

        const form = document.createElement('form');
        form.id = formId;
        form.name = 'helcimForm';
        form.style.display = 'none';
        form.method = 'POST';
        form.action = 'javascript:void(0);'; // Prevent submission to any URL

        // Prevent form submission
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          e.stopPropagation(); // Stop event bubbling
          return false;
        });

        let resultsDiv = document.getElementById('helcimResults');
        if (!resultsDiv) {
          resultsDiv = document.createElement('div');
          resultsDiv.id = 'helcimResults';
          resultsDiv.style.display = 'none';
          document.body.appendChild(resultsDiv);
        }

        const createHiddenInput = (name, value) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.id = name;
          input.name = name;
          input.value = value || '';
          return input;
        };

        // Form fields (unchanged)
        form.appendChild(createHiddenInput('token', import.meta.env.VITE_HELCIM_TOKEN || 'de2a5120a337b055a082b5'));
        form.appendChild(createHiddenInput('amount', amount.toFixed(2)));
        form.appendChild(createHiddenInput('currency', 'USD'));
        form.appendChild(createHiddenInput('test', import.meta.env.VITE_HELCIM_TEST_MODE || '1'));
        form.appendChild(createHiddenInput('dontSubmit', '1')); // Signal HelcimJS to avoid submission
        form.appendChild(createHiddenInput('orderNumber', `INV-${quote.quote_id || Date.now()}`));
        form.appendChild(createHiddenInput('customerCode', `CUST-${Date.now()}`));
        form.appendChild(createHiddenInput('comments', `${activeTab === 'vsc' ? 'Vehicle Service Contract' : 'Hero Product'} - ConnectedAutoCare`));
        form.appendChild(createHiddenInput('billing_contactName', `${customerInfo.first_name} ${customerInfo.last_name}`));
        form.appendChild(createHiddenInput('billing_street1', billingInfo.address));
        form.appendChild(createHiddenInput('billing_city', billingInfo.city));
        form.appendChild(createHiddenInput('billing_province', billingInfo.state));
        form.appendChild(createHiddenInput('billing_postalCode', billingInfo.zip_code));
        form.appendChild(createHiddenInput('billing_country', billingInfo.country));
        form.appendChild(createHiddenInput('billing_email', customerInfo.email));
        form.appendChild(createHiddenInput('billing_phone', customerInfo.phone || ''));
        form.appendChild(createHiddenInput('cardNumber', ''));
        form.appendChild(createHiddenInput('cardExpiry', ''));
        form.appendChild(createHiddenInput('cardCVV', ''));
        form.appendChild(createHiddenInput('cardHolderName', `${customerInfo.first_name} ${customerInfo.last_name}`));
        form.appendChild(createHiddenInput('cardHolderAddress', billingInfo.address)); // Map to AVS field
        form.appendChild(createHiddenInput('cardHolderPostalCode', billingInfo.zip_code)); // Map to AVS field

        document.body.appendChild(form);
        // Create a payment collection form/modal for card details
        const createPaymentModal = () => {
          const modal = document.createElement('div');
          modal.id = 'helcimPaymentModal';
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
          `;

          const modalContent = document.createElement('div');
          modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          `;

          modalContent.innerHTML = `
            <h3 style="margin-bottom: 20px; text-align: center; color: #333;">Secure Payment</h3>
            <p style="margin-bottom: 20px; color: #666; text-align: center;">
              Amount: <strong>${amount.toFixed(2)}</strong>
            </p>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Card Number *</label>
              <input type="text" id="modalCardNumber" placeholder="1234 5678 9012 3456" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;" 
                     maxlength="19">
            </div>
            
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Expiry Month *</label>
                <select id="modalCardExpiryMonth" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">MM</option>
                  ${Array.from({length: 12}, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${String(i + 1).padStart(2, '0')}</option>`).join('')}
                </select>
              </div>
              <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Expiry Year *</label>
                <select id="modalCardExpiryYear" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">YYYY</option>
                  ${Array.from({length: 10}, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return `<option value="${year}">${year}</option>`;
                  }).join('')}
                </select>
              </div>
              <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">CVV *</label>
                <input type="text" id="modalCardCVV" placeholder="123" 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" 
                       maxlength="4">
              </div>
            </div>
            
            <div id="modalError" style="color: red; margin-bottom: 15px; display: none;"></div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button type="button" id="modalProcessBtn" 
                      style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">
                Process Payment
              </button>
              <button type="button" id="modalCancelBtn" 
                      style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">
                Cancel
              </button>
            </div>
            
            <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18,8A6,6 0 0,0 12,2A6,6 0 0,0 6,8H4V20H20V8H18M12,4A4,4 0 0,1 16,8H8A4,4 0 0,1 12,4M12,17A2,2 0 0,1 10,15A2,2 0 0,1 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17Z" />
                </svg>
                Your payment is secure and encrypted
              </div>
            </div>
          `;

          modal.appendChild(modalContent);
          document.body.appendChild(modal);

          // Format card number input
          document.getElementById('modalCardNumber').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
          });

          // Process payment button
          document.getElementById('modalProcessBtn').addEventListener('click', async () => {
            const cardNumber = document.getElementById('modalCardNumber').value.replace(/\s+/g, '');
            const expiryMonth = document.getElementById('modalCardExpiryMonth').value;
            const expiryYear = document.getElementById('modalCardExpiryYear').value;
            const cvv = document.getElementById('modalCardCVV').value;

            // Validate fields
            if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
              document.getElementById('modalError').textContent = 'Please fill in all card details';
              document.getElementById('modalError').style.display = 'block';
              return;
            }

            if (cardNumber.length < 13 || cardNumber.length > 19) {
              document.getElementById('modalError').textContent = 'Please enter a valid card number';
              document.getElementById('modalError').style.display = 'block';
              return;
            }

            if (cvv.length < 3 || cvv.length > 4) {
              document.getElementById('modalError').textContent = 'Please enter a valid CVV';
              document.getElementById('modalError').style.display = 'block';
              return;
            }

            // Update form with card details
            document.getElementById('cardNumber').value = cardNumber;
            document.getElementById('cardExpiry').value = expiryMonth + expiryYear.slice(-2);
            document.getElementById('cardCVV').value = cvv;

            // Disable button and show processing
            const processBtn = document.getElementById('modalProcessBtn');
            processBtn.textContent = 'Processing...';
            processBtn.disabled = true;

            try {              
              // Show processing message
              document.getElementById('modalError').innerHTML = `
                <div style="color: #007bff; display: flex; align-items: center; gap: 8px;">
                  <div style="width: 16px; height: 16px; border: 2px solid #007bff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                  Processing payment securely...
                </div>
                <style>
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                </style>
              `;
              document.getElementById('modalError').style.display = 'block';
              
              const result = await window.helcimProcess();

              // Parse the result (it's HTML with hidden fields)
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = result;
              
              // Extract response data
              const response = tempDiv.querySelector('#response')?.value;
              const responseMessage = tempDiv.querySelector('#responseMessage')?.value;
              const transactionId = tempDiv.querySelector('#transactionId')?.value;
              const cardToken = tempDiv.querySelector('#cardToken')?.value;
              const approvalCode = tempDiv.querySelector('#approvalCode')?.value;
              if (response === '1') {
                // Success
                document.getElementById('modalError').innerHTML = `
                  <div style="color: #28a745; display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                    </svg>
                    Payment successful! Saving transaction...
                  </div>
                `;

                // Save transaction data to backend
                await saveTransactionToDatabase({
                  helcim_response: {
                    response,
                    responseMessage,
                    transactionId,
                    cardToken,
                    approvalCode,
                    amount: amount.toFixed(2),
                    currency: 'USD'
                  },
                  quote_data: quote,
                  customer_info: customerInfo,
                  billing_info: billingInfo,
                  payment_method: 'credit_card',
                  amount: amount,
                  product_type: activeTab,
                  vehicle_info: activeTab === 'vsc' ? {
                    make: vscForm.make,
                    model: vscForm.model,
                    year: vscForm.year,
                    mileage: vscForm.mileage,
                    vin: vscForm.vin
                  } : undefined
                });

                // Show final success message
                document.getElementById('modalError').innerHTML = `
                  <div style="color: #28a745; display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                    </svg>
                    Payment completed! Redirecting...
                  </div>
                `;

                // Wait a moment then redirect to success page
                setTimeout(() => {
                  // Create success result
                  const successResult = {
                    success: true,
                    transaction_number: transactionId || `TXN-${Date.now()}`,
                    confirmation_number: `CONF-${transactionId || Date.now()}`,
                    amount: amount,
                    status: 'Approved',
                    payment_method: 'Credit Card',
                    customer_info: customerInfo,
                    processor_transaction_id: transactionId,
                    approval_code: approvalCode,
                    response_message: responseMessage,
                    next_steps: [
                      'Your payment has been processed successfully',
                      'You will receive a confirmation email shortly',
                      'Your protection plan is now active',
                      'Keep your confirmation number for your records'
                    ]
                  };

                  // Clean up
                  document.body.removeChild(modal);
                  document.body.removeChild(form);

                  setPaymentResult(successResult);
                  setShowPayment(false);
                  setError('');
                  resolve(successResult);
                }, 1500);

              } else {
                // Payment failed
                const errorMsg = responseMessage || 'Payment processing failed';
                console.error('❌ HelcimJS payment failed:', {
                  response,
                  responseMessage,
                  transactionId
                });

                document.getElementById('modalError').innerHTML = `
                  <div style="color: #dc3545; display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                    </svg>
                    Payment failed: ${errorMsg}
                  </div>
                `;
                
                // Re-enable the process button
                processBtn.textContent = 'Process Payment';
                processBtn.disabled = false;
              }

            } catch (error) {
              console.error('❌ HelcimJS payment error:', error);
              
              let errorMessage = 'Payment processing failed';
              if (error.message) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }

              document.getElementById('modalError').innerHTML = `
                <div style="color: #dc3545; display: flex; align-items: center; gap: 8px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                  </svg>
                  Error: ${errorMessage}
                </div>
              `;
              
              // Re-enable the process button
              processBtn.textContent = 'Process Payment';
              processBtn.disabled = false;
              
              // If it's a network error or validation error, don't close modal
              if (errorMessage.includes('network') || errorMessage.includes('validation')) {
                // Keep modal open for retry
                return;
              }
            }
          });

          // Cancel button
          document.getElementById('modalCancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.removeChild(form);
            reject(new Error('Payment cancelled by user'));
          });

          // Close on backdrop click
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              document.body.removeChild(modal);
              document.body.removeChild(form);
              reject(new Error('Payment cancelled by user'));
            }
          });
        };

        // Show payment modal
        createPaymentModal();

      } catch (error) {
        console.error('❌ HelcimJS initialization error:', error);
        reject(error);
      }
    });
  }

  // Save Transaction to Database
  const saveTransactionToDatabase = async (transactionData) => {

    const response = await fetch(`${API_BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save_transaction',
        transaction_data: transactionData
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save transaction data');
    }

    return result.data;
  }

  // Financing Payment Processing
  const processFinancingPayment = async (amount) => {

    const paymentData = {
      quote_id: quote.quote_id || `QUOTE-${Date.now()}`,
      payment_method: 'financing',
      amount: amount,
      currency: 'USD',
      financing_terms: financingTerms,
      customer_info: {
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
        email: customerInfo.email,
        phone: customerInfo.phone || ''
      },
      payment_details: {
        product_type: activeTab === 'vsc' ? 'vehicle_service_contract' : 'hero_product',
        coverage_details: quote.coverage_details || {},
        vehicle_info: activeTab === 'vsc' ? {
          make: vscForm.make,
          model: vscForm.model,
          year: vscForm.year,
          mileage: vscForm.mileage,
          vin: vscForm.vin
        } : undefined
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (result.success && result.data) {
      
      const successResult = {
        success: true,
        transaction_number: result.data.transaction_number,
        confirmation_number: result.data.confirmation_number,
        amount: amount,
        status: result.data.status,
        payment_method: 'Financing',
        customer_info: customerInfo,
        financing_details: {
          terms: financingTerms,
          monthly_payment: amount / parseInt(financingTerms)
        },
        next_steps: result.data.next_steps || [
          'Your financing application has been approved',
          'You will receive your payment schedule via email',
          'Your protection plan is now active'
        ]
      };

      setPaymentResult(successResult);
      setShowPayment(false);
      setError('');
    } else {
      throw new Error(result.error || 'Financing processing failed');
    }
  }

  const handlePurchase = () => {
    if (!quote) return
    setShowPayment(true)
    setError('')
    setPaymentResult(null)
  }

  const resetQuote = () => {
    setQuote(null)
    setShowPayment(false)
    setPaymentResult(null)
    setError('')
  }

  if (paymentResult) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Card>
              <CardHeader>
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-3xl text-green-700">Payment Successful!</CardTitle>
                <CardDescription className="text-lg">
                  Your protection plan has been purchased successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Transaction ID:</Label>
                      <p className="text-sm">{paymentResult.transaction_number}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Confirmation Number:</Label>
                      <p className="text-sm">{paymentResult.confirmation_number}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Amount Paid:</Label>
                      <p className="text-sm">{formatCurrency(paymentResult.amount)}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Status:</Label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {paymentResult.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {paymentResult.next_steps && paymentResult.next_steps.length > 0 && (
                  <div className="text-left">
                    <h3 className="font-semibold mb-3">Next Steps:</h3>
                    <ul className="space-y-2">
                      {paymentResult.next_steps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <Button onClick={resetQuote} className="w-full">
                    Get Another Quote
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  if (showPayment && quote) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Secure Payment</span>
                  </CardTitle>
                  <CardDescription>
                    Complete your purchase to activate your protection plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={customerInfo.first_name}
                          onChange={(e) => setCustomerInfo({...customerInfo, first_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={customerInfo.last_name}
                          onChange={(e) => setCustomerInfo({...customerInfo, last_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Payment Method</h3>
                    <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="credit_card">Credit Card</TabsTrigger>
                        <TabsTrigger value="financing">Financing</TabsTrigger>
                      </TabsList>

                      <TabsContent value="credit_card" className="space-y-4 mt-6">
                        {/* Credit Card Payment Info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium text-blue-900">Secure Credit Card Payment</h4>
                          </div>
                          <p className="text-sm text-blue-700">
                            Your payment will be processed securely through HelcimJS. No card information is stored on our servers.
                          </p>
                        </div>

                        {/* Billing Address */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Billing Address</h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="address">Address *</Label>
                              <Input
                                id="address"
                                placeholder="123 Main St"
                                value={billingInfo.address}
                                onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="city">City *</Label>
                                <Input
                                  id="city"
                                  placeholder="City"
                                  value={billingInfo.city}
                                  onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="state">State *</Label>
                                <Input
                                  id="state"
                                  placeholder="State"
                                  value={billingInfo.state}
                                  onChange={(e) => setBillingInfo({...billingInfo, state: e.target.value})}
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="zip_code">ZIP Code *</Label>
                                <Input
                                  id="zip_code"
                                  placeholder="12345"
                                  value={billingInfo.zip_code}
                                  onChange={(e) => setBillingInfo({
                                    ...billingInfo, 
                                      zip_code: e.target.value.replace(/\D/g, '')
                                  })}
                                  maxLength={20}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="country">Country *</Label>
                                <Select
                                  value={billingInfo.country}
                                  onValueChange={(value) => setBillingInfo({...billingInfo, country: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="US">United States</SelectItem>
                                    <SelectItem value="CA">Canada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="financing" className="space-y-4 mt-6">
                        {/* Financing Options */}
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-900 mb-2">0% APR Financing Available</h4>
                            <p className="text-sm text-blue-700">
                              Pay over time with no interest for qualified customers
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="financing_terms">Financing Terms</Label>
                            <Select
                              value={financingTerms}
                              onValueChange={setFinancingTerms}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12">12 months - 0% APR</SelectItem>
                                <SelectItem value="24">24 months - 0% APR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {financingTerms && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                  <span>Total Amount:</span>
                                  <span className="font-semibold">
                                    {formatCurrency(quote.pricing_breakdown?.total_price || quote.pricing?.total_price || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Monthly Payment:</span>
                                  <span className="font-semibold">
                                    {formatCurrency((quote.pricing_breakdown?.total_price || quote.pricing?.total_price || 0) / parseInt(financingTerms))}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Term:</span>
                                  <span>{financingTerms} months</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>APR:</span>
                                  <span className="text-green-600 font-semibold">0%</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            * Subject to credit approval. Terms and conditions apply.
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Separator />

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={processPayment} 
                      className="w-full" 
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {paymentMethod === 'credit_card' ? 'Pay with Credit Card' : 'Apply for Financing'}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPayment(false)}
                      className="w-full"
                      disabled={paymentLoading}
                    >
                      Back to Quote
                    </Button>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-gray-50 p-4 rounded-lg border text-center">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <Lock className="h-4 w-4" />
                      <span>Your payment information is encrypted and secure</span>
                    </div>
                    {paymentMethod === 'credit_card' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Powered by HelcimJS - No card data stored on our servers
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>{formatCurrency(quote.pricing_breakdown?.base_calculation || quote.pricing?.base_price || 0)}</span>
                    </div>
                    {(quote.pricing_breakdown?.admin_fee || quote.pricing?.admin_fee) && (
                      <div className="flex justify-between">
                        <span>Admin Fee:</span>
                        <span>{formatCurrency(quote.pricing_breakdown?.admin_fee || quote.pricing?.admin_fee || 0)}</span>
                      </div>
                    )}
                    {(quote.pricing_breakdown?.tax_amount || quote.pricing?.tax_amount) && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(quote.pricing_breakdown?.tax_amount || quote.pricing?.tax_amount || 0)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(quote.pricing_breakdown?.total_price || quote.pricing?.total_price || 0)}</span>
                    </div>
                  </div>

                  {/* Coverage Summary */}
                  {quote.coverage_details && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3">Coverage Details:</h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries(quote.coverage_details).map(([key, value], index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle Information (for VSC) */}
                  {activeTab === 'vsc' && vinInfo && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3">Vehicle Information:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vehicle:</span>
                          <span className="font-medium">{vinInfo.year} {vinInfo.make} {vinInfo.model || 'Model not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mileage:</span>
                          <span className="font-medium">{parseInt(vscForm.mileage).toLocaleString()} miles</span>
                        </div>
                        {vscForm.vin && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">VIN:</span>
                            <span className="font-medium text-xs">{vscForm.vin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
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
                                {vinInfo.model && <p><strong>Model:</strong> {vinInfo.model}</p>}
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
                            {vscForm.auto_populated && vinInfo?.model && <Badge variant="secondary" className="ml-2 text-xs">Auto-filled</Badge>}
                          </Label>
                          <Input
                            id="vsc-model"
                            placeholder="Enter model"
                            value={vscForm.model}
                            onChange={(e) => setVscForm({...vscForm, model: e.target.value})}
                            className={vscForm.auto_populated && vinInfo?.model ? 'bg-green-50 border-green-300' : ''}
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
                          <Label htmlFor="vsc-mileage">
                            Current Mileage
                            <span className="text-red-500 ml-1">*</span>
                            <span className="text-sm text-muted-foreground ml-1">(Required for eligibility)</span>
                          </Label>
                          <Input
                            id="vsc-mileage"
                            type="number"
                            placeholder="50000"
                            min="0"
                            max="500000"
                            value={vscForm.mileage}
                            onChange={(e) => setVscForm({...vscForm, mileage: e.target.value})}
                            className="border-blue-300 focus:border-blue-500"
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
                      {vinInfo && vscForm.mileage && eligibilityCheck && (
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
                              {eligibilityCheck.eligible ? 'Vehicle Eligible for VSC' : 'Vehicle Not Eligible for VSC'}
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
                              <p className="text-yellow-800 font-medium text-sm mb-1">Considerations:</p>
                              <ul className="text-yellow-700 text-sm space-y-1">
                                {eligibilityCheck.warnings.map((warning, index) => (
                                  <li key={index}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mileage reminder if VIN decoded but no mileage */}
                      {vinInfo && !vscForm.mileage && (
                        <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="text-yellow-800 font-medium">Enter Current Mileage</span>
                          </div>
                          <p className="text-yellow-700 text-sm mt-1">
                            Please enter your vehicle's current mileage to check eligibility for our service contract.
                          </p>
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

          {/* Quote Results */}
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
                        {formatCurrency(quote.pricing_breakdown?.total_price || quote.pricing?.total_price || 0)}
                      </div>
                      <Badge variant="secondary">
                        {(quote.coverage_details?.customer_type || quote.product_info?.customer_type) === 'wholesale' ? 'Wholesale Price' : 'Retail Price'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrency(quote.pricing_breakdown?.base_calculation || quote.pricing?.base_price || 0)}</span>
                      </div>
                      {(quote.pricing_breakdown?.admin_fee || quote.pricing?.admin_fee) && (
                        <div className="flex justify-between">
                          <span>Admin Fee:</span>
                          <span>{formatCurrency(quote.pricing_breakdown?.admin_fee || quote.pricing?.admin_fee || 0)}</span>
                        </div>
                      )}
                      {(quote.pricing_breakdown?.tax_amount || quote.pricing?.tax_amount) && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(quote.pricing_breakdown?.tax_amount || quote.pricing?.tax_amount || 0)}</span>
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
                        <span>{formatCurrency(quote.pricing_breakdown?.total_price || quote.pricing?.total_price || 0)}</span>
                      </div>
                    </div>

                    {(quote.pricing_breakdown?.monthly_payment || quote.pricing?.monthly_payment || quote.payment_options?.monthly_payment) && (
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Monthly Payment</div>
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(quote.pricing_breakdown?.monthly_payment || quote.pricing?.monthly_payment || quote.payment_options?.monthly_payment || 0)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button className="w-full" onClick={handlePurchase}>
                        <CreditCard className="h-4 w-4 mr-2" />
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
                          {Object.entries(quote.coverage_details).map(([key, value], index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>
                                <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {quote.product_info && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Product Information:</h4>
                        <ul className="text-sm space-y-1">
                          {Object.entries(quote.product_info).map(([key, value], index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>
                                <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === 'vsc' && vinInfo && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-semibold">Vehicle Information:</h4>
                        <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                          <p><strong>VIN:</strong> {vscForm.vin}</p>
                          <p><strong>Vehicle:</strong> {vinInfo.year} {vinInfo.make} {vinInfo.model || 'Model not specified'}</p>
                          {vinInfo.trim && <p><strong>Trim:</strong> {vinInfo.trim}</p>}
                          {vinInfo.engine && <p><strong>Engine:</strong> {vinInfo.engine}</p>}
                          <p><strong>Mileage:</strong> {parseInt(vscForm.mileage).toLocaleString()} miles</p>
                          {eligibilityCheck && (
                            <p><strong>Eligibility:</strong> 
                              <span className={eligibilityCheck.eligible ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {eligibilityCheck.eligible ? ' Eligible' : ' Not Eligible'}
                              </span>
                            </p>
                          )}
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
                  
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-4">
                    <p className="text-blue-800 font-medium text-sm">Eligibility Requirements:</p>
                    <ul className="text-blue-700 text-sm mt-1 space-y-1">
                      <li>• Vehicle must be 20 model years or newer</li>
                      <li>• Less than 200,000 miles</li>
                      <li>• Current mileage required for accurate eligibility check</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-muted-foreground text-xs">Visa, MasterCard, American Express, Discover</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">0% APR Financing</p>
                      <p className="text-muted-foreground text-xs">12 or 24 months • No interest • Quick approval</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border mt-4">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-gray-600" />
                    <span className="text-xs text-gray-600 font-medium">Secure Payment Processing</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    All payments are encrypted and processed securely through our certified payment partners.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotePage