import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = createClient();
      
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          {
            const subscription = event.data.object as Stripe.Subscription;
            const price = subscription.items.data[0].price;
            const plan = price.nickname?.toLowerCase() || 'unknown';
            
            await supabase
              .from('subscriptions')
              .upsert({
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                stripe_price_id: price.id,
                status: subscription.status,
                plan: plan,
                current_period_start: new Date(subscription.current_period_start * 1000),
                current_period_end: new Date(subscription.current_period_end * 1000),
                updated_at: new Date(),
              }, {
                onConflict: 'stripe_subscription_id'
              });

            // Record in history
            await supabase
              .from('subscription_history')
              .insert({
                subscription_id: subscription.id,
                status: subscription.status,
                plan: plan,
              });
          }
          break;

        case 'customer.subscription.deleted':
          {
            const subscription = event.data.object as Stripe.Subscription;
            
            await supabase
              .from('subscriptions')
              .update({
                status: 'canceled',
                updated_at: new Date(),
              })
              .eq('stripe_subscription_id', subscription.id);

            await supabase
              .from('subscription_history')
              .insert({
                subscription_id: subscription.id,
                status: 'canceled',
                plan: null,
              });
          }
          break;

        case 'customer.subscription.trial_will_end':
          // TODO: Send notification to user about trial ending
          break;

        default:
          throw new Error(`Unhandled relevant event! ${event.type}`);
      }
    } catch (error) {
      console.error(error);
      return new NextResponse('Webhook handler failed', { status: 500 });
    }
  }

  return new NextResponse(JSON.stringify({ received: true }));
}
