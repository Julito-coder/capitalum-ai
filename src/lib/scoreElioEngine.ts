import { ModernOnboardingData } from '@/data/modernOnboardingTypes';

export interface ElioScoreResult {
  score: number;
  totalLoss: number;
  breakdown: {
    aids: number;
    tax: number;
    contracts: number;
  };
}

export const calculateElioScore = (data: ModernOnboardingData): ElioScoreResult => {
  let aidsLoss = 0;
  let taxLoss = 0;
  let contractsLoss = 0;

  const { professionalStatus, incomeRange, housingStatus, childrenRange, familyStatus, ageRange } = data;

  // --- AIDES NON RÉCLAMÉES ---
  if (
    (professionalStatus === 'employee' || professionalStatus === 'self_employed') &&
    (incomeRange === 'less_1000' || incomeRange === '1000_1800')
  ) {
    aidsLoss += 1440;
  }

  if (
    housingStatus === 'tenant' &&
    (incomeRange === 'less_1000' || incomeRange === '1000_1800' || incomeRange === '1800_3000')
  ) {
    aidsLoss += 720;
  }

  if (professionalStatus === 'student') {
    aidsLoss += 1020;
  }

  if (childrenRange === '3_or_more') {
    aidsLoss += 3000;
  } else if (childrenRange === '1_or_2') {
    aidsLoss += 1500;
  }

  if (childrenRange === '3_or_more') {
    aidsLoss += 1200;
  } else if (childrenRange === '1_or_2') {
    aidsLoss += 400;
  }

  // --- OPTIMISATIONS FISCALES ---
  if (
    professionalStatus === 'employee' &&
    (incomeRange === '1800_3000' || incomeRange === '3000_5000' || incomeRange === 'more_5000')
  ) {
    taxLoss += 420;
  }

  if (
    (familyStatus === 'couple' || familyStatus === 'married') &&
    childrenRange !== 'none' &&
    childrenRange !== null
  ) {
    taxLoss += 600;
  }

  if (
    (ageRange === '36_50' || ageRange === '51_plus') &&
    (incomeRange === '3000_5000' || incomeRange === 'more_5000')
  ) {
    taxLoss += 840;
  }

  // --- CONTRATS NON OPTIMISÉS ---
  contractsLoss += 240;
  if (housingStatus === 'owner') contractsLoss += 300;
  if (childrenRange !== 'none' && childrenRange !== null) contractsLoss += 200;

  const totalLoss = aidsLoss + taxLoss + contractsLoss;
  const maxLoss = 8000;
  const score = Math.max(5, Math.min(95, Math.round(100 - (totalLoss / maxLoss) * 100)));

  return {
    score,
    totalLoss,
    breakdown: { aids: aidsLoss, tax: taxLoss, contracts: contractsLoss },
  };
};
