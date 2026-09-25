-- Storage API deletion hardening.
-- Run after 13_authority_handoff_and_storage.sql in Supabase SQL Editor.
-- The database removes relational complaint data and returns evidence paths;
-- the authenticated client removes those objects through the Storage API.

create or replace function public.delete_complaint(p_complaint_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paths text[];
begin
  if not public.is_admin() then
    raise exception 'Only an admin can delete complaints';
  end if;

  select coalesce(array_agg(distinct path), '{}'::text[])
    into v_paths
  from (
    select nullif(photo_url, '') as path from public.complaints where id = p_complaint_id
    union all
    select nullif(s.photo_url, '') from public.complaint_status s where s.complaint_id = p_complaint_id
    union all
    select nullif(k.photo_url, '') from public.complaint_closure k where k.complaint_id = p_complaint_id
    union all
    select nullif(k.video_url, '') from public.complaint_closure k where k.complaint_id = p_complaint_id
  ) evidence
  where path is not null;

  delete from public.complaints where id = p_complaint_id;
  if not found then
    raise exception 'Complaint not found';
  end if;

  return jsonb_build_object('ok', true, 'paths', to_jsonb(v_paths));
end;
$$;

grant execute on function public.delete_complaint(bigint) to authenticated;

drop policy if exists "complaints admin delete" on storage.objects;
create policy "complaints admin delete" on storage.objects
  for delete using (bucket_id = 'complaints' and public.is_admin());
