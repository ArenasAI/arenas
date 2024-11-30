export const STRIPE_PRICE_IDS = {
    FREE: '', // Free plan has no price ID
    PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    ENTERPRISE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ''
};

export const STRIPE_PRODUCTS = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
} as const;

export const STRIPE_PLANS = {
    FREE: {
        name: 'Free',
        priceId: '',
    },
    PRO: {
        name: 'Pro',
        priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    },
    ENTERPRISE: {
        name: 'Enterprise',
        priceId: STRIPE_PRICE_IDS.ENTERPRISE_YEARLY,
    }
} as const;
