import { NextRequest, NextResponse } from 'next/server';
import { checkUserSubscription, getOrCreateCustomer } from '@/lib/stripe';
import { PRICING_TIERS } from '@/utils/constants';
import { getUserSubscription } from '@/lib/stripe';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';
import { Stripe } from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    const user = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if user is subscribed, return the subscription
    const subscription = await checkUserSubscription(user?.data.user?.id!);
    if (subscription) {
        return NextResponse.json({ subscription });
    }

    // if user is not subscribed, create a checkout session
    const stripeSession = await stripe.checkout.sessions.create({
        customer: user.data.user?.id!,
        mode: 'subscription',
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        customer_email: user.data.user?.email!,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}`,
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Arenas Pro',
                    description: 'Unlimited access to all Arenas features',
                },
                unit_amount: 2000,
                recurring: {
                    interval: 'month',
                }
            },
            quantity: 1,
        }],
        metadata: {
            userId: user.data.user?.id!,
        }
    });

    // update user with subscription id
    await supabase.from('users').update({
        subscription_id: stripeSession.id,
    }).eq('id', user.data.user?.id!);

    return NextResponse.json({ session: stripeSession });
}

export async function POST(request: Request) {
    try {
        const { priceId } = await request.json();

        if (!priceId) {
            return NextResponse.json(
                { error: 'Price ID is required' },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/canceled`,
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Error creating checkout session' },
            { status: 500 }
        );
    }
}

