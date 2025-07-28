import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Contact() {
  // Static contact info - matches your header/footer
  const contactInfo = {
    phone: '1-(866) 660-7003',
    email: 'info@connectedautocare.com', // Match footer email
    support_hours: '24/7'
  };

  const contactMethods = [
    {
      icon: Phone,
      title: 'Call Us',
      value: contactInfo.phone,
      action: `tel:${contactInfo.phone.replace(/[^\d]/g, '')}`,
      description: 'Speak with our experts',
      color: 'bg-blue-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      value: contactInfo.email,
      action: `mailto:${contactInfo.email}`,
      description: 'Get help via email',
      color: 'bg-green-500'
    },
    {
      icon: Clock,
      title: 'Support Hours',
      value: contactInfo.support_hours,
      action: null,
      description: 'Always available',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our protection experts. We're here to help you find the perfect coverage solution.
          </p>
        </motion.div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`${method.color} p-4 rounded-full w-fit mx-auto mb-4`}>
                    <method.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-lg font-semibold mb-4">
                    {method.value}
                  </div>
                  {method.action && (
                    <Button asChild className="w-full">
                      <a href={method.action}>
                        Contact Now
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-primary text-white rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Protected?
          </h2>
          <p className="text-xl mb-6 text-white/90">
            Call us now for an instant quote or expert consultation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
              <a href={`tel:${contactInfo.phone.replace(/[^\d]/g, '')}`}>
                <Phone className="mr-2 h-5 w-5" />
                Call {contactInfo.phone}
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              <a href={`mailto:${contactInfo.email}`}>
                <Mail className="mr-2 h-5 w-5" />
                Email Us
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}