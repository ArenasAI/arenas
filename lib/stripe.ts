import Stripe from 'stripe';
import { getUserById } from './cached/cached-queries';
import createClient from '@/lib/supabase/server';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-02-24.acacia',
});

export async function getUserSubscription(userId: string) {
    try {
        // Get user's stripe customer ID from database first
        const supabase = await createClient();
        const { data: subscriptionData } = await supabase
            .from('user_subscriptions')
            .select('stripe_subscription_id, stripe_customer_id, status')
            .eq('user_id', userId)
            .single();
        
        if (!subscriptionData || !subscriptionData.stripe_subscription_id) {
            return null; // No subscription found in our database
        }
        
        // Now use the stored Stripe subscription ID to fetch details
        const subscription = await stripe.subscriptions.retrieve(
            subscriptionData.stripe_subscription_id
        );
        
        return {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        // Don't throw error - gracefully handle it by returning null
        return null;
    }
}

export async function checkUserSubscription(userId: string) {
    const user = await getUserById(userId);
    const subscription = await stripe.subscriptions.retrieve(user.id);
    return subscription;
}
