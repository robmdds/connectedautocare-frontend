import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import {
    CheckCircle,
    CreditCard,
    FileText,
    Mail,
    DollarSign,
    Clock,
    Shield,
    Phone,
    ExternalLink,
    Loader,
    AlertCircle,
    User,
    Car
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PaymentConfirmation = () => {
    const { transactionId } = useParams()
    const navigate = useNavigate()

    // State management
    const [loading, setLoading] = useState(true)
    const [transaction, setTransaction] = useState(null)
    const [error, setError] = useState('')
    const [contractGenerating, setContractGenerating] = useState(false)
    const [contractGenerated, setContractGenerated] = useState(false)
    const [downloadingContract, setDownloadingContract] = useState(false)


    useEffect(() => {
        if (transactionId) {
            fetchTransactionDetails()
        }
    }, [transactionId])

    // Auto-generate contract after transaction loads
    useEffect(() => {
        if (transaction && !contractGenerated && !contractGenerating) {
            checkAndGenerateContract()
        }
    }, [transaction])

    const fetchTransactionDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/api/payments/${transactionId}/status`)

            if (!response.ok) {
                throw new Error('Failed to fetch transaction details')
            }

            const result = await response.json()

            if (result && typeof result === 'object') {
                setTransaction(result)

                // Check if contract is already generated
                const metadata = result.metadata || {}
                if (metadata.contract_generated) {
                    setContractGenerated(true)
                }
            } else {
                setError('Invalid transaction data received')
            }
        } catch (err) {
            console.error('Error fetching transaction:', err)
            setError('Failed to load transaction details. Please try refreshing the page.')
        } finally {
            setLoading(false)
        }
    }

    const checkAndGenerateContract = async () => {
        if (!transaction || transaction.status !== 'completed') {
            return
        }

        setContractGenerating(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/${transactionId}/generate-contract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            const result = await response.json()

            if (result.success) {
                setContractGenerated(true)

                // Update transaction state to reflect contract generation
                setTransaction(prev => ({
                    ...prev,
                    contract_generated: true,
                    contract_id: result.contract_id,
                    contract_number: result.contract_number
                }))
            } else {
                console.error('Contract generation failed:', result.error)
            }
        } catch (err) {
            console.error('Contract generation error:', err)
        } finally {
            setContractGenerating(false)
        }
    }

    const downloadContract = async () => {
        if (!transaction) return

        setDownloadingContract(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/${transactionId}/download-contract`)

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `ConnectedAutoCare-Contract-${transactionId}.pdf`
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)
            } else {
                const errorResult = await response.json()
                throw new Error(errorResult.error || 'Failed to download contract')
            }
        } catch (err) {
            console.error('Contract download error:', err)
            alert('Failed to download contract. Please try again or contact support.')
        } finally {
            setDownloadingContract(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const getProductTypeDisplay = (productType) => {
        switch (productType?.toLowerCase()) {
            case 'vsc':
                return 'Vehicle Service Contract'
            case 'hero':
                return 'HERO Protection Plan'
            default:
                return 'Protection Plan'
        }
    }

    const extractVehicleInfo = (metadata) => {
        const vehicleInfo = metadata?.vehicle_info || {}
        const quoteData = metadata?.quote_data || {}
        const vinInfo = quoteData?.vin_info || {}
        const quoteVehicleInfo = quoteData?.vehicle_info || {}

        return {
            year: vehicleInfo.year || quoteVehicleInfo.year || vinInfo.vin_decoded?.year || 'N/A',
            make: vehicleInfo.make || quoteVehicleInfo.make || vinInfo.vin_decoded?.make || 'N/A',
            model: vehicleInfo.model || quoteVehicleInfo.model || vinInfo.vin_decoded?.model || 'N/A',
            vin: vehicleInfo.vin || vinInfo.vin || 'N/A',
            mileage: vehicleInfo.mileage || quoteVehicleInfo.mileage || 'N/A'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-lg text-gray-600">Loading transaction details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4">
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-600">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Error Loading Transaction
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="space-y-2">
                            <Button onClick={() => window.location.reload()} className="w-full">
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="w-full"
                            >
                                Go Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4">
                    <CardHeader>
                        <CardTitle className="text-center">Transaction Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-gray-600 mb-4">
                            The transaction you're looking for could not be found.
                        </p>
                        <Button onClick={() => navigate('/')} className="w-full">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const metadata = transaction.metadata || {}
    const customerInfo = metadata.customer_info || {}
    const productType = metadata.product_type || 'protection_plan'
    const vehicleInfo = extractVehicleInfo(metadata)
    const isVSC = productType.toLowerCase() === 'vsc'

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
                            Your {getProductTypeDisplay(productType)} has been purchased successfully
                        </p>
                    </div>

                    {/* Contract Generation Status */}
                    {contractGenerating && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <Loader className="h-4 w-4 animate-spin" />
                            <AlertDescription>
                                <div className="font-medium text-blue-900">Generating Your Contract</div>
                                <div className="text-sm text-blue-700">Please wait while we prepare your protection plan contract...</div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {contractGenerated && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-medium text-green-900">Contract Ready</div>
                                <div className="text-sm text-green-700">Your contract has been generated and is ready for download.</div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Transaction Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CreditCard className="h-5 w-5 mr-2" />
                                Transaction Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                                    <p className="font-mono text-sm">{transaction.transaction_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Amount Paid</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {formatCurrency(transaction.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Payment Method</p>
                                    <p className="capitalize">{transaction.payment_method?.method || 'Credit Card'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Transaction Date</p>
                                    <p>{new Date(transaction.processed_at || transaction.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                    <p>{customerInfo.first_name} {customerInfo.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p>{customerInfo.email}</p>
                                </div>
                                {customerInfo.phone && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                        <p>{customerInfo.phone}</p>
                                    </div>
                                )}
                                {customerInfo.company && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Company</p>
                                        <p>{customerInfo.company}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicle Information (for VSC) */}
                    {isVSC && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Car className="h-5 w-5 mr-2" />
                                    Vehicle Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Vehicle</p>
                                        <p className="font-semibold">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">VIN</p>
                                        <p className="font-mono text-sm">{vehicleInfo.vin}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Mileage</p>
                                        <p>{vehicleInfo.mileage} miles</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Coverage Level</p>
                                        <Badge variant="outline" className="w-fit">
                                            {metadata.quote_data?.coverage_details?.level || 'Standard'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Coverage Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="h-5 w-5 mr-2" />
                                Coverage Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Product Type</p>
                                    <p className="font-semibold">{getProductTypeDisplay(productType)}</p>
                                </div>
                                {metadata.quote_data?.coverage_details && (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Coverage Level</p>
                                            <p>{metadata.quote_data.coverage_details.level}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Term</p>
                                            <p>{metadata.quote_data.coverage_details.term_months} months</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                            onClick={downloadContract}
                            variant="default"
                            className="w-full"
                            disabled={!contractGenerated || downloadingContract}
                        >
                            {downloadingContract ? (
                                <>
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download Contract
                                </>
                            )}
                        </Button>


                        <Button
                            onClick={() => navigate('/quote')}
                            variant="outline"
                            className="w-full"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Get Another Quote
                        </Button>
                    </div>

                    {/* Next Steps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Clock className="h-5 w-5 mr-2" />
                                What Happens Next?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-green-100 rounded-full p-1 mt-0.5">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Payment Processed</p>
                                        <p className="text-sm text-gray-600">Your payment has been successfully processed and confirmed.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="bg-green-100 rounded-full p-1 mt-0.5">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Coverage Active</p>
                                        <p className="text-sm text-gray-600">Your protection plan is now active and ready to use.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Welcome Materials</p>
                                        <p className="text-sm text-gray-600">You'll receive welcome materials and claims instructions via email.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                                        <Phone className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Customer Support</p>
                                        <p className="text-sm text-gray-600">Contact us anytime for questions about your coverage or to file a claim.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Support Information */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center text-blue-700">
                                <Phone className="h-5 w-5 mr-2" />
                                Need Help?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-blue-700">
                                <p>If you have any questions about your purchase or coverage:</p>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2" />
                                        <span>Call us at: (555) 123-4567</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <span>Email: support@connectedautocare.com</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        <span>Visit our support center online</span>
                                    </div>
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