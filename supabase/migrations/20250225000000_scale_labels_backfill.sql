-- Backfill scale labels: copy label_left -> label_1, label_right -> label_{divisions}
-- so existing versioned configs work after switching to per-division headers.
-- Does NOT drop label_left/label_right (do that in a later migration after app update).

-- label_1 from label_left
UPDATE public.block_config_scale_versions
SET label_1 = COALESCE(label_1, label_left)
WHERE label_left IS NOT NULL AND label_left <> '';

-- divisions=1: right edge goes into label_1 as well
UPDATE public.block_config_scale_versions
SET label_1 = COALESCE(label_1, label_right)
WHERE divisions = 1 AND label_right IS NOT NULL AND label_right <> '';

-- label_N from label_right for N = 2..10
UPDATE public.block_config_scale_versions SET label_2 = COALESCE(label_2, label_right) WHERE divisions = 2;
UPDATE public.block_config_scale_versions SET label_3 = COALESCE(label_3, label_right) WHERE divisions = 3;
UPDATE public.block_config_scale_versions SET label_4 = COALESCE(label_4, label_right) WHERE divisions = 4;
UPDATE public.block_config_scale_versions SET label_5 = COALESCE(label_5, label_right) WHERE divisions = 5;
UPDATE public.block_config_scale_versions SET label_6 = COALESCE(label_6, label_right) WHERE divisions = 6;
UPDATE public.block_config_scale_versions SET label_7 = COALESCE(label_7, label_right) WHERE divisions = 7;
UPDATE public.block_config_scale_versions SET label_8 = COALESCE(label_8, label_right) WHERE divisions = 8;
UPDATE public.block_config_scale_versions SET label_9 = COALESCE(label_9, label_right) WHERE divisions = 9;
UPDATE public.block_config_scale_versions SET label_10 = COALESCE(label_10, label_right) WHERE divisions = 10;
