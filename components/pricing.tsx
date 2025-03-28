"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { PRICING_TIERS } from "@/utils/constants"
import { Check, Mail } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<number | null>(null)
  
  const toggleBillingCycle = () => {
    setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')
  }

  const handleSubscribe = async (tier: string, index: number) => {
    try {
      setLoading(index)
      
      // Get the selected tier's price ID
      const selectedTier = PRICING_TIERS[billingCycle].find(t => t.title === tier)
      if (!selectedTier?.priceId) {
        throw new Error(`No price ID found for tier: ${tier}`)
      }

      console.log('Using price ID:', selectedTier.priceId) // Debug log

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId: selectedTier.priceId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Stripe API error:', error) // Debug log
        throw new Error(error.error || 'Failed to create checkout session')
      }
      
      const { url } = await response.json()
      window.location.href = url
      
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10" />
      
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -left-24 w-72 h-72" />
      <div className="absolute -bottom-24 right-1/3 w-80 h-80" />
      
      <div className="max-w-4xl mx-auto text-center pt-20 px-4">
        
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
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 pb-20">
        {PRICING_TIERS[billingCycle].slice(0, 2).map((tier, index) => (
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
              <CardHeader className="py-6 text-center">
                <h3 className="text-2xl font-bold">{tier.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4 pb-3 flex-grow flex flex-col">
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold">${tier.price}</span>
                </div>
                
                <div className="space-y-3 flex-grow">
                  {tier.features.slice(0, 5).map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 pb-6">
                <Button 
                  className={`w-full rounded-xl py-5 text-lg font-bold ${
                    index === 1 ? 'bg-primary hover:bg-primary/90' : ''
                  }`}
                  variant={index === 1 ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSubscribe(tier.title, index)}
                  disabled={loading === index}
                >
                  {loading === index ? 'Loading...' : index === 1 ? 'Get Started' : 'Subscribe'}
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
        <div className="bg-card border rounded-3xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-3">Need a custom plan?</h2>
          <p className="text-muted-foreground mb-4">
            Contact us for enterprise solutions and custom pricing.
          </p>
          <Button variant="outline" size="lg" className="hover:bg-primary hover:text-white transition-colors">
            <Mail className="h-5 w-5 mr-2"/>
            Contact Sales
          </Button>
        </div>
      </motion.div>
      
    </div>
  )
}

