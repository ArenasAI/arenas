"use client"

import { Newsletter } from '@/components/newsletter'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Footer from '@/components/footer'
import FeatureCards from './custom/feature-cards'

export default function Hero() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container max-w-2xl mx-auto text-center space-y-12"
        >
          <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            data science just got easier.
          </h1>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Introducing,{" "}
            <span className="text-blue-600 dark:text-blue-400">ArenasAI</span>
            </h2>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            AI-Powered Data Scientist
            </h2>
          </div>
          
          <div className="pt-8">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full text-lg font-medium transition-all hover:opacity-90"
            >
              try it now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
    </section>

      {/* Newsletter Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Newsletter />
        </div>
      </section>

      <Footer />
    </div>
  )
}