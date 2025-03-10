alter table if exists user_subscriptions
add column if not exists stripe_price_id text;
