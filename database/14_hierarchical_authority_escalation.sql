-- Strict four-level authority chain:
-- Gram Panchayat Sachiv -> Mukhiya -> BDO -> DM/District Authority.
-- Run after 13_authority_handoff_and_storage.sql.

-- Older seed versions stored the District Magistrate as OFFICER. Normalize
-- that row so BDO and DM remain distinct levels.
update public.authorities
set role = 'DEPARTMENT'
where role = 'OFFICER'
  and (designation ilike '%district%' or designation ilike '%dm%');

create or replace function public.next_higher_authority_id(p_current uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select a.id
  from public.authorities current_authority
  join public.authorities a on a.is_active
  where current_authority.id = p_current
    and (
      (current_authority.role = 'PANCHAYAT' and a.role = 'MUKHIYA')
      or (current_authority.role = 'MUKHIYA' and a.role = 'OFFICER')
      or (current_authority.role = 'OFFICER' and a.role = 'DEPARTMENT')
    )
  order by a.name
  limit 1;
$$;

-- A manual handoff follows the same chain as automatic SLA escalation. An
-- authority can never skip a level, hand a file backwards, or regain access
-- after current_authority_id changes.
create or replace function public.forward_complaint(
  p_complaint_id bigint,
  p_to_authority uuid,
  p_remarks text default ''
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_authority uuid := public.current_authority_id();
  v_sender_name text := coalesce(public.current_authority_name(), 'System Admin');
  v_complaint public.complaints%rowtype;
  v_target public.authorities%rowtype;
  v_next uuid;
  v_fwd bigint;
begin
  select * into v_complaint from public.complaints where id = p_complaint_id;
  if not found then raise exception 'Complaint not found'; end if;

  if not public.is_admin()
     and (v_authority is null or v_authority <> v_complaint.current_authority_id) then
    raise exception 'You are not authorized to forward this complaint';
  end if;
  if v_complaint.status in ('CLOSED', 'REJECTED') then
    raise exception 'This complaint cannot be forwarded';
  end if;

  v_next := public.next_higher_authority_id(v_complaint.current_authority_id);
  if v_next is null or p_to_authority <> v_next then
    raise exception 'A complaint can only be forwarded to the next higher authority';
  end if;

  select * into v_target from public.authorities
  where id = p_to_authority and is_active = true;
  if not found then raise exception 'Target authority not found or inactive'; end if;

  update public.complaints
  set status = 'FORWARDED', current_authority_id = v_target.id,
      current_authority_name = v_target.name,
      authority_due_at = now() + interval '7 days', updated_at = now()
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

  return jsonb_build_object('ok', true, 'forwarding_id', v_fwd,
                            'forwarded_to', v_target.name,
                            'due_at', now() + interval '7 days');
end;
$$;

-- Include every active work state in the SLA worker. The database remains the
-- source of truth and old authorities lose row visibility after handoff.
create or replace function public.escalate_overdue_complaints()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_complaint public.complaints%rowtype;
  v_next uuid;
  v_target public.authorities%rowtype;
  v_count integer := 0;
begin
  for v_complaint in
    select * from public.complaints
    where authority_due_at <= now()
      and status in ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'VERIFIED', 'IN_PROGRESS', 'FORWARDED')
      and current_authority_id is not null
  loop
    v_next := public.next_higher_authority_id(v_complaint.current_authority_id);
    if v_next is null then continue; end if;
    select * into v_target from public.authorities where id = v_next and is_active;
    if not found then continue; end if;

    update public.complaints
    set status = 'FORWARDED', current_authority_id = v_target.id,
        current_authority_name = v_target.name,
        authority_due_at = now() + interval '7 days', updated_at = now()
    where id = v_complaint.id;

    insert into public.complaint_status
      (complaint_id, status, remarks, changed_by, changed_by_role)
    values
      (v_complaint.id, 'FORWARDED',
       'SLA expired. Automatically escalated to ' || v_target.name || '.',
       'System', 'System');

    insert into public.complaint_forwarding
      (complaint_id, forwarded_by, forwarded_by_name, forwarded_to, forwarded_to_name,
       remarks, recipient_email, email_status)
    values
      (v_complaint.id, v_complaint.current_authority_id,
       v_complaint.current_authority_name, v_target.id, v_target.name,
       'Automatic escalation after the 7-day SLA expired.', v_target.email, 'PENDING');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.next_higher_authority_id(uuid) from anon, public;
grant execute on function public.next_higher_authority_id(uuid) to authenticated;
revoke execute on function public.escalate_overdue_complaints() from anon, authenticated, public;
grant execute on function public.escalate_overdue_complaints() to service_role;

-- Direct table writes cannot transfer ownership. Only the validated handoff
-- RPC (or an admin) may change current_authority_id.
drop policy if exists "complaints update authority" on public.complaints;
create policy "complaints update authority" on public.complaints
for update to authenticated
using (
  public.is_admin() or current_authority_id = public.current_authority_id()
)
with check (
  public.is_admin() or current_authority_id = public.current_authority_id()
);

do $$
begin
  execute 'create extension if not exists pg_cron with schema extensions';
  if exists (select 1 from cron.job where jobname = 'escalate-overdue-complaints') then
    perform cron.unschedule('escalate-overdue-complaints');
  end if;
  perform cron.schedule('escalate-overdue-complaints', '*/15 * * * *',
                        'select public.escalate_overdue_complaints();');
exception when others then
  raise notice 'pg_cron unavailable; schedule public.escalate_overdue_complaints() manually: %', sqlerrm;
end $$;
