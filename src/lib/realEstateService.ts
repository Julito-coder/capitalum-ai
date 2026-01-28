// Service for real estate project CRUD operations

import { supabase } from '@/integrations/supabase/client';
import {
  RealEstateProject,
  AcquisitionData,
  FinancingData,
  RentalIncomeData,
  OwnerOccupierData,
  OperatingCosts,
  TaxConfig,
  SaleData,
  SimulationResults,
  ZoneData,
  FullProjectData,
  WizardState,
} from './realEstateTypes';
import { calculateSimulation, generateAmortizationTable, calculateMonthlyPayment, calculateInsurance } from './simulationEngine';

// Fetch all projects for current user
export async function fetchProjects(): Promise<RealEstateProject[]> {
  const { data, error } = await supabase
    .from('real_estate_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as RealEstateProject[];
}

// Fetch single project with all related data
export async function fetchFullProject(projectId: string): Promise<FullProjectData | null> {
  const [
    projectRes,
    acquisitionRes,
    financingRes,
    rentalRes,
    ownerRes,
    costsRes,
    taxRes,
    saleRes,
    resultsRes,
  ] = await Promise.all([
    supabase.from('real_estate_projects').select('*').eq('id', projectId).single(),
    supabase.from('acquisition_data').select('*').eq('project_id', projectId).single(),
    supabase.from('financing_data').select('*').eq('project_id', projectId).single(),
    supabase.from('rental_income_data').select('*').eq('project_id', projectId).maybeSingle(),
    supabase.from('owner_occupier_data').select('*').eq('project_id', projectId).maybeSingle(),
    supabase.from('operating_costs').select('*').eq('project_id', projectId).single(),
    supabase.from('tax_config').select('*').eq('project_id', projectId).single(),
    supabase.from('sale_data').select('*').eq('project_id', projectId).single(),
    supabase.from('simulation_results').select('*').eq('project_id', projectId).maybeSingle(),
  ]);

  if (projectRes.error || !projectRes.data) return null;

  return {
    project: projectRes.data as unknown as RealEstateProject,
    acquisition: acquisitionRes.data as unknown as AcquisitionData,
    financing: financingRes.data as unknown as FinancingData,
    rental: rentalRes.data as unknown as RentalIncomeData | undefined,
    owner_occupier: ownerRes.data as unknown as OwnerOccupierData | undefined,
    operating_costs: costsRes.data as unknown as OperatingCosts,
    tax_config: taxRes.data as unknown as TaxConfig,
    sale_data: saleRes.data as unknown as SaleData,
    results: resultsRes.data as unknown as SimulationResults | undefined,
  };
}

// Create new project from wizard state
export async function createProject(userId: string, wizardState: WizardState): Promise<string> {
  const projectData = {
    user_id: userId,
    type: wizardState.project.type || 'LOCATIF',
    title: wizardState.project.title || 'Nouveau projet',
    city: wizardState.project.city,
    postal_code: wizardState.project.postal_code,
    surface_m2: wizardState.project.surface_m2 || 0,
    rooms: wizardState.project.rooms || 1,
    property_type: wizardState.project.property_type || 'apartment',
    is_new: wizardState.project.is_new || false,
    strategy: wizardState.project.strategy || 'nu',
    horizon_years: wizardState.project.horizon_years || 20,
    ownership_type: wizardState.project.ownership_type || 'personal',
    status: 'active' as const,
    tags: wizardState.project.tags || [],
  };

  const { data: project, error: projectError } = await supabase
    .from('real_estate_projects')
    .insert(projectData)
    .select()
    .single();

  if (projectError) throw projectError;
  const projectId = project.id;

  const loanAmount = wizardState.financing.loan_amount || 
    ((wizardState.acquisition.price_net_seller || 0) + 
     (wizardState.acquisition.notary_fee_amount || 0) - 
     (wizardState.financing.down_payment || 0));
  
  const monthlyPayment = calculateMonthlyPayment(loanAmount, wizardState.financing.nominal_rate || 3.5, wizardState.financing.duration_months || 240);
  const insurance = calculateInsurance(loanAmount, wizardState.financing.insurance_mode || 'percentage', wizardState.financing.insurance_value || 0.3);
  const amortizationTable = generateAmortizationTable(loanAmount, wizardState.financing.nominal_rate || 3.5, wizardState.financing.duration_months || 240, wizardState.financing.insurance_mode || 'percentage', wizardState.financing.insurance_value || 0.3);
  const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interest, 0);
  const totalInsurance = amortizationTable.reduce((sum, row) => sum + row.insurance, 0);

  await Promise.all([
    supabase.from('acquisition_data').insert({
      project_id: projectId,
      price_net_seller: wizardState.acquisition.price_net_seller || 0,
      agency_fee_amount: wizardState.acquisition.agency_fee_amount || 0,
      notary_fee_amount: wizardState.acquisition.notary_fee_amount || 0,
      works_amount: wizardState.acquisition.works_amount || 0,
      furniture_amount: wizardState.acquisition.furniture_amount || 0,
      bank_fees: wizardState.acquisition.bank_fees || 0,
      guarantee_fees: wizardState.acquisition.guarantee_fees || 0,
    }),
    supabase.from('financing_data').insert({
      project_id: projectId,
      down_payment: wizardState.financing.down_payment || 0,
      loan_amount: loanAmount,
      duration_months: wizardState.financing.duration_months || 240,
      nominal_rate: wizardState.financing.nominal_rate || 3.5,
      insurance_mode: wizardState.financing.insurance_mode || 'percentage',
      insurance_value: wizardState.financing.insurance_value || 0.3,
      monthly_payment: monthlyPayment + insurance,
      total_interest: totalInterest,
      total_insurance: totalInsurance,
      amortization_table: JSON.parse(JSON.stringify(amortizationTable)),
    }),
    supabase.from('operating_costs').insert({
      project_id: projectId,
      property_tax_annual: wizardState.operating_costs.property_tax_annual || 0,
      condo_nonrecoverable_annual: wizardState.operating_costs.condo_nonrecoverable_annual || 0,
      insurance_annual: wizardState.operating_costs.insurance_annual || 0,
      maintenance_value: wizardState.operating_costs.maintenance_value || 5,
      management_pct: wizardState.operating_costs.management_pct || 0,
      accounting_annual: wizardState.operating_costs.accounting_annual || 0,
    }),
    supabase.from('tax_config').insert({
      project_id: projectId,
      tax_mode: wizardState.tax_config.tax_mode || 'simple',
      tmi_rate: wizardState.tax_config.tmi_rate || 30,
      social_rate: wizardState.tax_config.social_rate || 17.2,
      regime_key: wizardState.tax_config.regime_key || 'micro_foncier',
      amortization_enabled: wizardState.tax_config.amortization_enabled || false,
    }),
    supabase.from('sale_data').insert({
      project_id: projectId,
      resale_year: wizardState.sale_data.resale_year || 20,
      property_growth_rate: wizardState.sale_data.property_growth_rate || 2,
      resale_agency_pct: wizardState.sale_data.resale_agency_pct || 5,
    }),
    wizardState.project.type === 'LOCATIF' 
      ? supabase.from('rental_income_data').insert({
          project_id: projectId,
          rent_monthly: wizardState.rental?.rent_monthly || 0,
          vacancy_rate: wizardState.rental?.vacancy_rate || 5,
          default_rate: wizardState.rental?.default_rate || 2,
          rent_growth_rate: wizardState.rental?.rent_growth_rate || 1,
        })
      : supabase.from('owner_occupier_data').insert({
          project_id: projectId,
          avoided_rent_monthly: wizardState.owner_occupier?.avoided_rent_monthly || 0,
          value_growth_rate: wizardState.owner_occupier?.value_growth_rate || 2,
          household_income_monthly: wizardState.owner_occupier?.household_income_monthly || 0,
          existing_credits_monthly: wizardState.owner_occupier?.existing_credits_monthly || 0,
          other_charges_monthly: wizardState.owner_occupier?.other_charges_monthly || 0,
          remaining_liquidity: wizardState.owner_occupier?.remaining_liquidity || 0,
          household_members: JSON.stringify(wizardState.owner_occupier?.household_members || []),
        }),
  ]);

  await recalculateProject(projectId);
  return projectId;
}

