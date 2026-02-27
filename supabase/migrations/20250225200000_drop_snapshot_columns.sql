-- Remove unused columns from record_answers
-- snapshot_*: block info stays in blocks (soft delete)
-- is_outdated: computed at display time from block + config version
ALTER TABLE public.record_answers DROP COLUMN IF EXISTS snapshot_title;
ALTER TABLE public.record_answers DROP COLUMN IF EXISTS snapshot_deleted_at;
ALTER TABLE public.record_answers DROP COLUMN IF EXISTS is_outdated;
