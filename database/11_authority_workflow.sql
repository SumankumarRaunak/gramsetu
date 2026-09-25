-- ============================================================
-- 11 - DIRECT AUTHORITY ROUTING + SLA ESCALATION
-- Run after 08_closure_verification.sql and 10_backfill_submitter_snapshot.sql.
-- Safe to re-run.
-- ============================================================

alter table public.authorities add column if not exists village text not null default '';
alter table public.authorities add column if not exists panchayat text not null default '';
alter table public.authorities add column if not exists block text not null default '';
alter table public.authorities add column if not exists district text not null default '';
alter table public.complaints add column if not exists authority_due_at timestamptz;
create index if not exists idx_complaints_authority_due on public.complaints (authority_due_at)
  where authority_due_at is not null;

create or replace function public.initial_panchayat_authority(
  p_village text, p_panchayat text, p_block text, p_district text
) returns uuid language sql stable security definer set search_path = public as $$
  select a.id
  from public.authorities a
  where a.is_active and a.role = 'PANCHAYAT'
    and (
      (
        (nullif(trim(a.village), '') is null or lower(trim(a.village)) = lower(trim(coalesce(p_village, ''))))
        and (nullif(trim(a.panchayat), '') is null or lower(trim(a.panchayat)) = lower(trim(coalesce(p_panchayat, ''))))
        and (nullif(trim(a.block), '') is null or lower(trim(a.block)) = lower(trim(coalesce(p_block, ''))))
        and (nullif(trim(a.district), '') is null or lower(trim(a.district)) = lower(trim(coalesce(p_district, ''))))
      )
      or (nullif(trim(a.village), '') is null and nullif(trim(a.panchayat), '') is null
          and nullif(trim(a.block), '') is null and nullif(trim(a.district), '') is null)
    )
  order by
    (case when nullif(trim(a.village), '') is not null then 1 else 0 end
     + case when nullif(trim(a.panchayat), '') is not null then 1 else 0 end
     + case when nullif(trim(a.block), '') is not null then 1 else 0 end
     + case when nullif(trim(a.district), '') is not null then 1 else 0 end) desc,
    a.name
  limit 1;
$$;

create or replace function public.assign_initial_panchayat()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_authority public.authorities%rowtype;
begin
  select * into v_authority from public.authorities
  where id = public.initial_panchayat_authority(new.village, new.panchayat, new.block, new.district);
  if found then
    update public.complaints set status = 'ASSIGNED', current_authority_id = v_authority.id,
      current_authority_name = v_authority.name, authority_due_at = now() + interval '7 days', updated_at = now()
    where id = new.id;
    insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
    values (new.id, 'ASSIGNED', 'Complaint assigned directly to Gram Panchayat Sachiv for local verification.', 'System', 'System');
    insert into public.complaint_forwarding
      (complaint_id, forwarded_by, forwarded_by_name, forwarded_to, forwarded_to_name, remarks, recipient_email, email_status)
    values (new.id, null, 'System', v_authority.id, v_authority.name,
      'New complaint assigned to the local Gram Panchayat Sachiv.', v_authority.email, 'PENDING');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_initial_panchayat on public.complaints;
drop trigger if exists trg_z_assign_initial_panchayat on public.complaints;
create trigger trg_z_assign_initial_panchayat after insert on public.complaints
for each row execute function public.assign_initial_panchayat();

create or replace function public.verify_complaint(p_complaint_id bigint, p_remarks text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_complaint public.complaints%rowtype; v_authority uuid := public.current_authority_id();
  v_actor text := coalesce(public.current_authority_name(), 'System Admin');
begin
  select * into v_complaint from public.complaints where id = p_complaint_id;
  if not found then raise exception 'Complaint not found'; end if;
  if not (public.is_admin() or v_authority = v_complaint.current_authority_id) then
    raise exception 'Only the current authority or an admin can verify this complaint';
  end if;
  if v_complaint.status in ('REJECTED', 'CLOSED') then raise exception 'This complaint cannot be verified'; end if;
  update public.complaints set status = 'VERIFIED', updated_at = now() where id = p_complaint_id;
  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (p_complaint_id, 'VERIFIED', coalesce(nullif(p_remarks, ''), 'Complaint verified by ' || v_actor),
    v_actor, case when public.is_admin() then 'Admin' else 'Authority' end);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.reject_complaint(p_complaint_id bigint, p_remarks text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_complaint public.complaints%rowtype; v_authority uuid := public.current_authority_id();
  v_actor text := coalesce(public.current_authority_name(), 'System Admin');
begin
  select * into v_complaint from public.complaints where id = p_complaint_id;
  if not found then raise exception 'Complaint not found'; end if;
  if not (public.is_admin() or v_authority = v_complaint.current_authority_id) then
    raise exception 'Only the current authority or an admin can reject this complaint';
  end if;
  update public.complaints set status = 'REJECTED', updated_at = now() where id = p_complaint_id;
  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (p_complaint_id, 'REJECTED', coalesce(nullif(p_remarks, ''), 'Complaint rejected by ' || v_actor),
    v_actor, case when public.is_admin() then 'Admin' else 'Authority' end);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.escalate_overdue_complaints()
returns integer language plpgsql security definer set search_path = public as $$
declare v_complaint public.complaints%rowtype; v_next uuid; v_target public.authorities%rowtype; v_count integer := 0;
begin
  for v_complaint in select * from public.complaints where authority_due_at <= now()
    and status in ('ASSIGNED', 'VERIFIED', 'IN_PROGRESS', 'FORWARDED') and current_authority_id is not null loop
    v_next := public.next_higher_authority_id(v_complaint.current_authority_id);
    if v_next is null then continue; end if;
    select * into v_target from public.authorities where id = v_next and is_active;
    if not found then continue; end if;
    update public.complaints set status = 'FORWARDED', current_authority_id = v_target.id,
      current_authority_name = v_target.name, authority_due_at = now() + interval '7 days', updated_at = now()
    where id = v_complaint.id;
    insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
    values (v_complaint.id, 'FORWARDED', 'SLA expired. Automatically escalated to ' || v_target.name || '.', 'System', 'System');
    insert into public.complaint_forwarding
      (complaint_id, forwarded_by, forwarded_by_name, forwarded_to, forwarded_to_name, remarks, recipient_email, email_status)
    values (v_complaint.id, v_complaint.current_authority_id, v_complaint.current_authority_name,
      v_target.id, v_target.name, 'Automatic escalation after the 7-day SLA expired.', v_target.email, 'PENDING');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Supabase projects with pg_cron enabled will run escalation every 15 minutes.
do $$
begin
  execute 'create extension if not exists pg_cron with schema extensions';
  if exists (select 1 from cron.job where jobname = 'escalate-overdue-complaints') then
    perform cron.unschedule('escalate-overdue-complaints');
  end if;
  perform cron.schedule('escalate-overdue-complaints', '*/15 * * * *', 'select public.escalate_overdue_complaints();');
exception when others then
  raise notice 'pg_cron unavailable; schedule public.escalate_overdue_complaints() manually: %', sqlerrm;
end $$;

grant execute on function public.escalate_overdue_complaints() to service_role;
