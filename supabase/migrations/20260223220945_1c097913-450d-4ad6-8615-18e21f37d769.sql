
-- Add columns for full draft persistence to tax_form_2086_drafts
ALTER TABLE public.tax_form_2086_drafts
  ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS form_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS data_checksum text;

-- Add index on user_id + tax_year for fast lookups
CREATE INDEX IF NOT EXISTS idx_2086_drafts_user_year 
  ON public.tax_form_2086_drafts(user_id, tax_year);
