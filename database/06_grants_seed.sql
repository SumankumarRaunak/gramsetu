-- ============================================================
-- 06/06 - EXECUTE GRANTS + SEED CATEGORIES
-- Run AFTER chunk 05. Safe to re-run.
-- ============================================================

revoke execute on function public.get_public_complaint(text) from anon, authenticated, public;
grant execute on function public.get_public_complaint(text) to anon, authenticated;

revoke execute on function public.verify_complaint(bigint, text) from anon, authenticated, public;
revoke execute on function public.reject_complaint(bigint, text) from anon, authenticated, public;
revoke execute on function public.forward_complaint(bigint, uuid, text) from anon, authenticated, public;
revoke execute on function public.update_complaint_status(bigint, text, text, text) from anon, authenticated, public;
revoke execute on function public.submit_feedback(bigint, int, text) from anon, authenticated, public;
grant execute on function public.verify_complaint(bigint, text) to authenticated;
grant execute on function public.reject_complaint(bigint, text) to authenticated;
grant execute on function public.forward_complaint(bigint, uuid, text) to authenticated;
grant execute on function public.update_complaint_status(bigint, text, text, text) to authenticated;
grant execute on function public.submit_feedback(bigint, int, text) to authenticated;

insert into public.categories (name, slug, icon) values
  ('Street Light', 'street_light', 'lightbulb'),
  ('Water Supply', 'water_supply', 'droplets'),
  ('Road', 'road', 'route'),
  ('Drainage', 'drainage', 'building'),
  ('Garbage / Sanitation', 'garbage', 'trash'),
  ('Electricity', 'electricity', 'zap'),
  ('Public Infrastructure', 'public_infrastructure', 'layers'),
  ('Other', 'other', 'file-text')
on conflict (slug) do nothing;