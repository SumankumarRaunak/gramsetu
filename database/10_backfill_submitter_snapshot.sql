-- ============================================================
-- 10 - BACKFILL COMPLAINT CITIZEN CONTACT SNAPSHOTS
-- Run once after 07_denormalize.sql for complaints created before
-- submitter details were persisted.
-- ============================================================

update public.complaints c
set
  submitter_name = u.full_name,
  submitter_mobile = u.phone,
  submitter_email = u.email
from public.users u
where c.user_id = u.id
  and (
    c.submitter_name = ''
    or c.submitter_mobile = ''
    or c.submitter_email = ''
  );
