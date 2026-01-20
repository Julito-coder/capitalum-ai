-- Extend profiles table with comprehensive onboarding data

-- Identity & Contact
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_postal_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residence_duration_years INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_homeowner BOOLEAN DEFAULT false;

-- Family Details
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spouse_income NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS children_details JSONB DEFAULT '[]'::jsonb;

-- Primary Objective
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_objective TEXT DEFAULT 'reduce_ir';

-- Profile Types (can be multiple)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_self_employed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_retired BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_investor BOOLEAN DEFAULT false;

-- Employee-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer_siret TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gross_monthly_salary NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS net_monthly_salary NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS annual_bonus NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS thirteenth_month NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS overtime_annual NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_real_expenses BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS real_expenses_amount NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_company_health_insurance BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_meal_vouchers BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pee_amount NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS perco_amount NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stock_options_value NUMERIC DEFAULT 0;

-- Self-employed/AE fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_creation_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ape_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_status TEXT DEFAULT 'micro';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS annual_revenue_ht NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_charges_paid NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS office_rent NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_expenses NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_supplies NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS top_clients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accounting_software TEXT;

-- Retired fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_pension_annual NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS complementary_pensions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS liquidation_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supplementary_income NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS capital_gains_2025 NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recent_donations JSONB DEFAULT '[]'::jsonb;

-- Investment: Real Estate
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rental_properties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rental_scheme TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS annual_rental_works NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mortgage_remaining NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ifi_liable BOOLEAN DEFAULT false;

-- Investment: Financial
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pea_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pea_contributions_2025 NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cto_dividends NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cto_capital_gains NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_insurance_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_insurance_contributions NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS life_insurance_withdrawals NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crypto_pnl_2025 NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scpi_investments NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crowdfunding_investments NUMERIC DEFAULT 0;

-- Onboarding Progress
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_analysis_consent BOOLEAN DEFAULT false;

-- Create index for quick onboarding status lookup
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON public.profiles(user_id, onboarding_completed);