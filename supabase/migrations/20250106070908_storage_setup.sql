insert into storage.buckets (id, name)
values 
  ('data-files', 'Data Files'),
  ('user-uploads', 'User Uploads'),
  ('model-artifacts', 'Model Artifacts'),
  ('chat-attachments', 'Chat Attachments'),
  ('exports', 'Exports');

-- Set up storage policies
create policy "User can access own files"
  on storage.objects
  for all
  using (auth.uid() = (storage.foldername(name))[1]::uuid);
-- Enable Storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- -- Storage Policies
-- CREATE POLICY "Allow authenticated users to upload files"
-- ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (
--   bucket_id = 'chat_attachments' AND
--   auth.uid() = owner
-- );

-- CREATE POLICY "Allow users to view their own files"
-- ON storage.objects
-- FOR SELECT TO authenticated
-- USING (
--   bucket_id = 'chat_attachments' AND
--   auth.uid() = owner
-- );

-- CREATE POLICY "Allow users to update their own files"
-- ON storage.objects
-- FOR UPDATE TO authenticated
-- USING (
--   bucket_id = 'chat_attachments' AND
--   auth.uid() = owner
-- );

-- CREATE POLICY "Allow users to delete their own files"
-- ON storage.objects
-- FOR DELETE TO authenticated
-- USING (
--   bucket_id = 'chat_attachments' AND
--   auth.uid() = owner
-- );

-- Add more granular storage policies for different bucket types
-- adding for model artifacts and data files.
CREATE POLICY "Users can access data files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'data-files' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can access model artifacts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'model-artifacts' AND auth.uid() = (storage.foldername(name))[1]::uuid);


-- Add RLS to storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 