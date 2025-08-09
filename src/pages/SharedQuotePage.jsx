import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    AlertCircle,
    Loader,
    CreditCard,
    Clock,
    Building2,
    User,
    Mail,
    Phone,
    Calendar,
    Lock,
    FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { formatCurrency } from '../lib/api';

const SharedQuotePage = () => {
    const { shareToken } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quote, setQuote] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });

    const [billingInfo, setBillingInfo] = useState({
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'US'
    });

    // Load Helcim.js script
    useEffect(() => {
        if (!window.helcimProcess) {
            const script = document.createElement('script');
            script.src = '/version2.js';
            script.async = true;
            script.onload = () => {
            };
            script.onerror = () => {
                console.error('Failed to load Helcim.js');
                setError('Payment system unavailable. Please refresh the page and try again.');
            };
            document.head.appendChild(script);

            return () => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            };
        }
    }, []);

    useEffect(() => {
        if (shareToken) {
            fetchSharedQuote(shareToken);
        }
    }, [shareToken]);

    // Pre-populate customer info when quote loads
    useEffect(() => {
        if (quote) {
            const quoteCustomerInfo = quote.customer_info || {};
            const quoteContactInfo = quote.contact_info || {};

            setCustomerInfo({
                first_name: quoteCustomerInfo.first_name || '',
                last_name: quoteCustomerInfo.last_name || '',
                email: quoteContactInfo.email || '',
                phone: quoteContactInfo.phone || ''
            });
        }
    }, [quote]);

    const fetchSharedQuote = async (token) => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/quote/shared/${token}`);
            const result = await response.json();

            if (result.success) {
                setQuote(result.quote);
            } else {
                setError(result.error || 'Quote not found');
            }
        } catch (err) {
            console.error('Failed to fetch shared quote:', err);
            setError('Failed to load quote. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

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
                form.action = 'javascript:void(0);';

                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
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

                form.appendChild(createHiddenInput('token', import.meta.env.VITE_HELCIM_TOKEN || 'de2a5120a337b055a082b5'));
                form.appendChild(createHiddenInput('amount', amount.toFixed(2)));
                form.appendChild(createHiddenInput('currency', 'USD'));
                form.appendChild(createHiddenInput('test', import.meta.env.VITE_HELCIM_TEST_MODE || '1'));
                form.appendChild(createHiddenInput('dontSubmit', '1'));
                form.appendChild(createHiddenInput('orderNumber', `SHARED-${quote?.quote_id || Date.now()}`));
                form.appendChild(createHiddenInput('customerCode', `CUST-${shareToken}`));
                form.appendChild(createHiddenInput('comments', `Shared Quote - ${quote?.product_type || 'Protection Plan'} - ConnectedAutoCare`));
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
                form.appendChild(createHiddenInput('cardHolderAddress', billingInfo.address));
                form.appendChild(createHiddenInput('cardHolderPostalCode', billingInfo.zip_code));

                document.body.appendChild(form);

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
                            Amount: <strong>$${amount.toFixed(2)}</strong>
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

                    document.getElementById('modalCardNumber').addEventListener('input', (e) => {
                        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                        e.target.value = formattedValue;
                    });

                    document.getElementById('modalProcessBtn').addEventListener('click', async () => {
                        const cardNumber = document.getElementById('modalCardNumber').value.replace(/\s+/g, '');
                        const expiryMonth = document.getElementById('modalCardExpiryMonth').value;
                        const expiryYear = document.getElementById('modalCardExpiryYear').value;
                        const cvv = document.getElementById('modalCardCVV').value;

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

                        document.getElementById('cardNumber').value = cardNumber;
                        document.getElementById('cardExpiry').value = expiryMonth + expiryYear.slice(-2);
                        document.getElementById('cardCVV').value = cvv;

                        const processBtn = document.getElementById('modalProcessBtn');
                        processBtn.textContent = 'Processing...';
                        processBtn.disabled = true;

                        try {
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

                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = result;

                            const response = tempDiv.querySelector('#response')?.value;
                            const responseMessage = tempDiv.querySelector('#responseMessage')?.value;
                            const transactionId = tempDiv.querySelector('#transactionId')?.value;
                            const cardToken = tempDiv.querySelector('#cardToken')?.value;
                            const approvalCode = tempDiv.querySelector('#approvalCode')?.value;

                            if (response === '1') {
                                document.getElementById('modalError').innerHTML = `
                                    <div style="color: #28a745; display: flex; align-items: center; gap: 8px;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                                        </svg>
                                        Payment successful! Saving transaction...
                                    </div>
                                `;

                                await acceptSharedQuote({
                                    helcim_response: {
                                        response,
                                        responseMessage,
                                        transactionId,
                                        cardToken,
                                        approvalCode,
                                        amount: amount.toFixed(2),
                                        currency: 'USD'
                                    },
                                    customer_info: customerInfo,
                                    billing_info: billingInfo,
                                    payment_method: 'credit_card',
                                    amount: amount
                                });

                                document.getElementById('modalError').innerHTML = `
                                    <div style="color: #28a745; display: flex; align-items: center; gap: 8px;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                                        </svg>
                                        Payment completed! Redirecting...
                                    </div>
                                `;

                                setTimeout(() => {
                                    const successResult = {
                                        success: true,
                                        transaction_number: transactionId || `TXN-${Date.now()}`,
                                        confirmation_number: `CONF-${transactionId || Date.now()}`,
                                        amount: amount,
                                        status: 'Approved',
                                        payment_method: 'Credit Card',
                                        processor_transaction_id: transactionId,
                                        approval_code: approvalCode,
                                        response_message: responseMessage
                                    };

                                    document.body.removeChild(modal);
                                    document.body.removeChild(form);

                                    setPaymentResult(successResult);
                                    setSuccessModalOpen(true);
                                    setShowPayment(false);
                                    setError('');
                                    resolve(successResult);
                                }, 1500);
                            } else {
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

                            processBtn.textContent = 'Process Payment';
                            processBtn.disabled = false;
                        }
                    });

                    document.getElementById('modalCancelBtn').addEventListener('click', () => {
                        document.body.removeChild(modal);
                        document.body.removeChild(form);
                        reject(new Error('Payment cancelled by user'));
                    });

                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            document.body.removeChild(modal);
                            document.body.removeChild(form);
                            reject(new Error('Payment cancelled by user'));
                        }
                    });
                };

                createPaymentModal();
            } catch (error) {
                console.error('❌ HelcimJS initialization error:', error);
                reject(error);
            }
        });
    };

    const acceptSharedQuote = async (paymentData) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/quote/${shareToken}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_completed: true,
                    payment_data: paymentData
                })
            });

            const result = await response.json();

            if (!result.success) {
                console.error('Failed to accept shared quote:', result.error);
                throw new Error('Failed to save transaction data');
            }
            return result;
        } catch (error) {
            console.error('Error accepting shared quote:', error);
            throw error;
        }
    };

    const processPayment = async () => {
        if (!quote) return;

        if (!customerInfo.first_name || !customerInfo.last_name || !customerInfo.email ||
            !billingInfo.address || !billingInfo.city || !billingInfo.state || !billingInfo.zip_code) {
            setError('Please fill in all required fields');
            return;
        }

        setPaymentLoading(true);
        setError('');

        try {
            const quoteDetails = quote.quote_details || {};
            const pricing = quoteDetails.pricing || {};
            const totalAmount = pricing.total_price || 0;

            const result = await processHelcimPayment(totalAmount);
        } catch (error) {
            console.error('Payment processing failed:', error);
            setError(error.message || 'Payment processing failed. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handlePurchase = () => {
        setShowPayment(true);
    };

    const handleSuccessClose = () => {
        setSuccessModalOpen(false);
        navigate('/');
    };

    const getExpirationStatus = (expiresAt) => {
        if (!expiresAt) return { status: 'valid', message: 'No expiration', color: 'green' };

        const now = new Date();
        const expiration = new Date(expiresAt);
        const timeDiff = expiration.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) {
            return { status: 'expired', message: 'Expired', color: 'red' };
        } else if (daysDiff <= 3) {
            return { status: 'expiring', message: `Expires in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`, color: 'yellow' };
        } else {
            return { status: 'valid', message: `Valid for ${daysDiff} days`, color: 'green' };
        }
    };

    const SuccessModal = () => (
        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <DialogTitle className="text-center text-green-700">Payment Successful!</DialogTitle>
                    <DialogDescription className="text-center">
                        Your protection plan has been purchased successfully
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {paymentResult && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Transaction ID:</span>
                                    <span className="font-mono">{paymentResult.transaction_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Quote ID:</span>
                                    <span className="font-mono">{quote?.quote_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount Paid:</span>
                                    <span className="font-semibold">{formatCurrency(paymentResult.amount)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-3">
                        <Button onClick={handleSuccessClose} className="w-full">
                            Return to Homepage
                        </Button>
                        {paymentResult?.receipt_url && (
                            <Button variant="outline" className="w-full" asChild>
                                <a href={paymentResult.receipt_url} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download Receipt
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    if (loading) {
        return (
            <div className="min-h-screen py-12 bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <Loader className="h-8 w-8 animate-spin mx-auto text-primary" />
                            <h3 className="font-semibold">Loading Quote...</h3>
                            <p className="text-sm text-muted-foreground">
                                Please wait while we retrieve your quote details.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && !quote) {
        return (
            <div className="min-h-screen py-12 bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                            <h3 className="font-semibold text-red-700">Quote Unavailable</h3>
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Button variant="outline" onClick={() => navigate('/')}>
                                Go to Homepage
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!quote) return null;

    const expirationStatus = getExpirationStatus(quote.expires_at);
    const quoteDetails = quote.quote_details || {};
    const pricing = quoteDetails.pricing || {};

    if (showPayment) {
        return (
            <div className="min-h-screen py-12 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Lock className="h-5 w-5" />
                                        <span>Complete Your Purchase</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Provide your information to complete the purchase. Payment will be processed securely.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Customer Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="first_name">First Name *</Label>
                                                <Input
                                                    id="first_name"
                                                    value={customerInfo.first_name}
                                                    onChange={(e) => setCustomerInfo(prev => ({...prev, first_name: e.target.value}))}
                                                    required
                                                    disabled={paymentLoading}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="last_name">Last Name *</Label>
                                                <Input
                                                    id="last_name"
                                                    value={customerInfo.last_name}
                                                    onChange={(e) => setCustomerInfo(prev => ({...prev, last_name: e.target.value}))}
                                                    required
                                                    disabled={paymentLoading}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email">Email *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={customerInfo.email}
                                                    onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                                                    required
                                                    disabled={paymentLoading}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={customerInfo.phone}
                                                    onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                                                    disabled={paymentLoading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Billing Address</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <Label htmlFor="address">Address *</Label>
                                                <Input
                                                    id="address"
                                                    placeholder="123 Main St"
                                                    value={billingInfo.address}
                                                    onChange={(e) => setBillingInfo(prev => ({...prev, address: e.target.value}))}
                                                    required
                                                    disabled={paymentLoading}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="city">City *</Label>
                                                    <Input
                                                        id="city"
                                                        placeholder="City"
                                                        value={billingInfo.city}
                                                        onChange={(e) => setBillingInfo(prev => ({...prev, city: e.target.value}))}
                                                        required
                                                        disabled={paymentLoading}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="state">State *</Label>
                                                    <Input
                                                        id="state"
                                                        placeholder="State"
                                                        value={billingInfo.state}
                                                        onChange={(e) => setBillingInfo(prev => ({...prev, state: e.target.value}))}
                                                        required
                                                        disabled={paymentLoading}
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
                                                        onChange={(e) => setBillingInfo(prev => ({
                                                            ...prev,
                                                            zip_code: e.target.value.replace(/\D/g, '')
                                                        }))}
                                                        maxLength={10}
                                                        required
                                                        disabled={paymentLoading}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="country">Country *</Label>
                                                    <Select
                                                        value={billingInfo.country}
                                                        onValueChange={(value) => setBillingInfo(prev => ({...prev, country: value}))}
                                                        disabled={paymentLoading}
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
                                    <Separator />
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <p className="text-red-600 text-sm">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-2">
                                            <CreditCard className="h-4 w-4 text-blue-600" />
                                            <span className="text-blue-800 font-medium">Secure Payment Processing</span>
                                        </div>
                                        <p className="text-blue-700 text-sm mt-1">
                                            When you click "Process Payment", a secure payment window will open where you can safely enter your credit card information.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={processPayment}
                                            className="w-full"
                                            disabled={paymentLoading}
                                            size="lg"
                                        >
                                            {paymentLoading ? (
                                                <>
                                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="h-4 w-4 mr-2" />
                                                    Process Payment - {formatCurrency(pricing.total_price || 0)}
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
                                    <div className="bg-gray-50 p-4 rounded-lg border text-center">
                                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                            <Lock className="h-4 w-4" />
                                            <span>Your payment information is encrypted and secure</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Powered by Helcim - PCI DSS Level 1 Compliant
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                    <CardDescription>Quote ID: {quote.quote_id}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Base Price:</span>
                                            <span>{formatCurrency(pricing.base_price || 0)}</span>
                                        </div>
                                        {(pricing.admin_fee || 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Admin Fee:</span>
                                                <span>{formatCurrency(pricing.admin_fee || 0)}</span>
                                            </div>
                                        )}
                                        {(pricing.tax_amount || 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Tax:</span>
                                                <span>{formatCurrency(pricing.tax_amount || 0)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>{formatCurrency(pricing.total_price || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border">
                                        <div className="text-sm font-medium mb-2">Payment Methods Accepted:</div>
                                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                                            <span>💳 Visa</span>
                                            <span>💳 MasterCard</span>
                                            <span>💳 Amex</span>
                                            <span>💳 Discover</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border">
                                        <div className="text-sm">
                                            <div className="font-medium">Provided by:</div>
                                            <div className="text-muted-foreground">{quote.reseller_name}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <SuccessModal />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center space-x-2">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                        <span>Protection Plan Quote</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Quote ID: {quote.quote_id}
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant={expirationStatus.color === 'green' ? 'default' :
                                        expirationStatus.color === 'yellow' ? 'destructive' : 'secondary'}
                                    className="flex items-center space-x-1"
                                >
                                    <Clock className="h-3 w-3" />
                                    <span>{expirationStatus.message}</span>
                                </Badge>
                            </div>
                        </CardHeader>
                    </Card>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quote Summary</CardTitle>
                                    <CardDescription>
                                        Your protection plan pricing breakdown
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center space-y-2">
                                        <div className="text-3xl font-bold text-primary">
                                            {formatCurrency(pricing.total_price || 0)}
                                        </div>
                                        <p className="text-muted-foreground">Total Amount</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Base Price:</span>
                                            <span>{formatCurrency(pricing.base_price || 0)}</span>
                                        </div>
                                        {(pricing.admin_fee || 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Admin Fee:</span>
                                                <span>{formatCurrency(pricing.admin_fee || 0)}</span>
                                            </div>
                                        )}
                                        {(pricing.tax_amount || 0) > 0 && (
                                            <div className="flex justify-between">
                                                <span>Tax:</span>
                                                <span>{formatCurrency(pricing.tax_amount || 0)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>{formatCurrency(pricing.total_price || 0)}</span>
                                        </div>
                                    </div>
                                    {pricing.monthly_payment && (
                                        <div className="bg-primary/5 p-4 rounded-lg">
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground">Monthly Payment Option</div>
                                                <div className="text-2xl font-bold text-primary">
                                                    {formatCurrency(pricing.monthly_payment)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {expirationStatus.status !== 'expired' && (
                                        <Button
                                            className="w-full"
                                            onClick={handlePurchase}
                                            size="lg"
                                        >
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Purchase This Plan
                                        </Button>
                                    )}
                                    {expirationStatus.status === 'expired' && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-red-800 font-medium">Quote Expired</span>
                                            </div>
                                            <p className="text-red-700 text-sm mt-1">
                                                This quote has expired. Please contact your reseller for a new quote.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {quoteDetails.product_info && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Product Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(quoteDetails.product_info).map(([key, value]) => (
                                                <div key={key}>
                                                    <div className="text-sm text-muted-foreground">
                                                        {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                    </div>
                                                    <div className="font-medium">{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {quoteDetails.coverage_details && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Coverage Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {Object.entries(quoteDetails.coverage_details).map(([key, value]) => (
                                                <li key={key} className="flex items-center space-x-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    <span className="text-sm">
                                                        <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {value}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <User className="h-5 w-5" />
                                        <span>Customer Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{quote.customer_info?.first_name} {quote.customer_info?.last_name}</span>
                                    </div>
                                    {quote.contact_info?.email && (
                                        <div className="flex items-center space-x-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{quote.contact_info.email}</span>
                                        </div>
                                    )}
                                    {quote.contact_info?.phone && (
                                        <div className="flex items-center space-x-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{quote.contact_info.phone}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Building2 className="h-5 w-5" />
                                        <span>Provided By</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium">{quote.reseller_name}</p>
                                    <p className="text-sm text-muted-foreground">Authorized Reseller</p>
                                    {quote.reseller_contact && (
                                        <div className="mt-2 space-y-1">
                                            {quote.reseller_contact.email && (
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs">{quote.reseller_contact.email}</span>
                                                </div>
                                            )}
                                            {quote.reseller_contact.phone && (
                                                <div className="flex items-center space-x-2">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs">{quote.reseller_contact.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Calendar className="h-5 w-5" />
                                        <span>Quote Validity</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Expires On</div>
                                            <div className="font-medium">
                                                {quote.expires_at ?
                                                    new Date(quote.expires_at).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) :
                                                    'No expiration'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Status</div>
                                            <Badge
                                                variant={expirationStatus.color === 'green' ? 'default' :
                                                    expirationStatus.color === 'yellow' ? 'destructive' : 'secondary'}
                                            >
                                                {expirationStatus.message}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="pt-6">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-primary flex items-center space-x-2">
                                            <Lock className="h-4 w-4" />
                                            <span>Secure Purchase</span>
                                        </h4>
                                        <p className="text-sm text-primary/80">
                                            Your payment will be processed securely through Helcim. All personal and payment information is encrypted and protected with industry-standard security measures.
                                        </p>

                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </motion.div>
                <SuccessModal />
            </div>
        </div>
    );
};

export default SharedQuotePage;