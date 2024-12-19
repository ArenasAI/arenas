-- Initial database setup
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create products table
create table if not exists public.products (
    id text primary key,
    active boolean default true,
    name text,
    description text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create prices table
create table if not exists public.prices (
    id text primary key,
    product_id text references public.products(id),
    active boolean default true,
    currency text,
    interval text check (interval in ('day', 'week', 'month', 'year')),
    interval_count integer,
    unit_amount bigint,
    trial_period_days integer,
    type text check (type in ('one_time', 'recurring'))
);

-- Create customers table
create table if not exists public.customers (
    id uuid references auth.users primary key,
    stripe_customer_id text
);

-- Create subscriptions table
create table if not exists public.subscriptions (
    id text primary key,
    user_id uuid references auth.users not null,
    status text check (status in ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused')),
    metadata jsonb,
    price_id text references public.prices(id),
    quantity integer,
    cancel_at_period_end boolean,
    created timestamp with time zone default timezone('utc'::text, now()) not null,
    current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
    current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
    ended_at timestamp with time zone default timezone('utc'::text, now()),
    cancel_at timestamp with time zone default timezone('utc'::text, now()),
    canceled_at timestamp with time zone default timezone('utc'::text, now()),
    trial_start timestamp with time zone default timezone('utc'::text, now()),
    trial_end timestamp with time zone default timezone('utc'::text, now())
);

-- Create users table with message counting
create table if not exists public.users (
    id uuid references auth.users primary key,
    full_name text,
    email text unique not null,
    messages_count integer default 0,
    is_trial_used boolean default false
);

-- Set up RLS policies
-- Drop existing policies first
drop policy if exists "Allow public read access to products" on public.products;
drop policy if exists "Allow public read access to prices" on public.prices;
drop policy if exists "Allow users to read own customer data" on public.customers;
drop policy if exists "Allow users to read own subscriptions" on public.subscriptions;
drop policy if exists "Allow users to read own user data" on public.users;
drop policy if exists "Allow authenticated users to update their own data" on public.users;
drop policy if exists "Allow authenticated users to increment message count" on public.users;
drop policy if exists "Allow users to insert their own data" on public.users;

-- Enable RLS
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.users enable row level security;

-- Create policies
create policy "Allow public read access to products" on public.products
    for select using (true);

create policy "Allow public read access to prices" on public.prices
    for select using (true);

create policy "Allow users to read own customer data" on public.customers
    for select using (auth.uid() = id);

create policy "Allow users to read own subscriptions" on public.subscriptions
    for select using (auth.uid() = user_id);

create policy "Allow users to read own user data" on public.users
    for select using (auth.uid() = id);

create policy "Allow authenticated users to update their own data" on public.users
    for update using (auth.uid() = id);

create policy "Allow authenticated users to increment message count" on public.users
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Allow users to insert their own data" on public.users
    for insert with check (auth.uid() = id);
