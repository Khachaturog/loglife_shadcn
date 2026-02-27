-- RLS Auth Initplan: replace auth.uid() with (select auth.uid()) so Postgres
-- evaluates it once per statement (initplan) instead of per row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- deeds (4 policies)
DROP POLICY IF EXISTS "deeds_select_own" ON public.deeds;
CREATE POLICY "deeds_select_own" ON public.deeds FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "deeds_insert_own" ON public.deeds;
CREATE POLICY "deeds_insert_own" ON public.deeds FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "deeds_update_own" ON public.deeds;
CREATE POLICY "deeds_update_own" ON public.deeds FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "deeds_delete_own" ON public.deeds;
CREATE POLICY "deeds_delete_own" ON public.deeds FOR DELETE USING ((select auth.uid()) = user_id);

-- blocks (4 policies)
DROP POLICY IF EXISTS "blocks_select_via_deed" ON public.blocks;
CREATE POLICY "blocks_select_via_deed" ON public.blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "blocks_insert_via_deed" ON public.blocks;
CREATE POLICY "blocks_insert_via_deed" ON public.blocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "blocks_update_via_deed" ON public.blocks;
CREATE POLICY "blocks_update_via_deed" ON public.blocks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "blocks_delete_via_deed" ON public.blocks;
CREATE POLICY "blocks_delete_via_deed" ON public.blocks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = blocks.deed_id AND d.user_id = (select auth.uid())));

-- records (4 policies)
DROP POLICY IF EXISTS "records_select_via_deed" ON public.records;
CREATE POLICY "records_select_via_deed" ON public.records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "records_insert_via_deed" ON public.records;
CREATE POLICY "records_insert_via_deed" ON public.records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "records_update_via_deed" ON public.records;
CREATE POLICY "records_update_via_deed" ON public.records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "records_delete_via_deed" ON public.records;
CREATE POLICY "records_delete_via_deed" ON public.records FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.deeds d WHERE d.id = records.deed_id AND d.user_id = (select auth.uid())));

-- record_answers (4 policies)
DROP POLICY IF EXISTS "record_answers_select_via_deed" ON public.record_answers;
CREATE POLICY "record_answers_select_via_deed" ON public.record_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "record_answers_insert_via_deed" ON public.record_answers;
CREATE POLICY "record_answers_insert_via_deed" ON public.record_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "record_answers_update_via_deed" ON public.record_answers;
CREATE POLICY "record_answers_update_via_deed" ON public.record_answers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "record_answers_delete_via_deed" ON public.record_answers;
CREATE POLICY "record_answers_delete_via_deed" ON public.record_answers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.records r
    JOIN public.deeds d ON d.id = r.deed_id
    WHERE r.id = record_answers.record_id AND d.user_id = (select auth.uid())
  ));

-- block_config_versions (3 policies)
DROP POLICY IF EXISTS "block_config_versions_select_via_deed" ON public.block_config_versions;
CREATE POLICY "block_config_versions_select_via_deed" ON public.block_config_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_versions.block_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "block_config_versions_insert_via_deed" ON public.block_config_versions;
CREATE POLICY "block_config_versions_insert_via_deed" ON public.block_config_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_versions.block_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "block_config_versions_delete_via_deed" ON public.block_config_versions;
CREATE POLICY "block_config_versions_delete_via_deed" ON public.block_config_versions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_versions.block_id AND d.user_id = (select auth.uid())
  ));

-- block_config_scale_versions (2 policies)
DROP POLICY IF EXISTS "block_config_scale_versions_select_via_deed" ON public.block_config_scale_versions;
CREATE POLICY "block_config_scale_versions_select_via_deed" ON public.block_config_scale_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_scale_versions.block_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "block_config_scale_versions_insert_via_deed" ON public.block_config_scale_versions;
CREATE POLICY "block_config_scale_versions_insert_via_deed" ON public.block_config_scale_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE b.id = block_config_scale_versions.block_id AND d.user_id = (select auth.uid())
  ));

-- block_config_select_option_versions (2 policies)
DROP POLICY IF EXISTS "block_config_select_option_versions_select_via_deed" ON public.block_config_select_option_versions;
CREATE POLICY "block_config_select_option_versions_select_via_deed" ON public.block_config_select_option_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.block_config_versions v
    JOIN public.blocks b ON b.id = v.block_id
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE v.id = block_config_select_option_versions.config_version_id AND d.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "block_config_select_option_versions_insert_via_deed" ON public.block_config_select_option_versions;
CREATE POLICY "block_config_select_option_versions_insert_via_deed" ON public.block_config_select_option_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.block_config_versions v
    JOIN public.blocks b ON b.id = v.block_id
    JOIN public.deeds d ON d.id = b.deed_id
    WHERE v.id = block_config_select_option_versions.config_version_id AND d.user_id = (select auth.uid())
  ));
