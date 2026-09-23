-- ============================================================
-- 05/06 - RPC FUNCTIONS
-- Run AFTER chunk 04. Safe to re-run.
-- ============================================================

-- Public complaint tracking (no login required)
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

-- Admin: verify a complaint
create or replace function public.verify_complaint(p_complaint_id bigint, p_remarks text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can verify complaints';
  end if;
  if not exists (select 1 from public.complaints where id = p_complaint_id::bigint) then
    raise exception 'Complaint not found';
  end if;
  update public.complaints set status = 'VERIFIED', updated_at = now() where id = p_complaint_id::bigint;
  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (p_complaint_id::bigint, 'VERIFIED', coalesce(nullif(p_remarks, ''), 'Complaint verified by System Admin'), 'System Admin', 'System Admin');
  return jsonb_build_object('ok', true);
end;
$$;

-- Admin: reject a complaint
create or replace function public.reject_complaint(p_complaint_id bigint, p_remarks text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can reject complaints';
  end if;
  if not exists (select 1 from public.complaints where id = p_complaint_id::bigint) then
    raise exception 'Complaint not found';
  end if;
  update public.complaints set status = 'REJECTED', updated_at = now() where id = p_complaint_id::bigint;
  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (p_complaint_id::bigint, 'REJECTED', coalesce(nullif(p_remarks, ''), 'Complaint rejected'), 'System Admin', 'System Admin');
  return jsonb_build_object('ok', true);
end;
$$;

-- Generic forwarding: admin or any authority -> any active authority
create or replace function public.forward_complaint(
  p_complaint_id bigint,
  p_to_authority uuid,
  p_remarks text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_authority uuid := public.current_authority_id();
  v_sender_name text := coalesce(public.current_authority_name(), 'System Admin');
  v_target authorities%rowtype;
  v_complaint complaints%rowtype;
  v_fwd bigint;
begin
  select * into v_complaint from public.complaints where id = p_complaint_id::bigint;
  if not found then raise exception 'Complaint not found'; end if;

  if not (public.is_admin() or v_authority::uuid = v_complaint.current_authority_id::uuid) then
    raise exception 'You are not authorized to forward this complaint';
  end if;

  select * into v_target from public.authorities where id = p_to_authority::uuid and is_active = true;
  if not found then raise exception 'Target authority not found or inactive'; end if;

  update public.complaints
    set status = 'FORWARDED', current_authority_id = p_to_authority::uuid,
        current_authority_name = v_target.name, updated_at = now()
  where id = p_complaint_id::bigint;

  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role)
  values (p_complaint_id::bigint, 'FORWARDED',
          coalesce(nullif(p_remarks, ''), 'Forwarded to ' || v_target.name),
          v_sender_name, 'Authority');

  insert into public.complaint_forwarding
    (complaint_id, forwarded_by, forwarded_by_name, forwarded_to, forwarded_to_name,
     remarks, recipient_email, email_status)
  values
    (p_complaint_id::bigint, v_authority, v_sender_name, v_target.id, v_target.name,
     coalesce(nullif(p_remarks, ''), ''),
     v_target.email, 'PENDING')
  returning id into v_fwd;

  return jsonb_build_object(
    'ok', true,
    'forwarding_id', v_fwd,
    'forwarded_to', v_target.name,
    'recipient_email', v_target.email,
    'sender_name', v_sender_name
  );
end;
$$;

-- Authority / admin: update complaint status
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

  if p_status::text = 'RESOLVED' and coalesce(p_photo_url, '') = '' then
    raise exception 'Resolution proof photo is mandatory before marking a complaint as RESOLVED';
  end if;

  update public.complaints
    set status = p_status::text,
        updated_at = now(),
        resolved_at = case when p_status::text = 'RESOLVED' then now() else resolved_at end,
        closed_at = case when p_status::text = 'CLOSED' then now() else closed_at end
  where id = p_complaint_id::bigint;

  insert into public.complaint_status (complaint_id, status, remarks, changed_by, changed_by_role, photo_url)
  values (p_complaint_id::bigint, p_status::text, coalesce(nullif(p_remarks, ''), 'Status updated to ' || p_status::text),
          v_actor, 'Authority', coalesce(p_photo_url, ''));

  return jsonb_build_object('ok', true);
end;
$$;

-- Citizen: submit feedback for their own complaint
create or replace function public.submit_feedback(
  p_complaint_id bigint,
  p_rating int,
  p_comment text default ''
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.complaints
    where id = p_complaint_id::bigint and user_id::uuid = auth.uid()::uuid
  ) then
    raise exception 'You can only give feedback for your own complaint';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  insert into public.feedback (complaint_id, user_id, rating, comment)
  values (p_complaint_id::bigint, auth.uid()::uuid, p_rating::int, coalesce(p_comment, ''))
  on conflict (complaint_id) do update set rating = excluded.rating, comment = excluded.comment, submitted_at = now();

  return jsonb_build_object('ok', true);
end;
$$;