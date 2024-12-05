import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing';
  plan: 'free' | 'pro' | 'enterprise';
  current_period_end: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function getSubscription() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setSubscription(null);
          return;
        }

        // TODO: Implement actual subscription fetch from your database
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        
        setSubscription(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    }

    getSubscription();
  }, []);

  return { subscription, loading, error };
}
