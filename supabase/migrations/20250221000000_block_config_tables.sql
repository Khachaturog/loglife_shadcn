-- Block config versioning: tables for scale and select configs
-- See docs/technical/04-block-config-schema.md

-- 1. Parent table: config versions
CREATE TABLE IF NOT EXISTS public.block_config_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  block_type text NOT NULL CHECK (block_type IN ('scale', 'single_select', 'multi_select')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Scale config versions
CREATE TABLE IF NOT EXISTS public.block_config_scale_versions (
  id uuid PRIMARY KEY REFERENCES public.block_config_versions(id) ON DELETE CASCADE,
  block_id uuid NOT NULL,
  divisions int NOT NULL CHECK (divisions BETWEEN 1 AND 10),
  label_left text DEFAULT '',
  label_right text DEFAULT '',
  label_1 text,
  label_2 text,
  label_3 text,
  label_4 text,
  label_5 text,
  label_6 text,
  label_7 text,
  label_8 text,
  label_9 text,
  label_10 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Select option versions (one row per option per version)
CREATE TABLE IF NOT EXISTS public.block_config_select_option_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_version_id uuid NOT NULL REFERENCES public.block_config_versions(id) ON DELETE CASCADE,
  block_id uuid NOT NULL,
  option_id uuid NOT NULL,
  label text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. record_answers: add config_version_id
ALTER TABLE public.record_answers
  ADD COLUMN IF NOT EXISTS config_version_id uuid REFERENCES public.block_config_versions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_block_config_versions_block_id ON public.block_config_versions(block_id);
CREATE INDEX IF NOT EXISTS idx_block_config_scale_versions_block_id ON public.block_config_scale_versions(block_id);
CREATE INDEX IF NOT EXISTS idx_block_config_select_option_versions_config_version_id ON public.block_config_select_option_versions(config_version_id);
CREATE INDEX IF NOT EXISTS idx_block_config_select_option_versions_block_id ON public.block_config_select_option_versions(block_id);
CREATE INDEX IF NOT EXISTS idx_record_answers_config_version_id ON public.record_answers(config_version_id);

-- RLS
ALTER TABLE public.block_config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_config_scale_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_config_select_option_versions ENABLE ROW LEVEL SECURITY;

-- Policies: block_config_versions (via block -> deed)
CREATE POLICY "block_config_versions_select_via_deed" ON public.block_config_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_versions.block_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_config_versions_insert_via_deed" ON public.block_config_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_versions.block_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_config_versions_delete_via_deed" ON public.block_config_versions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_versions.block_id AND d.user_id = auth.uid()
  ));

-- Policies: block_config_scale_versions (via block -> deed)
CREATE POLICY "block_config_scale_versions_select_via_deed" ON public.block_config_scale_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_scale_versions.block_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_config_scale_versions_insert_via_deed" ON public.block_config_scale_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_scale_versions.block_id AND d.user_id = auth.uid()
  ));

-- Policies: block_config_select_option_versions (via config_version -> block -> deed)
CREATE POLICY "block_config_select_option_versions_select_via_deed" ON public.block_config_select_option_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.block_config_versions v
    JOIN public.blocks b ON b.id = v.block_id
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE v.id = block_config_select_option_versions.config_version_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_config_select_option_versions_insert_via_deed" ON public.block_config_select_option_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.block_config_versions v
    JOIN public.blocks b ON b.id = v.block_id
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE v.id = block_config_select_option_versions.config_version_id AND d.user_id = auth.uid()
  ));
