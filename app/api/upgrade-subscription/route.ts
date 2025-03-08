import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PRICING_TIERS } from '@/utils/constants';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const user = await getSession();
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { priceId, plan } = await req.json();

        // Validate plan
        if (!Object.keys(PRICING_TIERS).includes(plan)) {
            return new Response('Invalid plan selected', { status: 400 });
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

        // Update the subscription
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [{
                id: (await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)).items.data[0].id,
                price: priceId,
            }],
            metadata: {
                plan
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        return new Response('Error upgrading subscription', { status: 500 });
    }
}
