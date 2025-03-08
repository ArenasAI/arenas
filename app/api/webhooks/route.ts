import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import createClient from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('Stripe-Signature');

    if (!signature) {
        return new Response('No signature found', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const supabase = await createClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                
                await supabase
                    .from('user_subscriptions')
                    .upsert({
                        user_id: session.metadata?.userId,
                        stripe_subscription_id: session.subscription as string,
                        stripe_customer_id: session.customer as string,
                        price_id: session.metadata?.plan,
                        status: 'active',
                    });
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                if (invoice.subscription) {
                    await supabase
                        .from('user_subscriptions')
                        .update({
                            status: 'active',
                            current_period_end: new Date(invoice.period_end * 1000)
                        })
                        .eq('stripe_subscription_id', invoice.subscription);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await supabase
                    .from('user_subscriptions')
                    .update({
                        status: 'canceled',
                        canceled_at: new Date()
                    })
                    .eq('stripe_subscription_id', subscription.id);
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Webhook handler failed', { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};