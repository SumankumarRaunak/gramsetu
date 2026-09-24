-- ============================================================
-- 09/09 - ONE-TIME MIGRATION: FIX BROKEN SIGNUP TRIGGER + RLS
--
-- Run this in Supabase Dashboard > SQL Editor.
--
-- BACKGROUND
-- ---------
-- A previously deployed "handle_new_user" trigger referenced a column
-- (raw_email) that no longer exists in this Supabase project's
-- auth.users table. The trigger runs on EVERY new auth user insert and
-- raised an error at runtime, so GoTrue returned
--   "Database error creating new user"
-- and NO new citizen could register. Only admins/authorities could be
-- created (the trigger skips them), which is exactly the behaviour seen.
--
-- This migration:
--   1. Drops the broken trigger + function.
--   2. Recreates an exception-safe trigger (a profile-insert problem can
--      never block signup again).
--   3. Relaxes the complaint INSERT policy so a citizen whose profile row
--      hasn't been created yet is still able to submit their own complaint
--      (instead of hitting a silent RLS rejection).
--
-- Safe to re-run.
-- ============================================================

-- 1) Drop the broken trigger + function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2) Recreate a safe trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if meta->>'role' is null or meta->>'role' = 'citizen' then
    begin
      insert into public.users (
        id, full_name, email, phone,
        village, ward, panchayat, block, district
      ) values (
        new.id,
        coalesce(nullif(meta->>'full_name', ''), 'New Citizen'),
        coalesce(new.email, ''),
        coalesce(meta->>'phone', ''),
        coalesce(meta->>'village', ''),
        coalesce(meta->>'ward', ''),
        coalesce(meta->>'panchayat', ''),
        coalesce(meta->>'block', ''),
        coalesce(meta->>'district', '')
      )
      on conflict (id) do nothing;
    exception when others then
      null; -- must never break signup
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3) Relax complaint INSERT RLS so a missing profile row never blocks
--    a citizen from reporting their own grievance.
alter table public.complaints enable row level security;
drop policy if exists "complaints insert citizen" on public.complaints;
create policy "complaints insert citizen" on public.complaints for insert to authenticated with check (
  user_id = auth.uid()::uuid
);