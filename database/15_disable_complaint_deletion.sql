-- Complaint records are permanent. Run after all earlier complaint migrations.

create or replace function public.prevent_complaint_deletion()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Complaint records cannot be deleted';
end;
$$;

drop trigger if exists trg_prevent_complaint_deletion on public.complaints;
create trigger trg_prevent_complaint_deletion
before delete on public.complaints
for each row execute function public.prevent_complaint_deletion();

create or replace function public.delete_complaint(p_complaint_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Complaint records cannot be deleted';
end;
$$;

revoke execute on function public.delete_complaint(bigint) from anon, authenticated, public, service_role;
revoke delete on public.complaints from anon, authenticated;

drop policy if exists "complaints admin delete" on storage.objects;