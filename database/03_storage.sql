-- ============================================================
-- 03/06 - STORAGE BUCKET + POLICIES
-- Run AFTER chunk 02. Safe to re-run.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('complaints', 'complaints', true)
on conflict (id) do nothing;

-- Bucket is public, so individual files stay reachable via their public URL
-- without any SELECT policy. Restricting SELECT to signed-in users prevents
-- anonymous clients from listing every file in the bucket.
drop policy if exists "complaints public read" on storage.objects;
drop policy if exists "complaints authenticated select" on storage.objects;
create policy "complaints authenticated select" on storage.objects
  for select using (
    bucket_id = 'complaints'
    and auth.role() = 'authenticated'
    and owner_id = auth.uid()
  );

drop policy if exists "complaints authenticated upload" on storage.objects;
create policy "complaints authenticated upload" on storage.objects
  for insert with check (bucket_id = 'complaints' and auth.role() = 'authenticated');

drop policy if exists "complaints authenticated update" on storage.objects;
create policy "complaints authenticated update" on storage.objects
  for update using (bucket_id = 'complaints' and auth.role() = 'authenticated');

drop policy if exists "complaints admin delete" on storage.objects;
create policy "complaints admin delete" on storage.objects
  for delete using (bucket_id = 'complaints' and public.is_admin());