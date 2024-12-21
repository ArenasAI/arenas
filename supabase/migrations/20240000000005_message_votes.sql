-- Create Votes table
-- Create Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);


CREATE TABLE IF NOT EXISTS public.votes (
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    is_upvoted BOOLEAN NOT NULL,
    -- Set composite primary key
    PRIMARY KEY (chat_id, message_id)
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;


-- Add message policies
CREATE POLICY "Users can view messages from their chats" ON public.messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    );

CREATE POLICY "Users can create messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    ); 

-- Create RLS Policies
CREATE POLICY "Users can view votes on their chats" ON public.votes
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    );

CREATE POLICY "Users can create votes on their chats" ON public.votes
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    );

CREATE POLICY "Users can update votes on their chats" ON public.votes
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    );

CREATE POLICY "Users can delete votes on their chats" ON public.votes
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.chats WHERE id = chat_id
        )
    ); 

