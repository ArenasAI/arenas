import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});

// Create checkout session
export async function POST(req: NextRequest) {
    try {
        // Get user and price ID
        const user = await getSession();
        const { priceId } = await req.json();
        
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!priceId) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        // Check for existing subscription
        const supabase = await createClient();
        const { data: existingSubscription } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (existingSubscription) {
            return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
        }

        // Get or create Stripe customer
        let customerId: string;
        const searchResult = await stripe.customers.search({
            query: `metadata['user_id']:'${user.id}'`,
        });
        
        if (!searchResult.data.length) {
            const newCustomer = await stripe.customers.create({
                email: user.email,
                metadata: { user_id: user.id },
            });
            customerId = newCustomer.id;
        } else {
            customerId = searchResult.data[0].id;
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
            metadata: { userId: user.id },
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            allow_promotion_codes: true,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}

// Cancel subscription
export async function DELETE() {
    try {
        const user = await getSession();
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const { data: subscription, error } = await supabase
            .from('user_subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (error || !subscription?.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        // Cancel at period end
        const updatedSubscription = await stripe.subscriptions.update(
            subscription.stripe_subscription_id, 
            { cancel_at_period_end: true }
        );

        // Update subscription in database
        await supabase
            .from('user_subscriptions')
            .update({ 
                cancel_at_period_end: true,
                cancel_at: updatedSubscription.cancel_at 
                    ? new Date(updatedSubscription.cancel_at * 1000).toISOString() 
                    : null
            })
            .eq('stripe_subscription_id', subscription.stripe_subscription_id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}