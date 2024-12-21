-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Create auth schema if it doesn't exist (Supabase specific)
CREATE SCHEMA IF NOT EXISTS auth;