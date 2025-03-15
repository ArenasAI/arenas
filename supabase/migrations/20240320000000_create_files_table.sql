-- Create a single table for file data and context
create table if not exists public.files (
  id uuid default uuid_generate_v4() primary key,
  hash text unique,
  reference text unique,
  url text,
  path text,
  content_type text,
  context text,
  table_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for faster lookups
create index if not exists idx_files_hash on public.files(hash);
create index if not exists idx_files_reference on public.files(reference);

-- Add RLS policies
alter table public.files enable row level security;

-- Allow read access to authenticated users
create policy "Allow read access to authenticated users"
  on public.files for select
  to authenticated
  using (true);

-- Allow insert/update access to authenticated users
create policy "Allow insert/update access to authenticated users"
  on public.files for insert
  to authenticated
  with check (true);

create policy "Allow update access to authenticated users"
  on public.files for update
  to authenticated
  using (true);

-- Function to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger handle_updated_at
  before update on public.files
  for each row
  execute function public.handle_updated_at(); 