import { NextRequest, NextResponse } from 'next/server';
import { checkUserSubscription, stripe, getOrCreateCustomer } from '@/lib/stripe';
import { PRICING_TIERS } from '@/utils/constants';
import { getUserSubscription } from '@/lib/stripe';
import { getSession } from '@/lib/cached/cached-queries';
import createClient from '@/lib/supabase/server';

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

        const customerId = await getOrCreateCustomer(user.id, user.email!);

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
            metadata: {
                userId: user.id,
                plan
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                    plan
                }
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return new Response('Error creating checkout session', { status: 500 });
    }
}

