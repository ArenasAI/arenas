"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { dela } from "./ui/fonts"
import { PRICING_TIERS } from "@/utils/constants"
import { Check, X, Sparkles, Zap, BarChart } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  
  const toggleBillingCycle = () => {
    setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')
  }

  // Custom icons for each tier to add visual interest
  const tierIcons = [
    <BarChart className="h-12 w-12 text-blue-500" key="chart" />,
    <Zap className="h-12 w-12 text-amber-500" key="zap" />,
    <Sparkles className="h-12 w-12 text-purple-500" key="sparkles" />
  ]

  return (
    <div className={`${dela.className} min-h-screen relative overflow-hidden`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10" />
      
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -left-24 w-72 h-72" />
      <div className="absolute -bottom-24 right-1/3 w-80 h-80" />
      
      <div className="max-w-4xl mx-auto text-center pt-20 px-4">
        <motion.h1 
          className="text-2xl md:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-blue-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          need a data analysis expert?
        </motion.h1>
        
        {/* Billing toggle with animation */}
        <motion.div 
          className="inline-flex items-center justify-center space-x-4 mb-12 bg-card p-2 rounded-full border shadow-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Label htmlFor="billing-toggle" className={`text-lg px-3 py-2 rounded-full transition-colors ${billingCycle === 'monthly' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
            Monthly
          </Label>
          <Switch 
            id="billing-toggle" 
            checked={billingCycle === 'annual'} 
            onCheckedChange={toggleBillingCycle} 
          />
          <Label htmlFor="billing-toggle" className={`text-lg px-3 py-2 rounded-full flex items-center transition-colors ${billingCycle === 'annual' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
            Annual
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Save 15%
            </span>
          </Label>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 pb-20">
        {PRICING_TIERS[billingCycle].map((tier, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index + 0.5 }}
          >
            <Card 
              className={`border-2 rounded-3xl overflow-hidden h-full flex flex-col ${
                index === 1 
                  ? 'border-primary shadow-xl relative bg-gradient-to-b from-background to-primary/5' 
                  : 'border-muted shadow-md hover:shadow-lg transition-shadow'
              }`}
            >
              {index === 1 && (
                <>
                  <div className="absolute -right-10 top-6 bg-amber-500 text-white text-xs px-4 py-1 rotate-45 transform shadow-sm font-semibold">
                    BEST VALUE
                  </div>
                </>
              )}
              
              <CardHeader className="py-8 text-center">
                <div className="mx-auto mb-4">
                  {tierIcons[index]}
                </div>
                <h3 className="text-2xl font-bold">{tier.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{tier.description}</p>
              </CardHeader>
              
              <CardContent className="pt-6 pb-4 flex-grow flex flex-col">
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  
                  {billingCycle === 'annual' && (
                    <div className="text-sm text-primary mt-2">
                      {`Save $${parseInt(tier.price) * 12 * 0.15} per year`}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 flex-grow min-h-[200px]">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {index === 0 && (
                    <div className="flex items-start text-muted-foreground">
                      <X className="h-5 w-5 shrink-0 mr-2" />
                      <span className="text-sm">No access to latest models</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 pb-8">
                <Button 
                  className={`w-full rounded-xl py-6 text-lg font-bold ${
                    index === 1 ? 'bg-primary hover:bg-primary/90' : ''
                  }`}
                  variant={index === 1 ? "default" : "outline"}
                  size="lg"
                >
                  {index === 1 ? 'Get Started' : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Enterprise section with animation */}
      <motion.div 
        className="max-w-2xl mx-auto text-center pb-20 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="bg-card border rounded-3xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Need a custom plan for your team?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us for enterprise solutions and custom pricing tailored to your organization's needs.
          </p>
          <Button variant="outline" size="lg" className="hover:bg-primary hover:text-white transition-colors">
            Contact Sales
          </Button>
        </div>
      </motion.div>
      
      {/* Testimonial section for social proof */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-12">Trusted by data analysts worldwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Sara L.", title: "Data Scientist", quote: "Arenas has transformed how I analyze datasets. What used to take hours now takes minutes." },
            { name: "Mark T.", title: "Business Analyst", quote: "The visualizations are incredible. My presentations have never looked better." },
            { name: "James K.", title: "Research Lead", quote: "Our entire team relies on Arenas daily. It's become an essential part of our workflow." }
          ].map((testimonial, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 * i + 1 }}
              className="bg-card p-6 rounded-2xl border shadow-sm"
            >
              <div className="flex flex-col h-full">
                <div className="text-primary mb-4">★★★★★</div>
                <p className="text-md mb-4 flex-grow">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

