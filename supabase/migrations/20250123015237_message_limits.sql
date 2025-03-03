-- Add message tracking table
CREATE TABLE IF NOT EXISTS public.user_message_counts (
    user_id UUID REFERENCES auth.users(id),
    free_messages_used INT DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Add RLS policies
ALTER TABLE public.user_message_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own message counts"
    ON public.user_message_counts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER handle_updated_at_message_counts
    BEFORE UPDATE ON public.user_message_counts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
