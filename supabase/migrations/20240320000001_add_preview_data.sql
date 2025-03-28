-- Add preview_data column to file_uploads table
ALTER TABLE public.file_uploads
ADD COLUMN IF NOT EXISTS preview_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.file_uploads.preview_data IS 'Stores preview information for file attachments including type, name, size, content type, and thumbnail data'; 