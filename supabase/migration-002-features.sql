-- Reuse & Connect — migration 002: profiles, discovery, messaging, notifications, moderation
-- Run AFTER schema.sql, in the Supabase SQL Editor. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Users: profile, preferences, moderation flags
-- ---------------------------------------------------------------------------
alter table users add column if not exists avatar_url text;
alter table users add column if not exists bio text not null default '';
alter table users add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table users add column if not exists is_admin boolean not null default false;
alter table users add column if not exists is_banned boolean not null default false;

create index if not exists sessions_user_id_idx on sessions (user_id);

-- ---------------------------------------------------------------------------
-- Listings: status, geolocation, expiry, academic tags
-- ---------------------------------------------------------------------------
alter table food_posts add column if not exists latitude double precision check (latitude between -90 and 90);
alter table food_posts add column if not exists longitude double precision check (longitude between -180 and 180);
alter table food_posts add column if not exists expires_at timestamptz;
alter table food_posts add column if not exists status text not null default 'available'
  check (status in ('available', 'reserved', 'completed'));

alter table resource_posts add column if not exists tags text[] not null default '{}';
alter table resource_posts add column if not exists status text not null default 'available'
  check (status in ('available', 'reserved', 'completed'));

alter table events add column if not exists latitude double precision check (latitude between -90 and 90);
alter table events add column if not exists longitude double precision check (longitude between -180 and 180);

create index if not exists food_posts_status_idx on food_posts (status, created_at desc);
create index if not exists resource_posts_status_idx on resource_posts (status, created_at desc);
create index if not exists resource_posts_tags_idx on resource_posts using gin (tags);

-- ---------------------------------------------------------------------------
-- Exchange requests (someone asks for a listed item; owner accepts; handover completes)
-- ---------------------------------------------------------------------------
create table if not exists exchange_requests (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('food', 'resource')),
  item_id uuid not null,
  item_title text not null,
  owner_id uuid not null references users(id) on delete cascade,
  requester_id uuid not null references users(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (owner_id <> requester_id)
);

-- A person can only have one live request per item
create unique index if not exists exchange_requests_one_active_idx
  on exchange_requests (item_type, item_id, requester_id)
  where status in ('pending', 'accepted');
create index if not exists exchange_requests_owner_idx on exchange_requests (owner_id, created_at desc);
create index if not exists exchange_requests_requester_idx on exchange_requests (requester_id, created_at desc);
create index if not exists exchange_requests_item_idx on exchange_requests (item_type, item_id);

-- ---------------------------------------------------------------------------
-- Ratings (one per participant per completed exchange)
-- ---------------------------------------------------------------------------
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references exchange_requests(id) on delete cascade,
  rater_id uuid not null references users(id) on delete cascade,
  ratee_id uuid not null references users(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (request_id, rater_id),
  check (rater_id <> ratee_id)
);
create index if not exists ratings_ratee_idx on ratings (ratee_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Direct messages (one conversation per pair of users; user_a < user_b keeps pairs unique)
-- ---------------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references users(id) on delete cascade,
  user_b uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index if not exists conversations_user_a_idx on conversations (user_a, last_message_at desc);
create index if not exists conversations_user_b_idx on conversations (user_b, last_message_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade, -- null for system messages
  body text not null check (char_length(body) between 1 and 2000),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text not null default '',
  dedupe_key text unique, -- lets us "insert if not already sent" (e.g. one expiry alert per item)
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Reports (flagged posts) for moderators
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete cascade,
  item_type text not null check (item_type in ('food', 'resource', 'event')),
  item_id uuid not null,
  item_title text not null default '',
  reason text not null,
  status text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  resolved_by uuid references users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, item_type, item_id)
);
create index if not exists reports_status_idx on reports (status, created_at desc);

-- Same security model as before: only our server-side API (service role) touches data.
alter table exchange_requests enable row level security;
alter table ratings enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;

-- ---------------------------------------------------------------------------
-- Avatar storage bucket (public read; uploads only happen through our API)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- To make yourself an admin (run once, with your own email):
--   update users set is_admin = true where email = 'you@example.com';
-- ---------------------------------------------------------------------------
