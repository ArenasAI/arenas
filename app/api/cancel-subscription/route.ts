import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const user = await getSession();
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const supabase = await createClient();
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
