import { loadUserProfile, UserProfile } from './dashboardService';
import { AIDE_CATALOG, AideDefinition, AideStatus } from './aidesData';

export interface ClassifiedAide {
  aide: AideDefinition;
  status: AideStatus;
  estimatedAmount: { min: number; max: number; period: string } | null;
}

export interface AidesResult {
  eligible: ClassifiedAide[];
  toVerify: ClassifiedAide[];
  notEligible: ClassifiedAide[];
  totalEligibleAnnual: number;
  profileComplete: boolean;
}

const isProfileComplete = (p: UserProfile): boolean => {
  const hasIncome = p.grossMonthlySalary > 0 || p.annualRevenueHt > 0 || p.mainPensionAnnual > 0;
  const hasStatus = p.isEmployee || p.isSelfEmployed || p.isRetired;
  return hasIncome && hasStatus;
};

const toAnnual = (amount: { min: number; max: number; period: string }): number => {
  const avg = (amount.min + amount.max) / 2;
  if (amount.period === 'mois') return avg * 12;
  if (amount.period === 'an') return avg;
  return avg; // 'projet' — count once
};

export const classifyAides = (profile: UserProfile): AidesResult => {
  const eligible: ClassifiedAide[] = [];
  const toVerify: ClassifiedAide[] = [];
  const notEligible: ClassifiedAide[] = [];

  for (const aide of AIDE_CATALOG) {
    const status = aide.eligibilityCheck(profile);
    const estimatedAmount = status !== 'not_eligible' ? aide.estimateAmount(profile) : null;
    const item: ClassifiedAide = { aide, status, estimatedAmount };

    if (status === 'eligible') eligible.push(item);
    else if (status === 'to_verify') toVerify.push(item);
    else notEligible.push(item);
  }

  const totalEligibleAnnual = eligible.reduce((sum, item) => {
    return sum + (item.estimatedAmount ? toAnnual(item.estimatedAmount) : 0);
  }, 0);

  return {
    eligible,
    toVerify,
    notEligible,
    totalEligibleAnnual,
    profileComplete: isProfileComplete(profile),
  };
};

export const loadAidesForUser = async (userId: string): Promise<AidesResult | null> => {
  const profile = await loadUserProfile(userId);
  if (!profile) return null;
  return classifyAides(profile);
};
