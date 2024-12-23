-- Create the version increment function first
CREATE OR REPLACE FUNCTION public.increment_file_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := (
        SELECT COALESCE(MAX(version), 0) + 1
        FROM public.file_uploads
        WHERE bucket_id = NEW.bucket_id
        AND storage_path = NEW.storage_path
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the file_uploads table
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'data_files',
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB,
    processing_status TEXT DEFAULT 'pending',
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,

    -- Composite unique constraints
    CONSTRAINT file_uploads_unique_version UNIQUE (bucket_id, storage_path, version),
    CONSTRAINT file_uploads_unique_name UNIQUE (user_id, filename, version)
);

-- Create indexes for file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_chat_id ON public.file_uploads(chat_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON public.file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_processing_status ON public.file_uploads(processing_status);

-- Enable RLS on file_uploads
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_uploads
DROP POLICY IF EXISTS "Users can insert their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can view their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can update their own files" ON public.file_uploads;

CREATE POLICY "Users can insert their own files"
    ON public.file_uploads
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files"
    ON public.file_uploads
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
    ON public.file_uploads
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_file_version ON public.file_uploads;
DROP TRIGGER IF EXISTS handle_file_uploads_updated_at ON public.file_uploads;

-- Create triggers
CREATE TRIGGER tr_file_version
    BEFORE INSERT ON public.file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_file_version();

CREATE TRIGGER handle_file_uploads_updated_at
    BEFORE UPDATE ON public.file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();