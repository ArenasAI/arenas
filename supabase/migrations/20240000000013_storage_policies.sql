-- Enable Storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat_attachments' AND
  auth.uid() = owner
);

CREATE POLICY "Allow users to view their own files"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat_attachments' AND
  auth.uid() = owner
);

CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'chat_attachments' AND
  auth.uid() = owner
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'chat_attachments' AND
  auth.uid() = owner
);

-- Add RLS to storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 