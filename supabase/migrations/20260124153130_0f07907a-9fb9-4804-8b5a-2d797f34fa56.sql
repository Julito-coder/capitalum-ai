-- Real Estate Projects main table
CREATE TABLE public.real_estate_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'LOCATIF' CHECK (type IN ('LOCATIF', 'RP')),
  title TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  zone_id UUID,
  surface_m2 NUMERIC NOT NULL DEFAULT 0,
  rooms INTEGER DEFAULT 1,
  property_type TEXT DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'house', 'other')),
  is_new BOOLEAN DEFAULT false,
  dpe TEXT,
  floor INTEGER,
  strategy TEXT DEFAULT 'nu' CHECK (strategy IN ('nu', 'meuble', 'coloc', 'saisonnier')),
  horizon_years INTEGER DEFAULT 20,
  ownership_type TEXT DEFAULT 'personal' CHECK (ownership_type IN ('personal', 'sci', 'other')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Acquisition data
CREATE TABLE public.acquisition_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  price_net_seller NUMERIC NOT NULL DEFAULT 0,
  agency_fee_amount NUMERIC DEFAULT 0,
  agency_fee_pct NUMERIC DEFAULT 0,
  notary_fee_amount NUMERIC DEFAULT 0,
  notary_fee_estimated BOOLEAN DEFAULT true,
  works_amount NUMERIC DEFAULT 0,
  works_schedule_months INTEGER DEFAULT 0,
  furniture_amount NUMERIC DEFAULT 0,
  bank_fees NUMERIC DEFAULT 0,
  guarantee_fees NUMERIC DEFAULT 0,
  brokerage_fees NUMERIC DEFAULT 0,
  total_project_cost NUMERIC GENERATED ALWAYS AS (
    price_net_seller + COALESCE(agency_fee_amount, 0) + COALESCE(notary_fee_amount, 0) + 
    COALESCE(works_amount, 0) + COALESCE(furniture_amount, 0) + COALESCE(bank_fees, 0) + 
    COALESCE(guarantee_fees, 0) + COALESCE(brokerage_fees, 0)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financing data
CREATE TABLE public.financing_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  down_payment NUMERIC DEFAULT 0,
  down_payment_allocation TEXT DEFAULT 'fees' CHECK (down_payment_allocation IN ('fees', 'capital', 'mixed')),
  loan_amount NUMERIC DEFAULT 0,
  duration_months INTEGER DEFAULT 240,
  nominal_rate NUMERIC DEFAULT 3.5,
  insurance_mode TEXT DEFAULT 'percentage' CHECK (insurance_mode IN ('percentage', 'fixed')),
  insurance_value NUMERIC DEFAULT 0.3,
  deferment_type TEXT DEFAULT 'none' CHECK (deferment_type IN ('none', 'partial', 'total')),
  deferment_months INTEGER DEFAULT 0,
  monthly_payment NUMERIC DEFAULT 0,
  total_interest NUMERIC DEFAULT 0,
  total_insurance NUMERIC DEFAULT 0,
  amortization_table JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rental income data (for LOCATIF)
CREATE TABLE public.rental_income_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  rent_monthly NUMERIC DEFAULT 0,
  recoverable_charges NUMERIC DEFAULT 0,
  vacancy_rate NUMERIC DEFAULT 5,
  default_rate NUMERIC DEFAULT 2,
  rent_growth_rate NUMERIC DEFAULT 1,
  is_seasonal BOOLEAN DEFAULT false,
  seasonal_occupancy_rate NUMERIC DEFAULT 70,
  seasonal_avg_night NUMERIC DEFAULT 0,
  seasonal_platform_fees NUMERIC DEFAULT 15,
  seasonal_cleaning_fees NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Owner occupier data (for RP)
CREATE TABLE public.owner_occupier_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  avoided_rent_monthly NUMERIC DEFAULT 0,
  value_growth_rate NUMERIC DEFAULT 2,
  scenario_type TEXT DEFAULT 'base' CHECK (scenario_type IN ('prudent', 'base', 'optimist')),
  prudent_growth_rate NUMERIC DEFAULT 1,
  optimist_growth_rate NUMERIC DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Operating costs
CREATE TABLE public.operating_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  property_tax_annual NUMERIC DEFAULT 0,
  property_tax_growth_rate NUMERIC DEFAULT 2,
  condo_nonrecoverable_annual NUMERIC DEFAULT 0,
  insurance_annual NUMERIC DEFAULT 0,
  maintenance_mode TEXT DEFAULT 'percentage' CHECK (maintenance_mode IN ('percentage', 'fixed')),
  maintenance_value NUMERIC DEFAULT 5,
  management_pct NUMERIC DEFAULT 0,
  letting_fees_annual NUMERIC DEFAULT 0,
  accounting_annual NUMERIC DEFAULT 0,
  cfe_annual NUMERIC DEFAULT 0,
  utilities_annual NUMERIC DEFAULT 0,
  other_costs JSONB DEFAULT '[]'::jsonb,
  costs_growth_rate NUMERIC DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tax configuration
CREATE TABLE public.tax_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  tax_mode TEXT DEFAULT 'simple' CHECK (tax_mode IN ('simple', 'advanced', 'override')),
  tmi_rate NUMERIC DEFAULT 30,
  social_rate NUMERIC DEFAULT 17.2,
  regime_key TEXT DEFAULT 'micro_foncier',
  interest_deductible BOOLEAN DEFAULT true,
  costs_deductible BOOLEAN DEFAULT true,
  amortization_enabled BOOLEAN DEFAULT false,
  amortization_components JSONB DEFAULT '[
    {"name": "bati", "value_pct": 80, "duration_years": 30},
    {"name": "mobilier", "value_pct": 100, "duration_years": 7},
    {"name": "travaux", "value_pct": 100, "duration_years": 10}
  ]'::jsonb,
  deficit_enabled BOOLEAN DEFAULT false,
  annual_tax_override NUMERIC,
  capital_gain_mode TEXT DEFAULT 'simple' CHECK (capital_gain_mode IN ('simple', 'advanced')),
  capital_gain_rate NUMERIC DEFAULT 36.2,
  exploitation_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sale/Resale data
CREATE TABLE public.sale_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  resale_year INTEGER DEFAULT 20,
  property_growth_rate NUMERIC DEFAULT 2,
  resale_agency_pct NUMERIC DEFAULT 5,
  resale_other_fees NUMERIC DEFAULT 0,
  capital_gain_tax_rate NUMERIC DEFAULT 36.2,
  net_sale_proceeds NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zone data (market data by location)
CREATE TABLE public.zone_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT DEFAULT 'FR',
  region TEXT,
  city TEXT NOT NULL,
  postal_code_prefix TEXT,
  zone_category TEXT DEFAULT 'B1' CHECK (zone_category IN ('A', 'A_bis', 'B1', 'B2', 'C')),
  price_per_m2_default NUMERIC DEFAULT 3000,
  rent_per_m2_default NUMERIC DEFAULT 12,
  vacancy_default NUMERIC DEFAULT 5,
  property_tax_estimate NUMERIC DEFAULT 1000,
  charges_estimate NUMERIC DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Simulation results cache
CREATE TABLE public.simulation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  gross_yield NUMERIC DEFAULT 0,
  net_yield NUMERIC DEFAULT 0,
  net_net_yield NUMERIC DEFAULT 0,
  monthly_cashflow_before_tax NUMERIC DEFAULT 0,
  monthly_cashflow_after_tax NUMERIC DEFAULT 0,
  monthly_effort NUMERIC DEFAULT 0,
  irr NUMERIC DEFAULT 0,
  net_patrimony NUMERIC DEFAULT 0,
  dscr NUMERIC DEFAULT 0,
  break_even_rent NUMERIC DEFAULT 0,
  break_even_price NUMERIC DEFAULT 0,
  break_even_rate NUMERIC DEFAULT 0,
  cashflow_series JSONB DEFAULT '[]'::jsonb,
  patrimony_series JSONB DEFAULT '[]'::jsonb,
  sensitivity_data JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.real_estate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_income_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_occupier_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for real_estate_projects
CREATE POLICY "Users can view their own projects" ON public.real_estate_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.real_estate_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.real_estate_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.real_estate_projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for acquisition_data (via project ownership)
CREATE POLICY "Users can view acquisition data for their projects" ON public.acquisition_data FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert acquisition data for their projects" ON public.acquisition_data FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update acquisition data for their projects" ON public.acquisition_data FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete acquisition data for their projects" ON public.acquisition_data FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for financing_data
CREATE POLICY "Users can view financing data for their projects" ON public.financing_data FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert financing data for their projects" ON public.financing_data FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update financing data for their projects" ON public.financing_data FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete financing data for their projects" ON public.financing_data FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for rental_income_data
CREATE POLICY "Users can view rental income data for their projects" ON public.rental_income_data FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert rental income data for their projects" ON public.rental_income_data FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update rental income data for their projects" ON public.rental_income_data FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete rental income data for their projects" ON public.rental_income_data FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for owner_occupier_data
CREATE POLICY "Users can view owner occupier data for their projects" ON public.owner_occupier_data FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert owner occupier data for their projects" ON public.owner_occupier_data FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update owner occupier data for their projects" ON public.owner_occupier_data FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete owner occupier data for their projects" ON public.owner_occupier_data FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for operating_costs
CREATE POLICY "Users can view operating costs for their projects" ON public.operating_costs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert operating costs for their projects" ON public.operating_costs FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update operating costs for their projects" ON public.operating_costs FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete operating costs for their projects" ON public.operating_costs FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for tax_config
CREATE POLICY "Users can view tax config for their projects" ON public.tax_config FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert tax config for their projects" ON public.tax_config FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update tax config for their projects" ON public.tax_config FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete tax config for their projects" ON public.tax_config FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for sale_data
CREATE POLICY "Users can view sale data for their projects" ON public.sale_data FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert sale data for their projects" ON public.sale_data FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update sale data for their projects" ON public.sale_data FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete sale data for their projects" ON public.sale_data FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- RLS Policies for zone_data (public read, admin write)
CREATE POLICY "Anyone can view zone data" ON public.zone_data FOR SELECT USING (true);

-- RLS Policies for simulation_results
CREATE POLICY "Users can view simulation results for their projects" ON public.simulation_results FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert simulation results for their projects" ON public.simulation_results FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can update simulation results for their projects" ON public.simulation_results FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete simulation results for their projects" ON public.simulation_results FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.real_estate_projects WHERE id = project_id AND user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_real_estate_projects_updated_at BEFORE UPDATE ON public.real_estate_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_acquisition_data_updated_at BEFORE UPDATE ON public.acquisition_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financing_data_updated_at BEFORE UPDATE ON public.financing_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rental_income_data_updated_at BEFORE UPDATE ON public.rental_income_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_owner_occupier_data_updated_at BEFORE UPDATE ON public.owner_occupier_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operating_costs_updated_at BEFORE UPDATE ON public.operating_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_config_updated_at BEFORE UPDATE ON public.tax_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sale_data_updated_at BEFORE UPDATE ON public.sale_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zone_data_updated_at BEFORE UPDATE ON public.zone_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_simulation_results_updated_at BEFORE UPDATE ON public.simulation_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default zone data for major French cities
INSERT INTO public.zone_data (city, postal_code_prefix, zone_category, price_per_m2_default, rent_per_m2_default, vacancy_default, property_tax_estimate, charges_estimate) VALUES
('Paris', '75', 'A_bis', 10500, 28, 2, 1500, 50),
('Lyon', '69', 'A', 5200, 16, 3, 1200, 40),
('Marseille', '13', 'A', 3800, 13, 5, 1000, 35),
('Bordeaux', '33', 'A', 4800, 14, 4, 1100, 38),
('Nice', '06', 'A', 5500, 17, 4, 1300, 42),
('Toulouse', '31', 'A', 3500, 12, 4, 900, 32),
('Nantes', '44', 'A', 4200, 13, 3, 950, 35),
('Montpellier', '34', 'A', 3600, 13, 5, 950, 34),
('Strasbourg', '67', 'B1', 3200, 12, 4, 850, 32),
('Lille', '59', 'A', 3400, 13, 4, 900, 33),
('Rennes', '35', 'B1', 3800, 12, 3, 900, 34),
('Annecy', '74', 'B1', 5000, 15, 3, 1100, 40),
('Cannes', '06', 'A', 6500, 20, 5, 1400, 45),
('Antibes', '06', 'A', 5800, 18, 4, 1250, 42);