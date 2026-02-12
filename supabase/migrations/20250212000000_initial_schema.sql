-- Log Life: initial schema for Supabase (Postgres)
-- Run this in Supabase SQL Editor or via Supabase CLI.

-- Block type enum (optional; can use text check instead)
CREATE TYPE block_type_enum AS ENUM (
  'number', 'text_short', 'text_paragraph',
  'single_select', 'multi_select', 'scale', 'yes_no'
);

-- deeds
CREATE TABLE IF NOT EXISTS public.deeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '📋',
  name text NOT NULL DEFAULT '',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_id uuid NOT NULL REFERENCES public.deeds(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  block_type text NOT NULL DEFAULT 'number'
    CHECK (block_type IN ('number','text_short','text_paragraph','single_select','multi_select','scale','yes_no')),
  is_required boolean NOT NULL DEFAULT false,
  config jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- block_options
CREATE TABLE IF NOT EXISTS public.block_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- records
CREATE TABLE IF NOT EXISTS public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_id uuid NOT NULL REFERENCES public.deeds(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  record_time time NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- record_answers
CREATE TABLE IF NOT EXISTS public.record_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  block_id uuid NOT NULL,
  value_json jsonb NOT NULL,
  is_outdated boolean NOT NULL DEFAULT false,
  snapshot_title text,
  snapshot_deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocks_deed_id ON public.blocks(deed_id);
CREATE INDEX IF NOT EXISTS idx_blocks_deleted_at ON public.blocks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_block_options_block_id ON public.block_options(block_id);
CREATE INDEX IF NOT EXISTS idx_records_deed_id ON public.records(deed_id);
CREATE INDEX IF NOT EXISTS idx_records_deed_date_time ON public.records(deed_id, record_date DESC, record_time DESC);
CREATE INDEX IF NOT EXISTS idx_record_answers_record_id ON public.record_answers(record_id);
CREATE INDEX IF NOT EXISTS idx_record_answers_block_id ON public.record_answers(block_id);

-- RLS
ALTER TABLE public.deeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_answers ENABLE ROW LEVEL SECURITY;

-- Policies: deeds (user sees only own)
CREATE POLICY "deeds_select_own" ON public.deeds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deeds_insert_own" ON public.deeds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deeds_update_own" ON public.deeds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deeds_delete_own" ON public.deeds FOR DELETE USING (auth.uid() = user_id);

-- Policies: blocks (via deed ownership)
CREATE POLICY "blocks_select_via_deed" ON public.blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = auth.uid()));
CREATE POLICY "blocks_insert_via_deed" ON public.blocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = auth.uid()));
CREATE POLICY "blocks_update_via_deed" ON public.blocks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = auth.uid()));
CREATE POLICY "blocks_delete_via_deed" ON public.blocks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = auth.uid()));

-- Policies: block_options (via block -> deed)
CREATE POLICY "block_options_select_via_deed" ON public.block_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_options.block_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_options_insert_via_deed" ON public.block_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_options.block_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_options_update_via_deed" ON public.block_options FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_options.block_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "block_options_delete_via_deed" ON public.block_options FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_options.block_id AND d.user_id = auth.uid()
  ));

-- Policies: records (via deed)
CREATE POLICY "records_select_via_deed" ON public.records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = auth.uid()));
CREATE POLICY "records_insert_via_deed" ON public.records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = auth.uid()));
CREATE POLICY "records_update_via_deed" ON public.records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = auth.uid()));
CREATE POLICY "records_delete_via_deed" ON public.records FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = auth.uid()));

-- Policies: record_answers (via record -> deed)
CREATE POLICY "record_answers_select_via_deed" ON public.record_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "record_answers_insert_via_deed" ON public.record_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "record_answers_update_via_deed" ON public.record_answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "record_answers_delete_via_deed" ON public.record_answers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = auth.uid()
  ));
