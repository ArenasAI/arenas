create table if not exists file_uploads (
    id uuid primary key default uuid_generate_v4(),
    chat_id uuid not null references public.chats(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    file_name text not null,
    file_size bigint not null,
    file_type text not null,
    file_url text not null,
    metadata jsonb default '{}' not null,
    created_at timestamp with time zone default timezone('utc', now()) not null,
    updated_at timestamp with time zone default timezone('utc', now()) not null,
    is_spreadsheet boolean default false,
    processing_status text default 'pending'
);

-- Enable RLS on file_uploads

ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_uploads
CREATE POLICY "Users can insert their own files"
    ON file_uploads
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own files"
    ON file_uploads
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
    ON file_uploads
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
    ON file_uploads
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);