-- Admin-only complaint deletion. Child audit, forwarding, feedback and closure
-- records are removed by the complaints foreign-key cascade.
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

  -- Collect every evidence object before the complaint cascade removes the
  -- related status/closure rows.
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

  -- Storage objects are not covered by relational ON DELETE CASCADE.
  if cardinality(v_paths) > 0 then
    delete from storage.objects
    where bucket_id = 'complaints' and name = any(v_paths);
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.delete_complaint(bigint) to authenticated;
