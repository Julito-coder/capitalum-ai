
-- Add new columns for the modern simplified onboarding
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS age_range text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS income_range text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS patrimony_range text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS risk_tolerance text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tax_bracket text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS financial_objectives text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS declares_in_france boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_partial boolean DEFAULT false;
