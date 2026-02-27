-- Add category column to deeds
ALTER TABLE public.deeds ADD COLUMN IF NOT EXISTS category text;
