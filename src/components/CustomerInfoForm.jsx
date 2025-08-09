import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { UserCheck } from 'lucide-react';

const CustomerInfoForm = ({
                              userType,
                              customerInfo,
                              setCustomerInfo,
                              quoteNotes,
                              setQuoteNotes,
                              shareLoading
                          }) => {
    if (userType !== 'reseller') return null;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5" />
                    <span>Customer Information</span>
                </CardTitle>
                <CardDescription>
                    Enter your customer's details for this quote
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="customer_first_name">First Name *</Label>
                        <Input
                            id="customer_first_name"
                            value={customerInfo?.first_name || ''}
                            onChange={(e) => setCustomerInfo(prev => ({...prev, first_name: e.target.value}))}
                            placeholder="John"
                            required
                            disabled={shareLoading}
                        />
                    </div>
                    <div>
                        <Label htmlFor="customer_last_name">Last Name *</Label>
                        <Input
                            id="customer_last_name"
                            value={customerInfo?.last_name || ''}
                            onChange={(e) => setCustomerInfo(prev => ({...prev, last_name: e.target.value}))}
                            placeholder="Doe"
                            required
                            disabled={shareLoading}
                        />
                    </div>
                    <div>
                        <Label htmlFor="customer_email">Email *</Label>
                        <Input
                            id="customer_email"
                            type="email"
                            value={customerInfo?.email || ''}
                            onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                            placeholder="john.doe@example.com"
                            required
                            disabled={shareLoading}
                        />
                    </div>
                    <div>
                        <Label htmlFor="customer_phone">Phone</Label>
                        <Input
                            id="customer_phone"
                            type="tel"
                            value={customerInfo?.phone || ''}
                            onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                            placeholder="(555) 123-4567"
                            disabled={shareLoading}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="customer_company">Company (Optional)</Label>
                        <Input
                            id="customer_company"
                            value={customerInfo?.company || ''}
                            onChange={(e) => setCustomerInfo(prev => ({...prev, company: e.target.value}))}
                            placeholder="ABC Company Inc."
                            disabled={shareLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quote_notes">Notes for Customer (Optional)</Label>
                    <Textarea
                        id="quote_notes"
                        value={quoteNotes || ''}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        placeholder="Add any special notes or customizations for this quote..."
                        rows={3}
                        disabled={shareLoading}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default CustomerInfoForm;