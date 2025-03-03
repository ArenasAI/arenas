-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Indexes for the users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Indexes for the chats table
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at);

-- Indexes for the messages table
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

-- Indexes for the documents table
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_title_gin ON public.documents USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_content_gin ON public.documents USING gin(content gin_trgm_ops);

-- Indexes for the suggestions table
CREATE INDEX IF NOT EXISTS idx_suggestions_document_id ON public.suggestions(document_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_is_resolved ON public.suggestions(is_resolved);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at);

-- Indexes for the votes table
CREATE INDEX IF NOT EXISTS idx_votes_message_id ON public.votes(message_id);
CREATE INDEX IF NOT EXISTS idx_votes_chat_id ON public.votes(chat_id);
CREATE INDEX IF NOT EXISTS idx_votes_message_id ON public.votes(message_id);
CREATE INDEX IF NOT EXISTS idx_votes_composite ON public.votes(message_id, chat_id);

-- Add text search capabilities
-- ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS search_vector tsvector;
-- CREATE INDEX IF NOT EXISTS idx_documents_search_vector ON public.documents USING gin(search_vector);

-- -- Create function to update search vector
-- CREATE OR REPLACE FUNCTION documents_search_vector_trigger() RETURNS trigger AS $$
-- BEGIN
--     NEW.search_vector :=
--         setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
--         setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Create trigger for search vector updates
-- CREATE TRIGGER documents_search_vector_update
--     BEFORE INSERT OR UPDATE ON public.documents
--     FOR EACH ROW
--     EXECUTE FUNCTION documents_search_vector_trigger();

-- Add compression for large text fields
ALTER TABLE public.documents ALTER COLUMN content SET STORAGE EXTENDED;
ALTER TABLE public.messages ALTER COLUMN content SET STORAGE EXTENDED;

-- Add partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_suggestions_unresolved 
    ON public.suggestions(created_at) 
    WHERE NOT is_resolved;
