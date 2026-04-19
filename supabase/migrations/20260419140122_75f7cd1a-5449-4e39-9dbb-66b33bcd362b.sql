ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS reference_tax_income NUMERIC,
  ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC,
  ADD COLUMN IF NOT EXISTS housing_status TEXT,
  ADD COLUMN IF NOT EXISTS housing_zone TEXT,
  ADD COLUMN IF NOT EXISTS monthly_revenue_freelance NUMERIC;