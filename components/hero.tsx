"use client"

import { Newsletter } from '@/components/newsletter'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Footer  from '@/components/footer'

export default function Hero() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-lvh px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container max-w-2xl text-center space-y-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            data science just got easier.
          </h1>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Introducing, {" "}
            <span className="text-blue-600 dark:text-blue-400">ArenasAI</span>
          </h1>
          <h1 className='text-3xl md:text-5xl font-bold tracking-tight'>AI-Powered Data Scientist</h1>
          <div className="flex justify-center gap-4 p-10">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-zinc-900/95 text-white px-8 py-4 rounded-full text-lg font-medium transition-all"
            >
              try it now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Newsletter />
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center space-y-12"
          >
            <h2 className="text-3xl font-bold">Why Choose Arenas?</h2>
            <div className="grid gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">Open Source AI</h3>
                <p className="text-muted-foreground">
                  Access powerful models without vendor lock-in
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Interactive Visualization</h3>
                <p className="text-muted-foreground">
                  Create stunning visualizations with Plotly and other tools
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Developer First</h3>
                <p className="text-muted-foreground">
                  Built for data scientists, by data scientists
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    <Footer />
    </div>
  )
}
