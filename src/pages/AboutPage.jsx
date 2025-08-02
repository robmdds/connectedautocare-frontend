import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Award, Clock, CheckCircle, Target, Heart, Zap, Car, Home } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const AboutPage = () => {
  const stats = [
    { number: "50,000+", label: "Happy Customers", icon: Users },
    { number: "25,000+", label: "Claims Processed", icon: CheckCircle },
    { number: "98%", label: "Satisfaction Rate", icon: Award },
    { number: "24/7", label: "Customer Support", icon: Clock }
  ]

  const values = [
    {
      icon: Shield,
      title: "Protection First",
      description: "We prioritize comprehensive protection for our customers' most valuable assets with industry-leading coverage options."
    },
    {
      icon: Heart,
      title: "Customer Care",
      description: "Every customer interaction is guided by genuine care and commitment to providing exceptional service and support."
    },
    {
      icon: Target,
      title: "Precision & Accuracy",
      description: "Our advanced rating systems and professional processes ensure accurate pricing and reliable service delivery."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously innovate our technology and services to provide the best possible customer experience."
    }
  ]

  const commitments = [
    {
      icon: Heart,
      title: "Exceptional Service",
      description: "Our mission is simple: to provide exceptional service, versatile coverage options, and unwavering dedication to quality in every plan we offer."
    },
    {
      icon: Users,
      title: "High-Level Customer Care",
      description: "Driven by a high-level commitment to customer care, we ensure that every interaction you have with us exceeds your expectations. From initial inquiries to ongoing support, our knowledgeable and friendly team is dedicated to providing personalized attention and assistance every step of the way."
    },
    {
      icon: Target,
      title: "Versatile Coverage Plans",
      description: "Recognizing that no two drivers are alike, we've built our versatile selection of coverage plans to fit a wide array of needs and lifestyles. Whether you're seeking comprehensive protection, tailored coverages for specific concerns, or affordable basic options, Connected Auto Care has you covered."
    },
    {
      icon: Shield,
      title: "Quality Coverage",
      description: "Above all, our dedication to quality coverage means peace of mind for you. We carefully select and continuously evaluate our plans and partners, ensuring that you receive reliable, effective, and hassle-free coverage whenever and wherever you need it."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30">
                About ConnectedAutoCare
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold">
                Professional Protection, Personal Service
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto">
                We're dedicated to providing comprehensive protection plans with industry-leading service, 
                competitive rates, and the peace of mind you deserve.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover text-center">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold">Our Mission</h2>
                <p className="text-xl text-muted-foreground">
                  To provide comprehensive, affordable protection plans that give our customers peace of mind 
                  and financial security when they need it most.
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg">
                  At ConnectedAutoCare.com, we believe that everyone deserves access to professional protection 
                  plans without the complexity and high costs traditionally associated with insurance products.
                </p>
                <p className="text-lg">
                  Our team of licensed professionals works tirelessly to deliver exceptional service, 
                  competitive pricing, and comprehensive coverage options that protect what matters most to our customers.
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Licensed & Professional</h3>
                  <p className="text-muted-foreground">Fully licensed administrators and professional service team</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-primary/5 rounded-2xl p-8">
                <div className="aspect-square bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center space-x-2">
                      <Car className="h-8 w-8 text-primary" />
                      <Home className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Vehicle & Home Protection</h3>
                    <p className="text-muted-foreground">Protecting your journey and your destination</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Our Core Values</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The principles that guide everything we do and every decision we make for our customers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover h-full text-center">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Commitment Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-6 mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">Our Commitment to You</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <p className="text-xl text-muted-foreground leading-relaxed">
                At Connected Auto Care, we understand that protecting your vehicle and your Home means protecting your journey and your destination.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commitments.map((commitment, index) => (
              <motion.div
                key={commitment.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                        <commitment.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{commitment.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{commitment.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Closing Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Card className="max-w-4xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <div className="space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary">Choose Connected Auto Care</h3>
                  <p className="text-lg text-muted-foreground font-medium">
                    Because your peace of mind deserves a partner committed to excellence.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Experience the Difference?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Join thousands of satisfied customers who trust ConnectedAutoCare.com for their protection needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge className="bg-white/20 text-white border-white/30 text-lg px-6 py-2">
                Professional • Reliable • Affordable
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage