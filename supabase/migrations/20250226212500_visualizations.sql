-- Create visualizations table
CREATE TABLE IF NOT EXISTS public.visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    document_id UUID,
    title TEXT NOT NULL,
    config JSONB NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add document reference with optional created_at
ALTER TABLE public.visualizations 
ADD CONSTRAINT fk_document 
FOREIGN KEY (document_id) 
REFERENCES public.documents(id) 
ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own visualizations"
ON public.visualizations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visualizations"
ON public.visualizations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visualizations"
ON public.visualizations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visualizations"
ON public.visualizations
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.visualizations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create index for faster queries
CREATE INDEX idx_visualizations_user_id ON public.visualizations(user_id);
CREATE INDEX idx_visualizations_chat_id ON public.visualizations(chat_id);
