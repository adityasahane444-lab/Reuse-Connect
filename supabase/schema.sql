-- Reuse & Connect — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query -> Run)

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  role text not null check (role in ('student', 'teacher', 'individual', 'organization', 'business')),
  green_points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists food_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null,
  quantity text default '',
  location text default '',
  created_at timestamptz not null default now()
);

create table if not exists resource_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null,
  condition text default '',
  price text default 'Free',
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text default '',
  category text default 'Other',
  date text not null,
  time text default '',
  location text default '',
  created_at timestamptz not null default now()
);

create table if not exists event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists points_tx (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Atomically increments a user's green_points (used when awarding points)
create or replace function increment_green_points(p_user_id uuid, p_amount integer)
returns void as $$
begin
  update users set green_points = green_points + p_amount where id = p_user_id;
end;
$$ language plpgsql;

-- All access goes through our own Next.js API routes using the Supabase
-- service role key (server-side only), which bypasses Row Level Security.
-- Enable RLS with no permissive policies so the anon/public key (if ever
-- used) cannot read or write anything directly.
alter table users enable row level security;
alter table sessions enable row level security;
alter table food_posts enable row level security;
alter table resource_posts enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table points_tx enable row level security;
