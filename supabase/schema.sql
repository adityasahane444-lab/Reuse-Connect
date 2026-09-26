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
  image_url text,
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
  image_url text,
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
  image_url text,
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
  source_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists points_tx_source_key_idx
  on points_tx (source_key);

-- Atomically records a points transaction and updates the user's balance.
create or replace function apply_points(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_source_key text default null
)
returns void as $$
declare
  inserted_count integer;
begin
  if p_amount = 0 then
    return;
  end if;

  if p_source_key is null then
    insert into points_tx (user_id, amount, reason)
    values (p_user_id, p_amount, p_reason);
  else
    insert into points_tx (user_id, amount, reason, source_key)
    values (p_user_id, p_amount, p_reason, p_source_key)
    on conflict (source_key) do nothing;
  end if;

  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then
    update users
    set green_points = green_points + p_amount
    where id = p_user_id;
  end if;
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
