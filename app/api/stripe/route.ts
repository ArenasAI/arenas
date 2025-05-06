import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';
import { createCheckoutSession, updateSubscription } from '@/lib/stripe/client';

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
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (existingSubscription) {
            return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
        }

        // Create checkout session
        const session = await createCheckoutSession(priceId, user.id, user.email);
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
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (error || !subscription?.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        // Cancel at period end
        await updateSubscription(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}

// Update subscription
export async function PATCH(req: NextRequest) {
    try {
        const user = await getSession();
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { priceId } = await req.json();
        if (!priceId) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (error || !subscription?.stripe_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        // Update subscription
        await updateSubscription(subscription.stripe_subscription_id, {
            price_id: priceId
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update subscription error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}