-- Add subscription status and free message count columns to users table
ALTER TABLE public.users 
ADD COLUMN is_subscribed BOOLEAN DEFAULT false,
ADD COLUMN free_messages_remaining INTEGER DEFAULT 5;

-- Update RLS policy to allow users to read their own subscription status
CREATE POLICY "Users can read own subscription status"
ON public.users
FOR SELECT
TO public
USING (auth.uid() = id);

-- Update RLS policy to allow users to update their own subscription status
CREATE POLICY "Users can update own subscription status"
ON public.users
FOR UPDATE
TO public
USING (auth.uid() = id);

-- Policy to enforce message limit for free users
CREATE POLICY "Limit messages for free users"
ON public.messages
FOR INSERT
TO public
USING (
  (
    -- Allow if user is subscribed
    (SELECT is_subscribed FROM users WHERE id = auth.uid())
    OR
    -- Or if under message limit
    (
      SELECT COUNT(*) < 10
      FROM messages m
      WHERE m.user_id = auth.uid()
    )
  )
);

-- Update the messages table to ensure we track who created the message
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();