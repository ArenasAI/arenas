-- Remove trial_end column
ALTER TABLE public.user_subscriptions 
DROP COLUMN IF EXISTS trial_end;

-- Add cancel-related columns if they don't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancel_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone;

-- Add comment to explain the columns
COMMENT ON COLUMN public.user_subscriptions.cancel_at_period_end IS 'Whether the subscription will be canceled at the end of the current period';
COMMENT ON COLUMN public.user_subscriptions.cancel_at IS 'Timestamp when the subscription will be canceled';
COMMENT ON COLUMN public.user_subscriptions.canceled_at IS 'Timestamp when the subscription was canceled';
