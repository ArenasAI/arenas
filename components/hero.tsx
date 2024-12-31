"use client"

import { Newsletter } from '@/components/newsletter'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container max-w-2xl text-center space-y-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            data science just got easier
          </h1>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Introducing, {" "}
            <span className="bg-blue-600 inset-x-0 translate-y-10 -rotate-10">ArenasAI</span>
          </h1>
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

      {/* Features Section */}
      {/* <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-2">🤖 AI Models</h3>
              <p className="text-muted-foreground">
                Integrate with Ollama and Qwen 2.5 for powerful AI capabilities
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-2">📊 Data Visualization</h3>
              <p className="text-muted-foreground">
                Create interactive charts and graphs with Plotly
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-2">⚡ Real-time Analysis</h3>
              <p className="text-muted-foreground">
                Process and visualize data in real-time
              </p>
            </div>
          </motion.div>
        </div>
      </section> */}

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
    </div>
  )
}
