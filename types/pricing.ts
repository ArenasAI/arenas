import { User } from "@supabase/supabase-js";

export interface PricingTierProps {
    title: string,
    price: string,
    prevPrice?: string,
    description: string,
    features?: string[];
    buttonText?: string;
    priceId?: string;
    user: User | null;
    index: number;
    priceUnit?: string;
}

export interface PricingPageProps {
    user: User | null;
}

export type PricingTierData = Omit<PricingTierProps, 'user'>;