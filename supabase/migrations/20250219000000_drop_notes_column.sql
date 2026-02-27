-- Remove notes column from records (field removed from UI; users add text blocks if needed)
ALTER TABLE public.records DROP COLUMN IF EXISTS notes;
