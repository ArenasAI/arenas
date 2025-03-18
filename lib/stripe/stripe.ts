import Stripe from 'stripe';
import { getUserById } from '../cached/cached-queries';
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

export async function checkSubscriptionFeatures(userId: string) {
    const subscription = await getUserSubscription(userId);
    return {
        isSubscribed: subscription?.status === 'active',
        features: {
            maxProjects: subscription?.price_id?.includes('pro') ? 100 : 3,
            allowTeamAccess: subscription?.price_id?.includes('team'),
        }
    };
}

// Add this function to check message limits
export async function checkMessageLimit(userId: string) {
  const subscription = await getUserSubscription(userId);
  
  // Pro users have unlimited messages
  if (subscription?.status === 'active') {
    return { canSendMessage: true, remainingMessages: Infinity };
  }

  // Check free tier message count
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const remainingMessages = 10 - (count || 0);
  return {
    canSendMessage: remainingMessages > 0,
    remainingMessages
  };
}
