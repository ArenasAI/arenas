'use client';

import { PricingTierProps } from '@/types/pricing';
import PricingButton from '@/components/PricingButton';
import { STRIPE_PLANS } from '@/config/stripe';

const PricingTier = ({ 
  title, 
  price, 
  description, 
  features, 
  buttonText = "Get Started", 
  priceUnit = "/month",
  priceId,
  index 
}: PricingTierProps) => (
  <div className={`flex flex-col p-6 mx-auto max-w-lg text-center rounded-lg border shadow
    ${index === 1 ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'}`}>
    <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
    <p className="font-light text-gray-500 sm:text-lg">{description}</p>
    <div className="flex justify-center items-baseline my-8">
      <span className="mr-2 text-5xl font-extrabold">{price}</span>
      {price !== "Free" && <span className="text-gray-500">{priceUnit}</span>}
    </div>
    <ul role="list" className="mb-8 space-y-4 text-left">
      {features?.map((feature, i) => (
        <li key={i} className="flex items-center space-x-3">
          <svg 
            className="flex-shrink-0 w-5 h-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <PricingButton
      plan={title.toLowerCase()}
      priceId={priceId}
      buttonText={buttonText}
      className={`w-full px-4 py-3 font-medium rounded-lg text-center
        ${index === 1 
          ? 'text-white bg-blue-600 hover:bg-blue-700' 
          : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
    />
  </div>
);

const Pricing = () => {
  const pricingTiers = [
    {
      title: "Regular",
      price: "Free",
      description: "Best for getting started with Arenas",
      features: [
        "5 analysis requests per day",
        "Basic data visualization",
        "Standard support",
        "Community access",
        "Basic API access"
      ],
      buttonText: "Start Free",
      priceId: STRIPE_PLANS.FREE.priceId,
      index: 0
    },
    {
      title: "Pro",
      price: "$25",
      description: "Perfect for power users and professionals",
      features: [
        "Unlimited analysis requests",
        "Advanced visualizations",
        "Priority support",
        "API access with higher limits",
        "Custom model training",
        "Export in multiple formats"
      ],
      buttonText: "Go Pro",
      priceId: STRIPE_PLANS.PRO.priceId,
      index: 1
    },
    {
      title: "Enterprise Annual",
      price: "$15",
      description: "Best value for teams and businesses",
      features: [
        "All Pro features included",
        "Annual billing ($180/year)",
        "24/7 priority support",
        "Custom integration support",
        "Advanced security features",
        "Dedicated account manager"
      ],
      buttonText: "Contact Sales",
      priceId: STRIPE_PLANS.ENTERPRISE.priceId,
      index: 2
    }
  ];

  return (
    <section className="bg-white">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900">
            Designed for data teams of all sizes
          </h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl">
            Choose the perfect plan for your data analysis needs
          </p>
        </div>
        <div className="space-y-8 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-10 lg:space-y-0">
          {pricingTiers.map((tier) => (
            <PricingTier key={tier.title} {...tier} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
