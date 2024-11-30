import { User } from "@supabase/supabase-js";

export interface PricingTierProps {
    title: string;
    price: string;
    description: string;
    features?: string[];
    buttonText?: string;
    priceUnit?: string;
    priceId?: string;
    index: number;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    currency: string;
    stripePriceId: string;
}

export const STRIPE_PRICE_IDS = {
    PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    ENTERPRISE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ''
};

export interface PricingPageProps {
    user: User | null;
}

export type PricingTierData = Omit<PricingTierProps, 'user'>;