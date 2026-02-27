-- Add missing foreign keys so Table Editor shows "go to parent" for all reference columns

-- block_config_scale_versions.block_id -> blocks
ALTER TABLE public.block_config_scale_versions
  ADD CONSTRAINT block_config_scale_versions_block_id_fkey
  FOREIGN KEY (block_id) REFERENCES public.blocks(id);

-- block_config_select_option_versions.block_id -> blocks
ALTER TABLE public.block_config_select_option_versions
  ADD CONSTRAINT block_config_select_option_versions_block_id_fkey
  FOREIGN KEY (block_id) REFERENCES public.blocks(id);

-- record_answers.block_id -> blocks
ALTER TABLE public.record_answers
  ADD CONSTRAINT record_answers_block_id_fkey
  FOREIGN KEY (block_id) REFERENCES public.blocks(id);

-- deeds.user_id -> auth.users (Supabase auth)
ALTER TABLE public.deeds
  ADD CONSTRAINT deeds_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
