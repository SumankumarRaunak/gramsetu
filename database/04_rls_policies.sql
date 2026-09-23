-- ============================================================
-- 04/06 - ROW LEVEL SECURITY POLICIES
-- Run AFTER chunk 03. Safe to re-run.
-- ============================================================

-- users
alter table public.users enable row level security;
drop policy if exists "users select own" on public.users;
create policy "users select own" on public.users for select to authenticated using (id = auth.uid()::uuid);
drop policy if exists "users select admin" on public.users;
create policy "users select admin" on public.users for select to authenticated using (public.is_admin());
drop policy if exists "users insert own" on public.users;
create policy "users insert own" on public.users for insert to authenticated with check (id = auth.uid()::uuid);
drop policy if exists "users update own" on public.users;
create policy "users update own" on public.users for update to authenticated using (id = auth.uid()::uuid);

-- admins
alter table public.admins enable row level security;
drop policy if exists "admins select admin" on public.admins;
create policy "admins select admin" on public.admins for select to authenticated using (public.is_admin());

-- authorities
alter table public.authorities enable row level security;
drop policy if exists "authorities select self" on public.authorities;
create policy "authorities select self" on public.authorities for select to authenticated using (user_id = auth.uid()::uuid);
drop policy if exists "authorities select admin" on public.authorities;
create policy "authorities select admin" on public.authorities for select to authenticated using (public.is_admin());
drop policy if exists "authorities insert admin" on public.authorities;
create policy "authorities insert admin" on public.authorities for insert to authenticated with check (public.is_admin());
drop policy if exists "authorities update admin" on public.authorities;
create policy "authorities update admin" on public.authorities for update to authenticated using (public.is_admin());
drop policy if exists "authorities delete admin" on public.authorities;
create policy "authorities delete admin" on public.authorities for delete to authenticated using (public.is_admin());

-- categories
alter table public.categories enable row level security;
drop policy if exists "categories select all" on public.categories;
create policy "categories select all" on public.categories for select using (true);
drop policy if exists "categories insert admin" on public.categories;
create policy "categories insert admin" on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists "categories update admin" on public.categories;
create policy "categories update admin" on public.categories for update to authenticated using (public.is_admin());
drop policy if exists "categories delete admin" on public.categories;
create policy "categories delete admin" on public.categories for delete to authenticated using (public.is_admin());

-- complaints
alter table public.complaints enable row level security;
drop policy if exists "complaints select citizen" on public.complaints;
create policy "complaints select citizen" on public.complaints for select to authenticated using (user_id = auth.uid()::uuid);
drop policy if exists "complaints select authority" on public.complaints;
create policy "complaints select authority" on public.complaints for select to authenticated using (current_authority_id::uuid = public.current_authority_id());
drop policy if exists "complaints select admin" on public.complaints;
create policy "complaints select admin" on public.complaints for select to authenticated using (public.is_admin());
drop policy if exists "complaints insert citizen" on public.complaints;
create policy "complaints insert citizen" on public.complaints for insert to authenticated with check (
  user_id = auth.uid()::uuid
  and exists (select 1 from public.users u where u.id = auth.uid()::uuid)
);
drop policy if exists "complaints update authority" on public.complaints;
create policy "complaints update authority" on public.complaints for update to authenticated using (
  public.is_admin() or current_authority_id::uuid = public.current_authority_id()
);

-- complaint_status
alter table public.complaint_status enable row level security;
drop policy if exists "status select related" on public.complaint_status;
create policy "status select related" on public.complaint_status for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.complaints c
    where c.id::bigint = complaint_id::bigint
      and (c.user_id::uuid = auth.uid()::uuid or c.current_authority_id::uuid = public.current_authority_id())
  )
);
drop policy if exists "status insert admin" on public.complaint_status;
create policy "status insert admin" on public.complaint_status for insert to authenticated with check (public.is_admin());
drop policy if exists "status insert authority" on public.complaint_status;
create policy "status insert authority" on public.complaint_status for insert to authenticated with check (
  public.current_authority_id() is not null
);

-- complaint_forwarding
alter table public.complaint_forwarding enable row level security;
drop policy if exists "fwd select related" on public.complaint_forwarding;
create policy "fwd select related" on public.complaint_forwarding for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.complaints c
    where c.id::bigint = complaint_id::bigint
      and (c.user_id::uuid = auth.uid()::uuid or c.current_authority_id::uuid = public.current_authority_id())
  )
);
drop policy if exists "fwd insert admin" on public.complaint_forwarding;
create policy "fwd insert admin" on public.complaint_forwarding for insert to authenticated with check (public.is_admin());
drop policy if exists "fwd insert authority" on public.complaint_forwarding;
create policy "fwd insert authority" on public.complaint_forwarding for insert to authenticated with check (public.current_authority_id() is not null);
drop policy if exists "fwd update related" on public.complaint_forwarding;
create policy "fwd update related" on public.complaint_forwarding for update to authenticated using (
  public.is_admin() or public.current_authority_id() is not null
);

-- feedback
alter table public.feedback enable row level security;
drop policy if exists "feedback insert citizen" on public.feedback;
create policy "feedback insert citizen" on public.feedback for insert to authenticated with check (
  exists (
    select 1 from public.complaints c
    where c.id::bigint = complaint_id::bigint and c.user_id::uuid = auth.uid()::uuid
  )
);
drop policy if exists "feedback select related" on public.feedback;
create policy "feedback select related" on public.feedback for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.complaints c
    where c.id::bigint = complaint_id::bigint and (c.user_id::uuid = auth.uid()::uuid or c.current_authority_id::uuid = public.current_authority_id())
  )
);