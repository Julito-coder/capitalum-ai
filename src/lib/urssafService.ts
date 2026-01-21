import { supabase } from '@/integrations/supabase/client';
import { MonthlyRevenue, loadMonthlyRevenue, getURSSAFRate } from './proService';

export interface URSSAFContribution {
  id: string;
  userId: string;
  year: number;
  month: number;
  quarter: number;
  revenueDeclared: number;
  contributionAmount: number;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyContribution {
  month: number;
  monthName: string;
  revenue: number;
  contribution: number;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
}

export interface QuarterData {
  quarter: number;
  months: MonthlyContribution[];
  totalRevenue: number;
  totalContribution: number;
  dueDate: string;
  allPaid: boolean;
}

// Load URSSAF contributions for a year
export const loadURSSAFContributions = async (userId: string, year: number): Promise<URSSAFContribution[]> => {
  const { data, error } = await supabase
    .from('urssaf_contributions')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('month', { ascending: true });

  if (error) {
    console.error('Error loading URSSAF contributions:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    year: row.year,
    month: row.month,
    quarter: row.quarter,
    revenueDeclared: Number(row.revenue_declared) || 0,
    contributionAmount: Number(row.contribution_amount) || 0,
    isPaid: row.is_paid,
    paidDate: row.paid_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Save or update URSSAF contribution for a month
export const saveURSSAFContribution = async (
  userId: string,
  year: number,
  month: number,
  data: {
    revenueDeclared: number;
    contributionAmount: number;
    isPaid: boolean;
    paidDate?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  const quarter = Math.ceil(month / 3);

  const { error } = await supabase
    .from('urssaf_contributions')
    .upsert({
      user_id: userId,
      year,
      month,
      quarter,
      revenue_declared: data.revenueDeclared,
      contribution_amount: data.contributionAmount,
      is_paid: data.isPaid,
      paid_date: data.paidDate,
      notes: data.notes,
    }, {
      onConflict: 'user_id,year,month'
    });

  if (error) {
    console.error('Error saving URSSAF contribution:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Toggle paid status for a month
export const toggleContributionPaid = async (
  userId: string,
  year: number,
  month: number,
  isPaid: boolean
): Promise<{ success: boolean; error?: string }> => {
  const paidDate = isPaid ? new Date().toISOString().split('T')[0] : null;

  const { error } = await supabase
    .from('urssaf_contributions')
    .upsert({
      user_id: userId,
      year,
      month,
      quarter: Math.ceil(month / 3),
      is_paid: isPaid,
      paid_date: paidDate,
    }, {
      onConflict: 'user_id,year,month'
    });

  if (error) {
    console.error('Error toggling contribution paid:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Month names in French
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Get quarter due dates
const getQuarterDueDate = (year: number, quarter: number): string => {
  const dueDates: Record<number, string> = {
    1: `${year}-04-30`,
    2: `${year}-07-31`,
    3: `${year}-10-31`,
    4: `${year + 1}-01-31`,
  };
  return dueDates[quarter] || '';
};

// Build quarterly data from monthly revenue and contributions
export const buildQuarterlyData = (
  monthlyRevenue: MonthlyRevenue[],
  contributions: URSSAFContribution[],
  year: number,
  urssafRate: number
): QuarterData[] => {
  const quarters: QuarterData[] = [];

  for (let q = 1; q <= 4; q++) {
    const startMonth = (q - 1) * 3 + 1;
    const months: MonthlyContribution[] = [];
    let totalRevenue = 0;
    let totalContribution = 0;
    let allPaid = true;

    for (let m = startMonth; m < startMonth + 3; m++) {
      const revenueData = monthlyRevenue.find(r => r.month === m);
      const contribData = contributions.find(c => c.month === m);
      
      const revenue = revenueData?.revenue || 0;
      const contribution = contribData?.contributionAmount || (revenue * urssafRate);
      const isPaid = contribData?.isPaid || false;

      if (!isPaid && revenue > 0) allPaid = false;

      months.push({
        month: m,
        monthName: MONTH_NAMES[m - 1],
        revenue,
        contribution,
        isPaid,
        paidDate: contribData?.paidDate,
        notes: contribData?.notes,
      });

      totalRevenue += revenue;
      totalContribution += contribution;
    }

    quarters.push({
      quarter: q,
      months,
      totalRevenue,
      totalContribution,
      dueDate: getQuarterDueDate(year, q),
      allPaid: allPaid && totalRevenue > 0,
    });
  }

  return quarters;
};

// Simulate contributions based on revenue
export interface SimulationResult {
  annualRevenue: number;
  urssafRate: number;
  quarterlyContribution: number;
  annualContribution: number;
  netAfterContributions: number;
  monthlyNet: number;
}

export const simulateContributions = (
  annualRevenue: number,
  fiscalStatus: string
): SimulationResult => {
  const urssafRate = getURSSAFRate(fiscalStatus);
  const annualContribution = annualRevenue * urssafRate;
  const quarterlyContribution = annualContribution / 4;
  const netAfterContributions = annualRevenue - annualContribution;
  const monthlyNet = netAfterContributions / 12;

  return {
    annualRevenue,
    urssafRate,
    quarterlyContribution,
    annualContribution,
    netAfterContributions,
    monthlyNet,
  };
};

// Sync contributions from monthly revenue
export const syncContributionsFromRevenue = async (
  userId: string,
  year: number,
  fiscalStatus: string
): Promise<{ success: boolean; error?: string }> => {
  const urssafRate = getURSSAFRate(fiscalStatus);
  const monthlyRevenue = await loadMonthlyRevenue(userId, year);
  const existingContribs = await loadURSSAFContributions(userId, year);

  const updates: Array<{
    user_id: string;
    year: number;
    month: number;
    quarter: number;
    revenue_declared: number;
    contribution_amount: number;
    is_paid: boolean;
    paid_date: string | null;
  }> = [];

  for (let month = 1; month <= 12; month++) {
    const revenueData = monthlyRevenue.find(r => r.month === month);
    const existingContrib = existingContribs.find(c => c.month === month);

    const revenue = revenueData?.revenue || 0;
    const contribution = revenue * urssafRate;

    updates.push({
      user_id: userId,
      year,
      month,
      quarter: Math.ceil(month / 3),
      revenue_declared: revenue,
      contribution_amount: contribution,
      is_paid: existingContrib?.isPaid || false,
      paid_date: existingContrib?.paidDate || null,
    });
  }

  const { error } = await supabase
    .from('urssaf_contributions')
    .upsert(updates, { onConflict: 'user_id,year,month' });

  if (error) {
    console.error('Error syncing contributions:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
