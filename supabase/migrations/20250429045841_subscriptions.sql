CREATE TABLE IF NOT EXISTS public.subscriptions(
    user_id UUID REFERENCES public.users(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

alter table public.subscriptions enable row level security;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for creating subscriptions (INSERT)
CREATE POLICY "Users can create their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can upgrade their subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for deleting subscriptions (DELETE)
CREATE POLICY "Users can delete their own subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);