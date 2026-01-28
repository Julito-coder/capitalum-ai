// Types for Real Estate Simulator

export type ProjectType = 'LOCATIF' | 'RP';
export type PropertyType = 'apartment' | 'house' | 'other';
export type Strategy = 'nu' | 'meuble' | 'coloc' | 'saisonnier';
export type OwnershipType = 'personal' | 'sci' | 'other';
export type TaxMode = 'simple' | 'advanced' | 'override';
export type InsuranceMode = 'percentage' | 'fixed';
export type DefermentType = 'none' | 'partial' | 'total';
export type MaintenanceMode = 'percentage' | 'fixed';
export type ScenarioType = 'prudent' | 'base' | 'optimist';
export type ZoneCategory = 'A' | 'A_bis' | 'B1' | 'B2' | 'C';

export interface RealEstateProject {
  id: string;
  user_id: string;
  type: ProjectType;
  title: string;
  city?: string;
  postal_code?: string;
  zone_id?: string;
  surface_m2: number;
  rooms: number;
  property_type: PropertyType;
  is_new: boolean;
  dpe?: string;
  floor?: number;
  strategy: Strategy;
  horizon_years: number;
  ownership_type: OwnershipType;
  status: 'draft' | 'active' | 'archived';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AcquisitionData {
  id?: string;
  project_id: string;
  price_net_seller: number;
  agency_fee_amount: number;
  agency_fee_pct: number;
  notary_fee_amount: number;
  notary_fee_estimated: boolean;
  works_amount: number;
  works_schedule_months: number;
  furniture_amount: number;
  bank_fees: number;
  guarantee_fees: number;
  brokerage_fees: number;
  total_project_cost?: number;
}

export interface FinancingData {
  id?: string;
  project_id: string;
  down_payment: number;
  down_payment_allocation: 'fees' | 'capital' | 'mixed';
  loan_amount: number;
  duration_months: number;
  nominal_rate: number;
  insurance_mode: InsuranceMode;
  insurance_value: number;
  deferment_type: DefermentType;
  deferment_months: number;
  monthly_payment: number;
  total_interest: number;
  total_insurance: number;
  amortization_table: AmortizationRow[];
}

export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  insurance: number;
  remaining_balance: number;
}

export interface RentalIncomeData {
  id?: string;
  project_id: string;
  rent_monthly: number;
  recoverable_charges: number;
  vacancy_rate: number;
  default_rate: number;
  rent_growth_rate: number;
  is_seasonal: boolean;
  seasonal_occupancy_rate: number;
  seasonal_avg_night: number;
  seasonal_platform_fees: number;
  seasonal_cleaning_fees: number;
}

export interface HouseholdMemberData {
  id?: string;
  firstName: string;
  relation: string;
  professionalStatus: string;
  netMonthlySalary: number;
  contractType: string;
  existingCredits: number;
}

export interface OwnerOccupierData {
  id?: string;
  project_id: string;
  avoided_rent_monthly: number;
  value_growth_rate: number;
  scenario_type: ScenarioType;
  prudent_growth_rate: number;
  optimist_growth_rate: number;
  // Household solvency fields
  household_income_monthly?: number;
  existing_credits_monthly?: number;
  other_charges_monthly?: number;
  remaining_liquidity?: number;
  household_members?: HouseholdMemberData[];
}

export interface OperatingCosts {
  id?: string;
  project_id: string;
  property_tax_annual: number;
  property_tax_growth_rate: number;
  condo_nonrecoverable_annual: number;
  insurance_annual: number;
  maintenance_mode: MaintenanceMode;
  maintenance_value: number;
  management_pct: number;
  letting_fees_annual: number;
  accounting_annual: number;
  cfe_annual: number;
  utilities_annual: number;
  other_costs: { name: string; amount: number }[];
  costs_growth_rate: number;
}

export interface TaxConfig {
  id?: string;
  project_id: string;
  tax_mode: TaxMode;
  tmi_rate: number;
  social_rate: number;
  regime_key: string;
  interest_deductible: boolean;
  costs_deductible: boolean;
  amortization_enabled: boolean;
  amortization_components: AmortizationComponent[];
  deficit_enabled: boolean;
  annual_tax_override?: number;
  capital_gain_mode: 'simple' | 'advanced';
  capital_gain_rate: number;
  exploitation_start_date?: string;
}

