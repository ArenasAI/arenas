import Stripe from 'stripe';
import { getUserById } from './cached/cached-queries';
import createClient from '@/lib/supabase/server';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-02-24.acacia',
});

// Map pricing tiers to Stripe price IDs
export const STRIPE_PRICE_IDS = {
    'Student': {
        monthly: process.env.STRIPE_STUDENT_PRICE_ID,
        annual: process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID,
    },
    'Pro': {
        monthly: process.env.STRIPE_PRO_PRICE_ID,
        annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    },
    'Team': {
        monthly: process.env.STRIPE_TEAM_PRICE_ID,
        annual: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
    }
};

export async function getUserSubscription(userId: string) {
    try {
        const supabase = await createClient();
        const { data: subscriptionData } = await supabase
            .from('user_subscriptions')
            .select('stripe_subscription_id, stripe_customer_id, status, price_id')
            .eq('user_id', userId)
            .single();
        
        if (!subscriptionData?.stripe_subscription_id) return null;
        
        const subscription = await stripe.subscriptions.retrieve(
            subscriptionData.stripe_subscription_id
        );
        
        return {
            ...subscriptionData,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
}

export async function checkUserSubscription(userId: string) {
    const user = await getUserById(userId);
    const subscription = await stripe.subscriptions.retrieve(user.id);
    return subscription;
}

export async function getOrCreateCustomer(userId: string, email: string) {
    const supabase = await createClient();
    
    const { data: userData } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

    if (userData?.stripe_customer_id) {
        return userData.stripe_customer_id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
        email,
        metadata: {
            userId
        }
    });

    // Store customer ID
    await supabase
        .from('user_subscriptions')
        .insert({
            user_id: userId,
            stripe_customer_id: customer.id
        });

    return customer.id;
}
