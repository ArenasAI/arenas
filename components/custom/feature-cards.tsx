"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface Feature {
  title: string
  description: string[]
}

const features: Feature[] = [
  {
    title: "Open Source AI",
    description: [
      "Access powerful models customized for complex data analysis",
      "Use your own API key",
      "Contribute to our codebase",
    ],
  },
  {
    title: "Interactive Visualizations",
    description: [
      "Create stunning visualizations with Plotly and other tools",
      "Intuitive drag-and-drop interface",
      "Real-time collaboration features",
    ],
  },
  {
    title: "Seamless Integration",
    description: [
      "Easy integration with existing workflows",
      "Support for multiple data sources",
      "Scalable architecture for growing needs",
    ],
  },
]

export default function FeatureCards() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <section className="w-full py-20">
      <div className="container px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card
                className={`group relative h-[100px] overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/60 cursor-pointer
                  ${expandedIndex === index ? "h-auto" : ""}`}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    <motion.div animate={{ rotate: expandedIndex === index ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown className="h-5 w-5 text-white/70" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {expandedIndex === index && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 space-y-3 overflow-hidden"
                      >
                        {feature.description.map((item, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center text-sm text-gray-400 transition-colors group-hover:text-gray-300"
                          >
                            <span className="mr-2 h-1 w-1 rounded-full bg-blue-500/70" />
                            {item}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
                <div className="absolute -bottom-1/2 -right-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-transparent blur-3xl transition-opacity duration-500 group-hover:opacity-70" />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
