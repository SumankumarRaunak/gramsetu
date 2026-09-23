-- ============================================================
-- 01/06 - EXTENSION, GRANTS, TABLES, SEQUENCE, INDEXES
-- Run this chunk first. Safe to re-run.
-- ============================================================

create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 1. categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  icon text not null default 'file-text',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. users (citizens)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null,
  village text not null default '',
  ward text not null default '',
  panchayat text not null default '',
  block text not null default '',
  district text not null default '',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. admins
-- ------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text not null default '',
  role text not null default 'super_admin',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. authorities
-- ------------------------------------------------------------
create table if not exists public.authorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  name text not null,
  designation text not null,
  role text not null check (role in ('PANCHAYAT', 'MUKHIYA', 'OFFICER', 'DEPARTMENT')),
  email text not null unique,
  phone text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. complaints
-- ------------------------------------------------------------
create sequence if not exists public.complaints_seq;

create table if not exists public.complaints (
  id bigint generated always as identity primary key,
  complaint_id text not null unique,
  user_id uuid references public.users (id) on delete set null,
  category_id bigint references public.categories (id),
  title text not null,
  description text not null,
  village text not null default '',
  ward text not null default '',
  panchayat text not null default '',
  district text not null default '',
  landmark text not null default '',
  photo_url text not null default '',
  status text not null default 'SUBMITTED'
    check (status in ('SUBMITTED','UNDER_REVIEW','VERIFIED','FORWARDED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED')),
  current_authority_id uuid references public.authorities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

create index if not exists idx_complaints_status on public.complaints (status);
create index if not exists idx_complaints_authority on public.complaints (current_authority_id);
create index if not exists idx_complaints_user on public.complaints (user_id);

-- ------------------------------------------------------------
-- 6. complaint_status (audit timeline)
-- ------------------------------------------------------------
create table if not exists public.complaint_status (
  id bigint generated always as identity primary key,
  complaint_id bigint not null references public.complaints (id) on delete cascade,
  status text not null
    check (status in ('SUBMITTED','UNDER_REVIEW','VERIFIED','FORWARDED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REJECTED')),
  remarks text not null default '',
  changed_by text not null default 'System',
  changed_by_role text not null default '',
  photo_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_status_complaint on public.complaint_status (complaint_id, created_at);

-- ------------------------------------------------------------
-- 7. complaint_forwarding
-- ------------------------------------------------------------
create table if not exists public.complaint_forwarding (
  id bigint generated always as identity primary key,
  complaint_id bigint not null references public.complaints (id) on delete cascade,
  forwarded_by uuid references public.authorities (id) on delete set null,
  forwarded_by_name text not null default '',
  forwarded_to uuid references public.authorities (id) on delete set null,
  forwarded_to_name text not null default '',
  remarks text not null default '',
  pdf_path text not null default '',
  recipient_email text not null default '',
  email_status text not null default 'PENDING'
    check (email_status in ('PENDING','SENT','FAILED')),
  email_attempts int not null default 0,
  email_error text not null default '',
  forwarded_at timestamptz not null default now()
);

create index if not exists idx_fwd_complaint on public.complaint_forwarding (complaint_id);

-- ------------------------------------------------------------
-- 8. feedback
-- ------------------------------------------------------------
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  complaint_id bigint not null unique references public.complaints (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  submitted_at timestamptz not null default now()
);