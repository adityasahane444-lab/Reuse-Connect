-- Reuse & Connect — migration 003: email verification + owner edit/delete support
-- Run this once AFTER migration-002-features.sql. Safe to re-run.

alter table users add column if not exists email_verified boolean not null default true;
alter table users add column if not exists email_verification_code_hash text;
alter table users add column if not exists email_verification_expires_at timestamptz;
alter table users add column if not exists email_verification_sent_at timestamptz;
alter table users add column if not exists email_verification_attempts integer not null default 0;

create index if not exists users_email_verified_idx on users (email_verified);

-- Existing accounts are marked verified by the default above. New registrations explicitly set false.
-- To make yourself an admin:
-- update users set is_admin = true where email = 'your-email@example.com';
