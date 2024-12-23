-- Drop existing tables and objects if they exist
DROP TRIGGER IF EXISTS tr_file_version ON public.file_uploads;
DROP FUNCTION IF EXISTS set_file_version();
DROP FUNCTION IF EXISTS get_next_file_version();
DROP TABLE IF EXISTS public.file_uploads;

-- Create the file_uploads table with all required columns and constraints
CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL DEFAULT 'chat_attachments',
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Composite unique constraints
    CONSTRAINT file_uploads_unique_version UNIQUE (bucket_id, storage_path, version),
    CONSTRAINT file_uploads_unique_per_chat UNIQUE (user_id, chat_id, filename, version)
);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_uploads
CREATE POLICY "Users can insert their own files"
ON public.file_uploads
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files"
ON public.file_uploads
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON public.file_uploads
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX file_uploads_user_id_idx ON public.file_uploads(user_id);
CREATE INDEX file_uploads_chat_id_idx ON public.file_uploads(chat_id);
CREATE INDEX file_uploads_created_at_idx ON public.file_uploads(created_at);
CREATE INDEX file_uploads_bucket_path_idx ON public.file_uploads(bucket_id, storage_path);

-- Create versioning function
CREATE OR REPLACE FUNCTION get_next_file_version(
    p_bucket_id TEXT,
    p_storage_path TEXT
) RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM public.file_uploads
    WHERE bucket_id = p_bucket_id 
    AND storage_path = p_storage_path;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Create version trigger function
CREATE OR REPLACE FUNCTION set_file_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version = 1 THEN  -- Only auto-increment if not explicitly set
        NEW.version := get_next_file_version(NEW.bucket_id, NEW.storage_path);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create version trigger
CREATE TRIGGER tr_file_version
    BEFORE INSERT ON public.file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION set_file_version();

-- Storage bucket setup
DO $$
BEGIN
    -- Ensure storage schema is properly configured
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    -- Create or update the chat_attachments bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'chat_attachments',
        'chat_attachments',
        true,
        52428800, -- 50MB
        ARRAY['image/*', 'application/pdf']::text[]
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        public = true,
        file_size_limit = 52428800,
        allowed_mime_types = ARRAY['image/*', 'application/pdf']::text[];

    -- Drop existing storage policies
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

    -- Create new storage policies
    CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'chat_attachments'
        AND (auth.uid() = (storage.foldername(name))[1]::uuid)
    );

    CREATE POLICY "Allow authenticated updates"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'chat_attachments'
        AND (auth.uid() = (storage.foldername(name))[1]::uuid)
    );

    CREATE POLICY "Allow authenticated deletes"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'chat_attachments'
        AND (auth.uid() = (storage.foldername(name))[1]::uuid)
    );

    CREATE POLICY "Allow public downloads"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'chat_attachments');
END $$;

-- Grant necessary permissions
GRANT ALL ON public.file_uploads TO authenticated;
GRANT SELECT ON public.file_uploads TO public;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO public; 