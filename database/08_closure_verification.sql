-- ============================================================
-- 08/08 - COMPLAINT CLOSURE VERIFICATION SYSTEM
-- Run this chunk AFTER chunk 07 (denormalized columns). Safe to re-run.
--
-- Adds the "Complaint Closure Verification System":
--   * New statuses: VERIFICATION_PENDING, CITIZEN_CONFIRMED, DISPUTED
--   * complaint_closure: complete audit trail (who uploaded evidence,
--     what evidence, location + server timestamp, citizen response,
--     who verified, and when the complaint was finally closed)
--   * submit_for_verification        (officer/authority only)
--   * citizen_respond_verification   (citizen ONLY - own complaint)
--   * admin_close_complaint          (admin / authorized higher authority only)
--   * update_complaint_status now BLOCKS direct RESOLVED/CLOSED so an
--     officer can never permanently close a complaint on their own.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: current authority role
-- ------------------------------------------------------------
create or replace function public.current_authority_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.authorities a where a.user_id = auth.uid()::uuid limit 1;
$$;

-- ------------------------------------------------------------
-- Extend status CHECK constraints (complaints + complaint_status)
-- ------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.complaints'::regclass and contype = 'c'
  loop
    execute format('alter table public.complaints drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.complaints add constraint complaints_status_check check (
  status in ('SUBMITTED','UNDER_REVIEW','VERIFIED','FORWARDED','ASSIGNED','IN_PROGRESS',
             'VERIFICATION_PENDING','CITIZEN_CONFIRMED','DISPUTED','RESOLVED','CLOSED','REJECTED')
);

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.complaint_status'::regclass and contype = 'c'
  loop
    execute format('alter table public.complaint_status drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.complaint_status add constraint complaint_status_status_check check (
  status in ('SUBMITTED','UNDER_REVIEW','VERIFIED','FORWARDED','ASSIGNED','IN_PROGRESS',
             'VERIFICATION_PENDING','CITIZEN_CONFIRMED','DISPUTED','RESOLVED','CLOSED','REJECTED')
);

-- ------------------------------------------------------------
-- complaint_closure: full audit trail of the closure workflow
-- ------------------------------------------------------------
create table if not exists public.complaint_closure (
  id bigint generated always as identity primary key,
  complaint_id bigint not null references public.complaints (id) on delete cascade,
  -- Evidence submitted (officer work completion)
  submitted_by uuid references public.authorities (id) on delete set null,
  submitted_by_name text not null default '',
  submitted_by_role text not null default '',
  photo_url text not null,
  video_url text not null default '',
  location_lat numeric,
  location_lng numeric,
  location_place text not null default '',
  submitted_at timestamptz not null default now(),  -- server timestamp
  -- Citizen verification response
  citizen_id uuid references auth.users (id) on delete set null,
  citizen_response text check (citizen_response in ('CONFIRMED','DISPUTED')),
  citizen_remarks text not null default '',
  citizen_responded_at timestamptz,
  -- Final closure (admin / authorized higher authority)
  verified_by uuid references public.authorities (id) on delete set null,
  verified_by_name text not null default '',
  verified_by_role text not null default '',
  verified_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_closure_complaint on public.complaint_closure (complaint_id, submitted_at desc);

-- ------------------------------------------------------------
-- RLS: complaint_closure (read for related parties only)
-- ------------------------------------------------------------
alter table public.complaint_closure enable row level security;
drop policy if exists "closure select related" on public.complaint_closure;
create policy "closure select related" on public.complaint_closure for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.complaints c
    where c.id::bigint = complaint_id::bigint
      and (c.user_id::uuid = auth.uid()::uuid or c.current_authority_id::uuid = public.current_authority_id())
  )
);

