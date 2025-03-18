import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import createClient from '@/lib/supabase/server';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

function getStripeClient() {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set');
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia'
    });
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('Stripe-Signature')!;

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Invalid webhook signature', { status: 400 });
  }

  const supabase = await createClient();

  if (relevantEvents.has(event.type)) {
    try {
      const stripe = getStripeClient();
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Fetch subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await supabase.from('user_subscriptions').upsert({
            user_id: session.metadata?.userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
          });

          await supabase.from('user_message_counts').upsert({
            user_id: session.metadata?.userId,
            count: 0,
            last_reset: new Date().toISOString()
          });
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          
          await supabase.from('user_subscriptions').upsert({
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });
          break;
        }
      }
    } catch (error) {
      console.error('Webhook handler error:', error);
      return new NextResponse('Webhook handler failed', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

export const runtime = 'nodejs';