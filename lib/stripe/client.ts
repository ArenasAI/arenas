import { Stripe } from 'stripe';
import createClient from '@/lib/supabase/server';

let stripeClient: Stripe | null = null;

export function getStripeClient() {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set');
    }
    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-02-24.acacia'
        });
    }
    return stripeClient;
}

export async function getUserSubscription(userId: string) {
    const stripe = getStripeClient();
    
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

export async function getOrCreateCustomer(userId: string, email: string) {
    const stripe = getStripeClient();
    
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