-- ------------------------------------------------------------
-- Helper: resolve the next higher review authority for a dispute
-- ------------------------------------------------------------
create or replace function public.next_higher_authority_id(p_current uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  v_role text;
  v_next uuid;
begin
  select role into v_role from public.authorities where id = p_current::uuid;
  if v_role = 'PANCHAYAT' then
    select id into v_next from public.authorities where is_active and role = 'MUKHIYA' limit 1;
    if found then return v_next; end if;
    select id into v_next from public.authorities where is_active and role = 'OFFICER' limit 1;
    if found then return v_next; end if;
    select id into v_next from public.authorities where is_active and role = 'DEPARTMENT' limit 1;
    if found then return v_next; end if;
  elsif v_role = 'MUKHIYA' then
    select id into v_next from public.authorities where is_active and role = 'OFFICER' limit 1;
    if found then return v_next; end if;
    select id into v_next from public.authorities where is_active and role = 'DEPARTMENT' limit 1;
    if found then return v_next; end if;
  elsif v_role = 'OFFICER' then
    select id into v_next from public.authorities where is_active and role = 'DEPARTMENT' limit 1;
    if found then return v_next; end if;
  end if;
  return null;
end;
$$;

-- ------------------------------------------------------------
-- RPC: submit_for_verification
-- Officer uploads mandatory photo (+ optional video, location) and
-- submits the completed work for citizen/admin verification.
-- ------------------------------------------------------------
create or replace function public.submit_for_verification(
  p_complaint_id bigint,
  p_photo_url text,
  p_video_url text default '',
  p_lat numeric default null,
  p_lng numeric default null,
  p_place text default '',
  p_remarks text default ''
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_authority uuid := public.current_authority_id();
  v_actor text := coalesce(public.current_authority_name(), 'System Admin');
  v_role text := coalesce(public.current_authority_role(), 'ADMIN');
  v_closure_id bigint;
  v_complaint complaints%rowtype;
begin
  if coalesce(p_photo_url, '') = '' then
    raise exception 'Resolution proof photo is mandatory before submitting for verification';
  end if;

  select * into v_complaint from public.complaints where id = p_complaint_id::bigint;
  if not found then raise exception 'Complaint not found'; end if;
  if v_complaint.status in ('CLOSED','REJECTED') then
    raise exception 'This complaint has already been closed or rejected';
  end if;
  if not (public.is_admin() or v_authority::uuid = v_complaint.current_authority_id::uuid) then
    raise exception 'You are not authorized to submit verification for this complaint';
  end if;

  update public.complaints set status = 'VERIFICATION_PENDING', updated_at = now() where id = p_complaint_id::bigint;

  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role, photo_url)
  values (p_complaint_id::bigint, 'VERIFICATION_PENDING',
          coalesce(nullif(p_remarks, ''), 'Work completed - submitted for verification with proof evidence'),
          v_actor, v_role, p_photo_url);

  insert into public.complaint_closure
    (complaint_id, submitted_by, submitted_by_name, submitted_by_role, photo_url, video_url,
     location_lat, location_lng, location_place)
  values
    (p_complaint_id::bigint, v_authority, v_actor, v_role, p_photo_url, coalesce(p_video_url, ''),
     p_lat, p_lng, coalesce(p_place, ''))
  returning id into v_closure_id;

  return jsonb_build_object('ok', true, 'closure_id', v_closure_id);
end;
$$;

-- ------------------------------------------------------------
-- RPC: citizen_respond_verification
-- The citizen (owner) confirms the work or reports an issue.
-- Reporting an issue automatically moves the complaint to the
-- Higher Authority Review Queue.
-- ------------------------------------------------------------
create or replace function public.citizen_respond_verification(
  p_complaint_id bigint,
  p_response text,
  p_remarks text default ''
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_complaint complaints%rowtype;
  v_next uuid;
  v_next_name text;
  v_closure_id bigint;
begin
  if p_response not in ('CONFIRMED','DISPUTED') then
    raise exception 'Response must be CONFIRMED or DISPUTED';
  end if;

  select * into v_complaint from public.complaints where id = p_complaint_id::bigint;
  if not found then raise exception 'Complaint not found'; end if;
  if v_complaint.user_id::uuid <> auth.uid()::uuid then
    raise exception 'You can only verify your own complaint';
  end if;
  if v_complaint.status <> 'VERIFICATION_PENDING' then
    raise exception 'This complaint is not awaiting your verification';
  end if;

  select id into v_closure_id
  from public.complaint_closure
  where complaint_id = p_complaint_id::bigint
  order by submitted_at desc limit 1;
  if not found then raise exception 'No verification evidence found for this complaint'; end if;

  if p_response = 'CONFIRMED' then
    update public.complaints set status = 'CITIZEN_CONFIRMED', updated_at = now() where id = p_complaint_id::bigint;
    insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
    values (p_complaint_id::bigint, 'CITIZEN_CONFIRMED',
            coalesce(nullif(p_remarks, ''), 'Citizen confirmed the work is completed. Awaiting final closure.'),
            'Citizen', 'Citizen');
  else
    -- Auto-forward to Higher Authority Review Queue
    v_next := public.next_higher_authority_id(coalesce(v_complaint.current_authority_id, (
      select submitted_by from public.complaint_closure where id = v_closure_id
    )::uuid));

    update public.complaints
      set status = 'DISPUTED', updated_at = now(),
          current_authority_id = v_next,
          current_authority_name = coalesce((select name from public.authorities where id = v_next::uuid), current_authority_name)
      where id = p_complaint_id::bigint;

    insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
    values (p_complaint_id::bigint, 'DISPUTED',
            coalesce(nullif(p_remarks, ''), 'Citizen reported an issue. Moved to Higher Authority Review Queue.'),
            'Citizen', 'Citizen');

    if v_next is not null then
      select name into v_next_name from public.authorities where id = v_next::uuid;
      insert into public.complaint_forwarding
        (complaint_id, forwarded_by, forwarded_by_name, forwarded_to, forwarded_to_name,
         remarks, recipient_email, email_status)
      values
        (p_complaint_id::bigint, v_complaint.current_authority_id, 'Citizen (Issue Report)',
         v_next, v_next_name,
         coalesce(nullif(p_remarks, ''), 'Citizen reported issue after work completion - review required'),
         (select email from public.authorities where id = v_next::uuid), 'PENDING');
    end if;
  end if;

  update public.complaint_closure
    set citizen_id = auth.uid()::uuid,
        citizen_response = p_response,
        citizen_remarks = coalesce(p_remarks, ''),
        citizen_responded_at = now()
  where id = v_closure_id;

  return jsonb_build_object('ok', true, 'closure_id', v_closure_id);
end;
$$;

-- ------------------------------------------------------------
-- RPC: admin_close_complaint
-- FINAL closure is allowed ONLY for the Admin or an authorized
-- higher authority (Mukhiya / Block Officer / District authority).
-- A Gram Panchayat Officer can NEVER permanently close a complaint.
-- ------------------------------------------------------------
create or replace function public.admin_close_complaint(
  p_complaint_id bigint,
  p_remarks text default ''
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_complaint complaints%rowtype;
  v_authority uuid := public.current_authority_id();
  v_actor text := coalesce(public.current_authority_name(), 'System Admin');
  v_role text := coalesce(public.current_authority_role(), 'ADMIN');
  v_is_admin boolean := public.is_admin();
  v_closure_id bigint;
begin
  if not v_is_admin and v_authority::uuid is null then
    raise exception 'Only an admin or authorized higher authority can close a complaint';
  end if;

  select * into v_complaint from public.complaints where id = p_complaint_id::bigint;
  if not found then raise exception 'Complaint not found'; end if;

  -- Gate 1: absolutely no closure from the Gram Panchayat Officer level
  if not v_is_admin and coalesce(v_role, '') = 'PANCHAYAT' then
    raise exception 'A Gram Panchayat Officer cannot permanently close a complaint. Final closure requires admin or higher authority verification.';
  end if;

  -- Gate 2: only verification lifecycle states can be closed (no direct closing from pending/in-progress)
  if v_complaint.status not in ('VERIFICATION_PENDING','CITIZEN_CONFIRMED','DISPUTED') then
    raise exception 'Complaint can be closed only after the verification workflow has begun';
  end if;

  -- Gate 3: a higher authority (non-admin) must currently hold the file
  if not v_is_admin and v_authority::uuid <> v_complaint.current_authority_id::uuid then
    raise exception 'You are not the current authority for this complaint';
  end if;

  select id into v_closure_id
  from public.complaint_closure
  where complaint_id = p_complaint_id::bigint
  order by submitted_at desc limit 1;
  if found then
    update public.complaint_closure
      set verified_by = (case when v_is_admin then verified_by else v_authority end),
          verified_by_name = v_actor,
          verified_by_role = v_role,
          verified_at = now(),
          closed_at = now()
    where id = v_closure_id;
  end if;

  update public.complaints
    set status = 'CLOSED', updated_at = now(), resolved_at = coalesce(resolved_at, now()), closed_at = now()
  where id = p_complaint_id::bigint;

  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (p_complaint_id::bigint, 'CLOSED',
          coalesce(nullif(p_remarks, ''), 'Complaint finally closed after verification.'),
          v_actor, v_role);

  return jsonb_build_object('ok', true, 'closed_at', now());
end;
$$;

-- ------------------------------------------------------------
-- Hard block: officer can no longer set RESOLVED/CLOSED directly
-- ------------------------------------------------------------
create or replace function public.update_complaint_status(
  p_complaint_id bigint,
  p_status text,
  p_remarks text default '',
  p_photo_url text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_authority uuid := public.current_authority_id();
  v_actor text := coalesce(public.current_authority_name(), 'System Admin');
begin
  if not (public.is_admin() or v_authority::uuid = (select current_authority_id::uuid from public.complaints where id = p_complaint_id::bigint)) then
    raise exception 'You are not authorized to update this complaint';
  end if;

  if p_status::text in ('RESOLVED','CLOSED','VERIFICATION_PENDING','CITIZEN_CONFIRMED','DISPUTED') then
    raise exception 'Direct status change to this state is disabled. Use the complaint closure verification workflow instead.';
  end if;

  update public.complaints
    set status = p_status::text, updated_at = now()
  where id = p_complaint_id::bigint;

  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role, photo_url)
  values (p_complaint_id::bigint, p_status::text, coalesce(nullif(p_remarks, ''), 'Status updated to ' || p_status::text),
          v_actor, 'Authority', coalesce(p_photo_url, ''));

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- Public tracking: surface the closure audit trail too
-- ------------------------------------------------------------
create or replace function public.get_public_complaint(p_complaint_id text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'complaint_id', c.complaint_id,
    'category', cat.name,
    'title', c.title,
    'description', c.description,
    'status', c.status,
    'village', c.village,
    'ward', c.ward,
    'landmark', c.landmark,
    'current_authority', a.name,
    'current_authority_designation', a.designation,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'resolved_at', c.resolved_at,
    'closed_at', c.closed_at,
    'closure', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'submitted_by_name', k.submitted_by_name,
        'submitted_by_role', k.submitted_by_role,
        'photo_url', k.photo_url,
        'video_url', k.video_url,
        'location_lat', k.location_lat,
        'location_lng', k.location_lng,
        'location_place', k.location_place,
        'submitted_at', k.submitted_at,
        'citizen_response', k.citizen_response,
        'citizen_remarks', k.citizen_remarks,
        'citizen_responded_at', k.citizen_responded_at,
        'verified_by_name', k.verified_by_name,
        'verified_by_role', k.verified_by_role,
        'verified_at', k.verified_at,
        'closed_at', k.closed_at
      ) order by k.submitted_at desc), '[]'::jsonb)
      from public.complaint_closure k where k.complaint_id::bigint = c.id::bigint
    ),
    'timeline', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'status', s.status,
        'remarks', s.remarks,
        'changed_by', s.changed_by,
        'created_at', s.created_at,
        'photo_url', s.photo_url
      ) order by s.created_at), '[]'::jsonb)
      from public.complaint_status s where s.complaint_id::bigint = c.id::bigint
    )
  )
  from public.complaints c
  join public.categories cat on cat.id::bigint = c.category_id::bigint
  left join public.authorities a on a.id::uuid = c.current_authority_id::uuid
  where c.complaint_id = p_complaint_id::text;
$$;

-- ------------------------------------------------------------
-- Grants
-- ------------------------------------------------------------
revoke execute on function public.submit_for_verification(bigint, text, text, numeric, numeric, text, text) from anon, authenticated, public;
revoke execute on function public.citizen_respond_verification(bigint, text, text) from anon, authenticated, public;
revoke execute on function public.admin_close_complaint(bigint, text) from anon, authenticated, public;
revoke execute on function public.next_higher_authority_id(uuid) from anon, authenticated, public;
revoke execute on function public.current_authority_role() from anon, authenticated, public;
grant execute on function public.submit_for_verification(bigint, text, text, numeric, numeric, text, text) to authenticated;
grant execute on function public.citizen_respond_verification(bigint, text, text) to authenticated;
grant execute on function public.admin_close_complaint(bigint, text) to authenticated;
grant execute on function public.next_higher_authority_id(uuid) to authenticated;
grant execute on function public.current_authority_role() to authenticated;