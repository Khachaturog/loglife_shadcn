-- Удаление неиспользуемой таблицы block_options.
-- Опции select хранятся в blocks.config.options и block_config_select_option_versions.

DROP TABLE IF EXISTS public.block_options;
