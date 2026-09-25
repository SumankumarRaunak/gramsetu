-- Authority handoff hardening and seven-day SLA reset.
-- Run after 11_authority_workflow.sql and 12_admin_delete_complaint.sql.

-- Re-declare this here as well so installations that already ran migration 12
-- also get the Storage API deletion contract when this migration is applied.
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
  if not found then raise exception 'Complaint not found'; end if;

  -- Storage objects are removed by the authenticated Storage API client after
  -- this RPC returns their paths; relational SQL must not touch storage.objects.
  return jsonb_build_object('ok', true, 'paths', to_jsonb(v_paths));
end;
$$;

grant execute on function public.delete_complaint(bigint) to authenticated;

-- Authorities need the active higher-tier directory to forward a case. This
-- does not grant complaint access; complaint RLS still limits rows to the
-- current_authority_id.
drop policy if exists "authorities select active directory" on public.authorities;
create policy "authorities select active directory" on public.authorities
for select to authenticated using (is_active = true or public.is_admin());

-- Every manual handoff starts a fresh seven-day clock for the new custodian.
create or replace function public.forward_complaint(
  p_complaint_id bigint,
  p_to_authority uuid,
  p_remarks text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_authority uuid := public.current_authority_id();
  v_sender_name text := coalesce(public.current_authority_name(), 'System Admin');
  v_target public.authorities%rowtype;
  v_complaint public.complaints%rowtype;
  v_fwd bigint;
begin
  select * into v_complaint from public.complaints where id = p_complaint_id;
  if not found then raise exception 'Complaint not found'; end if;

  if not (public.is_admin() or v_authority = v_complaint.current_authority_id) then
    raise exception 'You are not authorized to forward this complaint';
  end if;

  select * into v_target from public.authorities
  where id = p_to_authority and is_active = true;
  if not found then raise exception 'Target authority not found or inactive'; end if;

  update public.complaints
    set status = 'FORWARDED',
        current_authority_id = v_target.id,
        current_authority_name = v_target.name,
        authority_due_at = now() + interval '7 days',
        updated_at = now()
  where id = p_complaint_id;

  insert into public.complaint_status
    (complaint_id, status, remarks, changed_by, changed_by_role)
  values
    (p_complaint_id, 'FORWARDED',
     coalesce(nullif(p_remarks, ''), 'Forwarded to ' || v_target.name),
     v_sender_name, case when public.is_admin() then 'Admin' else 'Authority' end);

  insert into public.complaint_forwarding
    (complaint_id, forwarded_by, forwarded_by_name, forwarded_to, forwarded_to_name,
     remarks, recipient_email, email_status)
  values
    (p_complaint_id, v_authority, v_sender_name, v_target.id, v_target.name,
     coalesce(nullif(p_remarks, ''), ''), v_target.email, 'PENDING')
  returning id into v_fwd;

  return jsonb_build_object('ok', true, 'forwarding_id', v_fwd, 'forwarded_to', v_target.name);
end;
$$;

-- Do not allow an arbitrary authority to write audit rows for another
-- authority's complaint through direct table access.
drop policy if exists "status insert authority" on public.complaint_status;
create policy "status insert authority" on public.complaint_status
for insert to authenticated with check (
  public.is_admin()
  or exists (
    select 1 from public.complaints c
    where c.id::text = complaint_id::text
      and c.current_authority_id = public.current_authority_id()
  )
);

drop policy if exists "fwd insert authority" on public.complaint_forwarding;
create policy "fwd insert authority" on public.complaint_forwarding
for insert to authenticated with check (
  public.is_admin()
  or exists (
    select 1 from public.complaints c
    where c.id::text = complaint_id::text
      and c.current_authority_id = public.current_authority_id()
  )
);

grant execute on function public.forward_complaint(bigint, uuid, text) to authenticated;

-- Covers every handoff path, including citizen-disputed verification cases.
create or replace function public.reset_authority_due_date_on_handoff()
returns trigger
language plpgsql
as $$
begin
  if new.current_authority_id is distinct from old.current_authority_id
     and new.current_authority_id is not null
     and new.authority_due_at is not distinct from old.authority_due_at then
    new.authority_due_at := now() + interval '7 days';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reset_authority_due_on_handoff on public.complaints;
create trigger trg_reset_authority_due_on_handoff
before update on public.complaints
for each row execute function public.reset_authority_due_date_on_handoff();