export interface AmortizationComponent {
  name: string;
  value_pct: number;
  duration_years: number;
}

export interface SaleData {
  id?: string;
  project_id: string;
  resale_year: number;
  property_growth_rate: number;
  resale_agency_pct: number;
  resale_other_fees: number;
  capital_gain_tax_rate: number;
  net_sale_proceeds: number;
}

export interface ZoneData {
  id: string;
  country: string;
  region?: string;
  city: string;
  postal_code_prefix?: string;
  zone_category: ZoneCategory;
  price_per_m2_default: number;
  rent_per_m2_default: number;
  vacancy_default: number;
  property_tax_estimate: number;
  charges_estimate: number;
}

export interface SimulationResults {
  id?: string;
  project_id: string;
  gross_yield: number;
  net_yield: number;
  net_net_yield: number;
  monthly_cashflow_before_tax: number;
  monthly_cashflow_after_tax: number;
  monthly_effort: number;
  irr: number;
  net_patrimony: number;
  dscr: number;
  break_even_rent: number;
  break_even_price: number;
  break_even_rate: number;
  cashflow_series: CashflowYear[];
  patrimony_series: PatrimonyYear[];
  sensitivity_data: SensitivityData;
  calculated_at: string;
}

export interface CashflowYear {
  year: number;
  rental_income: number;
  operating_costs: number;
  loan_payment: number;
  cashflow_before_tax: number;
  tax: number;
  cashflow_after_tax: number;
}

export interface PatrimonyYear {
  year: number;
  property_value: number;
  remaining_debt: number;
  cumulative_cashflow: number;
  net_patrimony: number;
}

export interface SensitivityData {
  rent_sensitivity: { rent: number; cashflow: number; yield: number }[];
  price_sensitivity: { price: number; cashflow: number; yield: number }[];
  rate_sensitivity: { rate: number; cashflow: number; monthly_payment: number }[];
  heatmap: { price: number; rent: number; net_yield: number }[];
}

export interface FullProjectData {
  project: RealEstateProject;
  acquisition: AcquisitionData;
  financing: FinancingData;
  rental?: RentalIncomeData;
  owner_occupier?: OwnerOccupierData;
  operating_costs: OperatingCosts;
  tax_config: TaxConfig;
  sale_data: SaleData;
  results?: SimulationResults;
}

// Wizard state
export interface WizardState {
  currentStep: number;
  mode: 'essential' | 'advanced';
  project: Partial<RealEstateProject>;
  acquisition: Partial<AcquisitionData>;
  financing: Partial<FinancingData>;
  rental: Partial<RentalIncomeData>;
  owner_occupier: Partial<OwnerOccupierData>;
  operating_costs: Partial<OperatingCosts>;
  tax_config: Partial<TaxConfig>;
  sale_data: Partial<SaleData>;
}

export const WIZARD_STEPS = [
  { id: 'project', title: 'Projet', description: 'Type et caractéristiques du bien' },
  { id: 'acquisition', title: 'Acquisition', description: 'Prix et frais d\'achat' },
  { id: 'financing', title: 'Financement', description: 'Prêt et mensualités' },
  { id: 'income', title: 'Revenus', description: 'Loyers ou économie' },
  { id: 'costs', title: 'Charges', description: 'Charges d\'exploitation' },
  { id: 'tax', title: 'Fiscalité', description: 'Régime et imposition' },
  { id: 'sale', title: 'Revente', description: 'Horizon et plus-value' },
];

export const TAX_REGIMES = [
  { key: 'micro_foncier', label: 'Micro-foncier', description: 'Abattement 30%', forType: 'nu' },
  { key: 'reel_foncier', label: 'Réel foncier', description: 'Déduction des charges réelles', forType: 'nu' },
  { key: 'micro_bic', label: 'Micro-BIC', description: 'Abattement 50%', forType: 'meuble' },
  { key: 'lmnp_reel', label: 'LMNP Réel', description: 'Amortissements + charges', forType: 'meuble' },
  { key: 'lmp', label: 'LMP', description: 'Loueur Meublé Professionnel', forType: 'meuble' },
  { key: 'sci_ir', label: 'SCI à l\'IR', description: 'Transparence fiscale', forType: 'sci' },
  { key: 'sci_is', label: 'SCI à l\'IS', description: 'Impôt sur les sociétés', forType: 'sci' },
];
