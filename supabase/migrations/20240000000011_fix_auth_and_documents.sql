-- First, let's fix the documents table to handle updates better
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_pkey CASCADE;

-- Recreate primary key with a more robust structure
ALTER TABLE public.documents
ADD CONSTRAINT documents_pkey 
PRIMARY KEY (id, created_at);

-- Create function to get latest version
CREATE OR REPLACE FUNCTION get_document_latest_version(doc_id UUID)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN (
        SELECT MAX(created_at)
        FROM public.documents
        WHERE id = doc_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to handle document versioning
CREATE OR REPLACE FUNCTION handle_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an update to an existing document
    IF EXISTS (
        SELECT 1 FROM public.documents 
        WHERE id = NEW.id AND user_id = NEW.user_id
    ) THEN
        -- Insert as a new version instead of updating
        INSERT INTO public.documents (
            id,
            user_id,
            title,
            content,
            created_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.title,
            NEW.content,
            NOW()
        );
        RETURN NULL; -- Prevent the original UPDATE
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document versioning
DROP TRIGGER IF EXISTS document_version_trigger ON public.documents;
CREATE TRIGGER document_version_trigger
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION handle_document_version();

-- Add RLS policies to ensure proper access
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
    ON public.documents
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add function to get latest document version
CREATE OR REPLACE FUNCTION get_latest_document(doc_id UUID, auth_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.user_id, d.title, d.content, d.created_at
    FROM public.documents d
    WHERE d.id = doc_id
    AND d.user_id = auth_user_id
    AND d.created_at = get_document_latest_version(d.id);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_documents_user_id') THEN
        CREATE INDEX idx_documents_user_id ON public.documents(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_documents_created_at') THEN
        CREATE INDEX idx_documents_created_at ON public.documents(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_documents_latest_version') THEN
        CREATE UNIQUE INDEX idx_documents_latest_version 
        ON public.documents(id, user_id, created_at DESC);
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_latest_document TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_latest_version TO authenticated; 