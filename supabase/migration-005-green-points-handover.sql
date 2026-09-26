-- Reuse & Connect — migration 005: correct Green Points rules
-- Run AFTER migration-004-post-images.sql. Safe to run more than once.
-- Food/resource points are earned only when the recipient confirms receipt.
-- Event organize/join points remain action-based.
-- Deleting/removing a completed food/resource listing reverses its earned reward once.

alter table points_tx add column if not exists source_key text;

create unique index if not exists points_tx_source_key_idx
  on points_tx (source_key);

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

-- Remove the old posting rewards introduced by the previous rules.
with legacy as (
  select user_id, coalesce(sum(amount), 0) as amount
  from points_tx
  where reason like 'Posted surplus food: %'
     or reason like 'Posted item: %'
  group by user_id
)
update users u
set green_points = u.green_points - legacy.amount
from legacy
where u.id = legacy.user_id;

delete from points_tx
where reason like 'Posted surplus food: %'
   or reason like 'Posted item: %';

-- Recreate valid historical food/resource rewards for already completed handovers.
insert into points_tx (user_id, amount, reason, source_key, created_at)
select
  owner_id,
  case when item_type = 'food' then 50 else 30 end,
  case when item_type = 'food' then 'Food delivered: ' || item_title else 'Item delivered: ' || item_title end,
  'exchange:' || id::text || ':earned',
  coalesce(completed_at, created_at)
from exchange_requests
where status = 'completed'
on conflict (source_key) do nothing;

-- Recalculate balances from the complete ledger so the migration is idempotent.
update users u
set green_points = coalesce((
  select sum(amount)
  from points_tx p
  where p.user_id = u.id
), 0);
