-- Drop deprecated scale label columns (replaced by label_1…label_N).
-- Run after backfill (20250225000000) and after app uses labels only.

ALTER TABLE public.block_config_scale_versions
  DROP COLUMN IF EXISTS label_left,
  DROP COLUMN IF EXISTS label_right;
