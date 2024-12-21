
-- Add policy for suggestions table as well
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Users can create own suggestions" ON public.suggestions;

CREATE POLICY "Users can view own suggestions" ON public.suggestions
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can create own suggestions" ON public.suggestions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    ); 