-- Reuse & Connect — migration 004: listing photos
-- Run AFTER migration-003-auth-edit-delete.sql.
-- Adds one optional public listing photo to Food, Resource and Event posts.

alter table food_posts add column if not exists image_url text;
alter table resource_posts add column if not exists image_url text;
alter table events add column if not exists image_url text;

-- Public read allows normal users to view listing photos. Upload/delete is performed
-- only by our authenticated server API using the Supabase service-role key.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('post-images', 'post-images', true)
    on conflict (id) do update set public = true;
  end if;
end $$;
