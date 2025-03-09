import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';
import { TEST_MODE_ENABLED } from '@/utils/constants';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});

export async function cancelSubscription(request: NextRequest & { user: User }) {
    const supabase = await createClient();
    try {
        const user = await getSession();
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .single();

        if (!subscription?.stripe_subscription_id) {
            return new Response('No active subscription found', { status: 400 });
        }

        // Cancel at period end
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return new Response('Error canceling subscription', { status: 500 });
    }
}
