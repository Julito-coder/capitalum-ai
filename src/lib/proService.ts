import { supabase } from '@/integrations/supabase/client';

export interface MonthlyRevenue {
  id: string;
  userId: string;
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProProfile {
  // Business identity
  companyName: string;
  siret: string;
  apeCode: string;
  fiscalStatus: 'micro' | 'micro_bnc' | 'micro_bic_services' | 'micro_bic_vente' | 'eurl_ir' | 'eurl_is' | 'sasu' | 'ei';
  companyCreationDate: string | null;
  
  // Financial data
  annualRevenueHt: number;
  socialChargesPaid: number;
  officeRent: number;
  vehicleExpenses: number;
  professionalSupplies: number;
  accountingSoftware: string | null;
  
  // Profile completion
  onboardingCompleted: boolean;
}

export interface MonthlyRevenueInput {
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  notes?: string;
}

// Load monthly revenue data for a specific year
export const loadMonthlyRevenue = async (userId: string, year: number): Promise<MonthlyRevenue[]> => {
  const { data, error } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('month', { ascending: true });

  if (error) {
    console.error('Error loading monthly revenue:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    year: row.year,
    month: row.month,
    revenue: Number(row.revenue) || 0,
    expenses: Number(row.expenses) || 0,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Save or update monthly revenue
export const saveMonthlyRevenue = async (
  userId: string, 
  data: MonthlyRevenueInput
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('monthly_revenue')
    .upsert({
      user_id: userId,
      year: data.year,
      month: data.month,
      revenue: data.revenue,
      expenses: data.expenses,
      notes: data.notes,
    }, {
      onConflict: 'user_id,year,month'
    });

  if (error) {
    console.error('Error saving monthly revenue:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Bulk save monthly revenue for a year
export const saveMonthlyRevenuesBulk = async (
  userId: string,
  entries: MonthlyRevenueInput[]
): Promise<{ success: boolean; error?: string }> => {
  const records = entries.map(entry => ({
    user_id: userId,
    year: entry.year,
    month: entry.month,
    revenue: entry.revenue,
    expenses: entry.expenses,
    notes: entry.notes,
  }));

  const { error } = await supabase
    .from('monthly_revenue')
    .upsert(records, {
      onConflict: 'user_id,year,month'
    });

  if (error) {
    console.error('Error bulk saving monthly revenue:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Load Pro profile data
export const loadProProfile = async (userId: string): Promise<ProProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error loading pro profile:', error);
    return null;
  }

  return {
    companyName: data.company_name || '',
    siret: data.siret || '',
    apeCode: data.ape_code || '',
    fiscalStatus: (data.fiscal_status as ProProfile['fiscalStatus']) || 'micro',
    companyCreationDate: data.company_creation_date,
    annualRevenueHt: Number(data.annual_revenue_ht) || 0,
    socialChargesPaid: Number(data.social_charges_paid) || 0,
    officeRent: Number(data.office_rent) || 0,
    vehicleExpenses: Number(data.vehicle_expenses) || 0,
    professionalSupplies: Number(data.professional_supplies) || 0,
    accountingSoftware: data.accounting_software,
    onboardingCompleted: data.onboarding_completed || false,
  };
};

// Save Pro profile data
export const saveProProfile = async (
  userId: string,
  profile: Partial<ProProfile>
): Promise<{ success: boolean; error?: string }> => {
  const updateData: Record<string, any> = {};
  
  if (profile.companyName !== undefined) updateData.company_name = profile.companyName;
  if (profile.siret !== undefined) updateData.siret = profile.siret;
  if (profile.apeCode !== undefined) updateData.ape_code = profile.apeCode;
  if (profile.fiscalStatus !== undefined) updateData.fiscal_status = profile.fiscalStatus;
  if (profile.companyCreationDate !== undefined) updateData.company_creation_date = profile.companyCreationDate;
  if (profile.annualRevenueHt !== undefined) updateData.annual_revenue_ht = profile.annualRevenueHt;
  if (profile.socialChargesPaid !== undefined) updateData.social_charges_paid = profile.socialChargesPaid;
  if (profile.officeRent !== undefined) updateData.office_rent = profile.officeRent;
  if (profile.vehicleExpenses !== undefined) updateData.vehicle_expenses = profile.vehicleExpenses;
  if (profile.professionalSupplies !== undefined) updateData.professional_supplies = profile.professionalSupplies;
  if (profile.accountingSoftware !== undefined) updateData.accounting_software = profile.accountingSoftware;
  if (profile.onboardingCompleted !== undefined) updateData.onboarding_completed = profile.onboardingCompleted;

  // Mark profile as self-employed
  updateData.is_self_employed = true;

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId);

  if (error) {
    console.error('Error saving pro profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Calculate URSSAF rates based on fiscal status
export const getURSSAFRate = (fiscalStatus: string): number => {
  switch (fiscalStatus) {
    case 'micro':
    case 'micro_bnc':
    case 'micro_bic_services':
      return 0.22;
    case 'micro_bic_vente':
      return 0.128;
    default:
      return 0.22;
  }
};

// Calculate annual totals from monthly data
export const calculateAnnualTotals = (monthlyData: MonthlyRevenue[]) => {
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const monthsWithData = monthlyData.filter(m => m.revenue > 0).length;
  const averageMonthlyRevenue = monthsWithData > 0 ? totalRevenue / monthsWithData : 0;

  return {
    totalRevenue,
    totalExpenses,
    monthsWithData,
    averageMonthlyRevenue,
    projectedAnnual: averageMonthlyRevenue * 12,
  };
};

// Get URSSAF payment schedule
export const getURSSAFSchedule = (annualRevenue: number, urssafRate: number) => {
  const quarterlyContribution = (annualRevenue / 4) * urssafRate;
  
  return [
    { period: 'T1', dueDate: '2025-04-30', amount: quarterlyContribution, status: 'pending' as const },
    { period: 'T2', dueDate: '2025-07-31', amount: quarterlyContribution, status: 'pending' as const },
    { period: 'T3', dueDate: '2025-10-31', amount: quarterlyContribution, status: 'pending' as const },
    { period: 'T4', dueDate: '2026-01-31', amount: quarterlyContribution, status: 'pending' as const },
  ];
};
