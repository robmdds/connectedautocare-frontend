import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  CreditCard, 
  FileText, 
  Download, 
  Mail, 
  Calendar,
  DollarSign,
  Clock,
  Shield,
  Phone,
  ExternalLink
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { formatCurrency } from '../lib/paymentAPI'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentConfirmation = () => {
  const { transactionId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetails()
    }
  }, [transactionId])

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${transactionId}/status`)
      const result = await response.json()

      if (result.success && result.data) {
        setTransaction(result.data)
      } else {
        setError('Transaction not found')
      }
    } catch (err) {
      setError('Failed to load transaction details')
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async () => {
    try {
      // This would generate and download a PDF receipt
      const receiptData = {
        transaction_id: transaction.transaction_number,
        customer_name: `${transaction.first_name} ${transaction.last_name}`,
        amount: transaction.amount,
        date: transaction.processed_at,
        payment_method: transaction.payment_method?.method || 'Credit Card',
        product_type: transaction.product_type || 'Protection Plan'
      }

      // In production, this would call an API to generate PDF
      alert('Receipt download would be implemented here')
    } catch (err) {
      console.error('Receipt download error:', err)
    }
  }

  const sendEmailReceipt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${transactionId}/email-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        alert('Receipt sent to your email address')
      } else {
        alert('Failed to send email receipt')
      }
    } catch (err) {
      console.error('Email receipt error:', err)
      alert('Failed to send email receipt')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/quote')} className="w-full">
              Get New Quote
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'financing_approved':
        return 'bg-purple-100 text-purple-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isFinancing = transaction?.payment_method?.method === 'financing'
  const nextPaymentDate = isFinancing && transaction?.processor_response?.first_payment_due

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Success Header */}
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-green-700 mb-2">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground">
              Your protection plan has been purchased successfully
            </p>
          </div>

          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Transaction Details</span>
              </CardTitle>
              <CardDescription>
                Keep this information for your records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Transaction Information
                    </h4>
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Transaction ID:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {transaction.transaction_number}
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Confirmation Number:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          CAC-{transaction.transaction_number}
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Status:</span>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status === 'financing_approved' ? 'Financing Approved' : transaction.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Date:</span>
                        <span className="text-sm">
                          {new Date(transaction.processed_at || transaction.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Customer Information
                    </h4>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm">
                        <strong>Name:</strong> {transaction.first_name} {transaction.last_name}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {transaction.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Payment Information
                    </h4>
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment Method:</span>
                        <span className="text-sm capitalize">
                          {transaction.payment_method?.method === 'credit_card' ? 'Credit Card' : 'Financing'}
                        </span>
                      </div>
                      {transaction.payment_method?.method === 'credit_card' && transaction.processor_response?.last_four && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Card:</span>
                          <span className="text-sm">
                            {transaction.processor_response.card_type} ending in {transaction.processor_response.last_four}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financing Details */}
                  {isFinancing && transaction.processor_response && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Financing Details
                      </h4>
                      <div className="mt-2 space-y-2">
                        <p className="text-sm">
                          <strong>Terms:</strong> {transaction.processor_response.terms}
                        </p>
                        <p className="text-sm">
                          <strong>Monthly Payment:</strong> {formatCurrency(transaction.processor_response.monthly_payment)}
                        </p>
                        {nextPaymentDate && (
                          <p className="text-sm">
                            <strong>First Payment Due:</strong> {new Date(nextPaymentDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Policy Information */}
              {(transaction.policy_number || transaction.product_type) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      Policy Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transaction.policy_number && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Policy Number:</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {transaction.policy_number}
                          </code>
                        </div>
                      )}
                      {transaction.product_type && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Product Type:</span>
                          <span className="text-sm capitalize">
                            {transaction.product_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>What Happens Next?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isFinancing ? (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Financing Documents</h4>
                        <p className="text-sm text-muted-foreground">
                          You'll receive your financing agreement and payment schedule via email within 24 hours.
                        </p>
                      </div>
                    </div>
                    {nextPaymentDate && (
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">First Payment</h4>
                          <p className="text-sm text-muted-foreground">
                            Your first payment of {formatCurrency(transaction.processor_response?.monthly_payment)} is due on{' '}
                            {new Date(nextPaymentDate).toLocaleDateString()}.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Payment Processed</h4>
                      <p className="text-sm text-muted-foreground">
                        Your payment has been successfully processed and your protection plan is now active.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Contract & Documentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Your protection plan contract and policy documents will be generated and sent to your email within 2-3 business days.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Coverage Activation</h4>
                    <p className="text-sm text-muted-foreground">
                      Your protection plan coverage is effective immediately. Keep your confirmation number for claims processing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={downloadReceipt} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            
            <Button onClick={sendEmailReceipt} variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Email Receipt
            </Button>
            
            <Button onClick={() => navigate('/quote')} variant="outline" className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Get Another Quote
            </Button>
            
            <Button 
              onClick={() => window.open('tel:1-866-660-7003', '_self')} 
              variant="outline" 
              className="w-full"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Important Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 text-lg">Important Information</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Keep Your Confirmation Number:</strong> Your confirmation number (CAC-{transaction.transaction_number}) 
                  is required for all claims and customer service inquiries.
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>24/7 Claims Support:</strong> If you need to file a claim, call our 24/7 claims hotline at 
                  <a href="tel:1-866-660-7003" className="font-medium underline ml-1">1-(866) 660-7003</a>.
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Customer Portal:</strong> Access your policy documents, payment history, and file claims online at our 
                  <a href="#" className="font-medium underline ml-1">customer portal</a>.
                </p>
              </div>
              
              {isFinancing && (
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Automatic Payments:</strong> Set up automatic payments to ensure you never miss a payment. 
                    Login to your financing account using the link in your email.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Our customer service team is here to help you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">Phone Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">24/7 Customer Service</p>
                  <a href="tel:1-866-660-7003" className="text-primary font-medium hover:underline">
                    1-(866) 660-7003
                  </a>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">Email Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">Response within 24 hours</p>
                  <a href="mailto:support@connectedautocare.com" className="text-primary font-medium hover:underline">
                    support@connectedautocare.com
                  </a>
                </div>
                
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                    <ExternalLink className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">Online Portal</h4>
                  <p className="text-sm text-muted-foreground mb-2">Manage your account</p>
                  <a href="#" className="text-primary font-medium hover:underline">
                    Customer Portal
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default PaymentConfirmation