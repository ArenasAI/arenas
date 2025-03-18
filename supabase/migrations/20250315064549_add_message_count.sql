alter table messages add column user_id uuid references auth.users(id);
create index idx_messages_user_id_created_at on messages(user_id, created_at);