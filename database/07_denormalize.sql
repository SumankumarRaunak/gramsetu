-- ============================================================
-- 07/07 - DENORMALIZED SNAPSHOT COLUMNS ON COMPLAINTS
-- Run this chunk FIRST, then RE-RUN chunk 05 (rpc_functions) so
-- forward_complaint picks up the current_authority_name column.
-- Safe to re-run.
-- ============================================================

alter table public.complaints add column if not exists submitter_name text not null default '';
alter table public.complaints add column if not exists submitter_mobile text not null default '';
alter table public.complaints add column if not exists submitter_email text not null default '';
alter table public.complaints add column if not exists category_name text not null default '';
alter table public.complaints add column if not exists current_authority_name text not null default '';
alter table public.complaints add column if not exists priority text not null default 'normal';
alter table public.complaints add column if not exists block text not null default '';