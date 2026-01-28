-- Extend RP owner-occupier table to persist household solvency inputs and members
ALTER TABLE public.owner_occupier_data
  ADD COLUMN IF NOT EXISTS household_income_monthly numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS existing_credits_monthly numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_charges_monthly numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_liquidity numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS household_members jsonb NOT NULL DEFAULT '[]'::jsonb;