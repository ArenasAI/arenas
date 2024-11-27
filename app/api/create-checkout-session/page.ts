import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe, createStripeCustomer, getStripeCustomerId, createCheckoutSession } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user;
    
    // Get or create Stripe customer
    let customerId = await getStripeCustomerId(user.id);
    
    if (!customerId) {
      customerId = await createStripeCustomer(user.email!);
      // TODO: Save customerId to your database
    }

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      priceId,
      customerId,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Error creating checkout session', { status: 500 });
  }
}
