-- ============================================================
-- 03/06 - STORAGE BUCKET + POLICIES
-- Run AFTER chunk 02. Safe to re-run.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('complaints', 'complaints', true)
on conflict (id) do nothing;

drop policy if exists "complaints public read" on storage.objects;
create policy "complaints public read" on storage.objects
  for select using (bucket_id = 'complaints');

drop policy if exists "complaints authenticated upload" on storage.objects;
create policy "complaints authenticated upload" on storage.objects
  for insert with check (bucket_id = 'complaints' and auth.role() = 'authenticated');

drop policy if exists "complaints authenticated update" on storage.objects;
create policy "complaints authenticated update" on storage.objects
  for update using (bucket_id = 'complaints' and auth.role() = 'authenticated');