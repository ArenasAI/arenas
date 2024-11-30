import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface Subscription {
    status?: string;
    plan?: string;
    current_period_end?: number | string;
}

export type SubscriptionStatus = {
  isLoading: boolean;
  isError: boolean;
  subscription: {
    status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due' | null;
    plan: 'free' | 'pro' | 'enterprise' | null;
    periodEnd: Date | null;
  };
};

export function useSubscriptionStatus(user: User | null): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isLoading: true,
    isError: false,
    subscription: {
      status: null,
      plan: null,
      periodEnd: null,
    },
  });

  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setStatus({
        isLoading: false,
        isError: false,
        subscription: {
          status: null,
          plan: 'free',
          periodEnd: null,
        },
      });
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setStatus({
          isLoading: false,
          isError: false,
          subscription: {
            status: subscription?.status || null,
            plan: subscription?.plan || 'free',
            periodEnd: subscription?.current_period_end 
              ? new Date(subscription.current_period_end)
              : null,
          },
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
        }));
      }
    };

    fetchSubscription();

    // Set up real-time subscription
    const subscription = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const subscription = payload.new;
          setStatus({
            isLoading: false,
            isError: false,
            const subscription: Subscription = {
              status: subscription?.status || null,
              plan: subscription?.plan || 'free',
              current_period_end: subscription?.current_period_end 
                ? new Date(subscription.current_period_end)
                : null,
            },
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return status;
}
