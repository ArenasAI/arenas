'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
// import { subscribeToNewsletter } from '@/lib/beehiiv'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })
  
        if (!response.ok) {
          throw new Error('Failed to subscribe')
        }
  
        toast.success('Thanks for subscribing! Check your email to confirm your subscription.')
        setEmail('')
      } catch (error) {
        console.error('Newsletter subscription error:', error)
        toast.error('Failed to subscribe. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

  return (
    <div className="relative overflow-hidden rounded-xl p-8 md:p-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-600/10 rounded-lg">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-600/10 rounded-lg"
          animate={{
            scale: [1, 1.02, 0.99, 1.01, 1],
            rotate: [0, 1, -1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut"
          }}
          />
      </div>

      {/* Content */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
            Open Source AI Models Meet Data Science
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Join our waitlist for early access.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-4"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-background/80 backdrop-blur-sm"
            required
          />
          <Button 
            type="submit" 
            className="h-12 px-8 bg-gray-100"
            disabled={isLoading}
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </motion.form>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid grid-cols-2 gap-4 text-center text-sm text-muted-foreground md:grid-cols-4"
        >
          <div className="rounded-lg bg-background/80 p-4 backdrop-blur-sm">
            <div className="text-2xl">روبوت</div>
            <div>Open Source and Pre-trained Models!</div>
          </div>
          <div className="rounded-lg bg-background/80 p-4 backdrop-blur-sm">
            <div className="text-2xl">📊</div>
            <div>Plotly.jl Charts</div>
          </div>
          <div className="rounded-lg bg-background/80 p-4 backdrop-blur-sm">
            <div className="text-2xl">🔄</div>
            <div>Real-time Analysis</div>
          </div>
          <div className="rounded-lg bg-background/80 p-4 backdrop-blur-sm">
            <div className="text-2xl">🌟</div>
            <div>Free Tier Available</div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p>Join the community of data scientists using open-source AI models</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-emerald-500">●</span> 500+ early subscribers
          </div>
        </motion.div>
      </div>
    </div>
  )
}


