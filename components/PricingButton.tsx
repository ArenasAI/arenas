'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { showNotification } from './Notifications';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PricingButtonProps {
  priceId?: string;
  buttonText: string;
  className?: string;
  plan: string;
}

export default function PricingButton({ priceId, buttonText, className, plan }: PricingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        localStorage.setItem('intended_plan', plan);
        router.push('/signin');
        return;
      }

      if (plan === 'free') {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.user.id,
            plan: 'free',
            status: 'active',
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        
        showNotification('Successfully signed up for free plan', 'success');
        router.push('/dashboard');
        return;
      }

      if (!priceId) {
        throw new Error('Price ID is not defined');
      }
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        throw stripeError;
      }

    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      showNotification(err instanceof Error ? err.message : 'An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
      onClick={handleSubscription}
      disabled={loading}
      className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {loading ? 'Processing...' : buttonText}
    </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
