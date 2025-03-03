-- Add subscription tracking

CREATE TABLE IF NOT EXISTS public.user_subscriptions(
    user_id UUID REFERENCES public.users(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- policies

CREATE POLICY "Users can view their own subscriptons"
    ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id)