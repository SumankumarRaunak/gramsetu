-- ============================================================
-- 02/06 - HELPER FUNCTIONS, TRIGGER FUNCTIONS, TRIGGERS
-- Run AFTER chunk 01. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- Helpers (used by RLS policies and RPCs)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.id = auth.uid()::uuid);
$$;

create or replace function public.current_authority_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.authorities a where a.user_id = auth.uid()::uuid limit 1;
$$;

create or replace function public.current_authority_name()
returns text language sql stable security definer set search_path = public as $$
  select name from public.authorities a where a.user_id = auth.uid()::uuid limit 1;
$$;

-- ------------------------------------------------------------
-- Complaint ID generator: CID2026/09/00125
-- ------------------------------------------------------------
create or replace function public.generate_complaint_id()
returns trigger language plpgsql as $$
declare
  v_citizen text := 'Citizen';
begin
  select coalesce(full_name, 'Citizen') into v_citizen from public.users where id = new.user_id::uuid;
  new.complaint_id := 'CID' || to_char(coalesce(new.created_at, now()), 'YYYY') || '/'
                      || to_char(coalesce(new.created_at, now()), 'MM') || '/'
                      || lpad(nextval('public.complaints_seq')::text, 5, '0');
  return new;
end;
$$;

drop trigger if exists trg_complaints_id on public.complaints;
create trigger trg_complaints_id
before insert on public.complaints
for each row execute function public.generate_complaint_id();

-- ------------------------------------------------------------
-- Seed first timeline event for new complaints
-- ------------------------------------------------------------
create or replace function public.seed_submitted_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (new.id, 'SUBMITTED', 'Citizen submitted complaint', 'Citizen', 'Citizen');
  return new;
end;
$$;

drop trigger if exists trg_complaints_submitted on public.complaints;
create trigger trg_complaints_submitted
after insert on public.complaints
for each row execute function public.seed_submitted_status();

-- ------------------------------------------------------------
-- Keep updated_at fresh
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_complaints_updated on public.complaints;
create trigger trg_complaints_updated
before update on public.complaints
for each row execute function public.touch_updated_at();