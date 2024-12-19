// app/pricing/page.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      '5 chat sessions per day',
      'Basic data analysis',
      'CSV file support',
      'Community support'
    ],
    buttonText: 'Get Started',
    href: '/chat'
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'For power users and teams',
    features: [
      'Unlimited chat sessions',
      'Advanced data analysis',
      'All file formats supported',
      'Priority support',
      'Custom visualizations',
      'Team collaboration'
    ],
    buttonText: 'Subscribe',
    href: '/api/create-checkout-session',
    featured: true
  }
];

export default function PricingPage() {
  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`p-8 ${
                tier.featured ? 'border-2 border-orange-500' : 'border border-gray-200'
              }`}
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">{tier.name}</h2>
                <p className="mt-2 text-gray-600">{tier.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`mt-8 w-full ${
                  tier.featured 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-50'
                }`}
              >
                <a href={tier.href}>{tier.buttonText}</a>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