// Recalculate simulation for a project
export async function recalculateProject(projectId: string): Promise<SimulationResults | null> {
  const fullData = await fetchFullProject(projectId);
  if (!fullData) return null;

  const results = calculateSimulation(fullData);
  
  await supabase.from('simulation_results').delete().eq('project_id', projectId);
  await supabase.from('simulation_results').insert({
    project_id: projectId,
    gross_yield: results.gross_yield,
    net_yield: results.net_yield,
    net_net_yield: results.net_net_yield,
    monthly_cashflow_before_tax: results.monthly_cashflow_before_tax,
    monthly_cashflow_after_tax: results.monthly_cashflow_after_tax,
    monthly_effort: results.monthly_effort,
    irr: results.irr,
    net_patrimony: results.net_patrimony,
    dscr: results.dscr,
    break_even_rent: results.break_even_rent,
    break_even_price: results.break_even_price,
    break_even_rate: results.break_even_rate,
    cashflow_series: JSON.parse(JSON.stringify(results.cashflow_series)),
    patrimony_series: JSON.parse(JSON.stringify(results.patrimony_series)),
    sensitivity_data: JSON.parse(JSON.stringify(results.sensitivity_data)),
  });

  return results;
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
  await supabase.from('real_estate_projects').delete().eq('id', projectId);
}

// Duplicate a project
export async function duplicateProject(projectId: string, userId: string): Promise<string> {
  const fullData = await fetchFullProject(projectId);
  if (!fullData) throw new Error('Project not found');

  const wizardState: WizardState = {
    currentStep: 0,
    mode: 'essential',
    project: { ...fullData.project, title: `${fullData.project.title} (copie)` },
    acquisition: fullData.acquisition,
    financing: fullData.financing,
    rental: fullData.rental || {},
    owner_occupier: fullData.owner_occupier || {},
    operating_costs: fullData.operating_costs,
    tax_config: fullData.tax_config,
    sale_data: fullData.sale_data,
  };

  return createProject(userId, wizardState);
}

// Fetch zone data
export async function fetchZones(): Promise<ZoneData[]> {
  const { data, error } = await supabase.from('zone_data').select('*').order('city');
  if (error) throw error;
  return (data || []) as unknown as ZoneData[];
}

// Fetch zone by city
export async function fetchZoneByCity(city: string): Promise<ZoneData | null> {
  const { data } = await supabase.from('zone_data').select('*').ilike('city', `%${city}%`).limit(1).maybeSingle();
  return data as unknown as ZoneData | null;
}
