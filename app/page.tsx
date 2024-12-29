import { ArrowRight, BarChart3, Brain, Database, FileText, Zap } from "lucide-react"
import Link from 'next/link'


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Arenas
            </Link>
            
            <div className="flex gap-4 items-center">
              <Link 
                href="/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Login
              </Link>
              <Link 
                href="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Add padding-top to account for fixed nav */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-b from-gray-50 to-white">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Analyze Data with
            <span className="text-blue-600"> AI-Powered</span> Insights
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Transform complex data into actionable insights with Arenas. 
            Built for students, enterprises, and data scientists.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/chat" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Get Started Free
            </Link>
            <a 
              href="/demo" 
              className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Watch Demo
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Powerful Features for Data Analysis
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Brain className="w-6 h-6" />}
                title="AI-Powered Analysis"
                description="Leverage advanced AI models to automatically analyze and interpret your data"
              />
              <FeatureCard 
                icon={<BarChart3 className="w-6 h-6" />}
                title="Interactive Visualizations"
                description="Create stunning visualizations and dashboards to communicate insights effectively"
              />
              <FeatureCard 
                icon={<Database className="w-6 h-6" />}
                title="Data Integration"
                description="Connect and analyze data from multiple sources in one place"
              />
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Built for Everyone
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <UseCaseCard 
                title="Students"
                description="Analyze research data and create compelling visualizations for academic projects"
                link="/students"
              />
              <UseCaseCard 
                title="Enterprises"
                description="Transform business data into actionable insights for better decision making"
                link="/enterprise"
              />
              <UseCaseCard 
                title="Data Scientists"
                description="Accelerate your workflow with AI-powered data analysis tools"
                link="/data-scientists"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Start Analyzing Your Data Today
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of users who are already transforming their data analysis with Arenas.
            </p>
            <a 
              href="/chat" 
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function UseCaseCard({ title, description, link }: {
  title: string
  description: string
  link: string
}) {
  return (
    <Link 
      href={link}
      className="p-6 rounded-xl bg-white hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex items-center text-blue-600">
        Learn more <ArrowRight className="ml-2 w-4 h-4" />
      </div>
    </Link>
  )
} 