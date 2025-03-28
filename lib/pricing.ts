import { User } from "@supabase/supabase-js";

export interface PricingTier {
    title: string;
    price: string;
    description: string;
    features: string[];
    buttonText?: string;
    priceId?: string;
    link?: string;
    user: User | null;
    index: number;
}

export interface PricingPageProps {
    user: User | null;
}

export type PricingTierData = Omit<PricingTier, "user">;    