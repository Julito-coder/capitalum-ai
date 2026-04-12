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

  const { professionalStatus, incomeRange, housingStatus, childrenRange, familyStatus, ageRange, savingsRange, taxDeclarationMode } = data;

  // --- AIDES NON RÉCLAMÉES ---
  // Prime d'activité
  if (
    (professionalStatus === 'employee' || professionalStatus === 'self_employed') &&
    (incomeRange === 'less_1500' || incomeRange === '1500_2500')
  ) {
    aidsLoss += 1440;
  }

  // APL
  if (
    housingStatus === 'tenant' &&
    (incomeRange === 'less_1500' || incomeRange === '1500_2500')
  ) {
    aidsLoss += 720;
  }

  // Bourse CROUS
  if (professionalStatus === 'student') {
    aidsLoss += 1020;
  }

  // RSA / ASS
  if (professionalStatus === 'job_seeker' && incomeRange === 'less_1500') {
    aidsLoss += 1800;
  }

  // Allocations familiales
  if (childrenRange === '3_or_more') {
    aidsLoss += 3000;
  } else if (childrenRange === '2') {
    aidsLoss += 1800;
  } else if (childrenRange === '1') {
    aidsLoss += 900;
  }

  // ARS (allocation rentrée scolaire)
  if (childrenRange === '3_or_more') {
    aidsLoss += 1200;
  } else if (childrenRange === '2') {
    aidsLoss += 800;
  } else if (childrenRange === '1') {
    aidsLoss += 400;
  }

  // --- OPTIMISATIONS FISCALES ---
  // Frais réels
  if (
    professionalStatus === 'employee' &&
    (incomeRange === '2500_4000' || incomeRange === 'more_4000')
  ) {
    taxLoss += 420;
  }

  // Quotient familial
  if (
    (familyStatus === 'couple' || familyStatus === 'married') &&
    childrenRange !== 'none' &&
    childrenRange !== null
  ) {
    taxLoss += 600;
  }

  // PER non optimisé
  if (
    (ageRange === '36_50' || ageRange === '51_plus') &&
    (incomeRange === '2500_4000' || incomeRange === 'more_4000')
  ) {
    taxLoss += 840;
  }

  // Déclaration fiscale non optimisée
  if (taxDeclarationMode === 'unknown' || taxDeclarationMode === 'not_yet') {
    taxLoss += 600;
  } else if (
    taxDeclarationMode === 'online_self' &&
    (incomeRange === '2500_4000' || incomeRange === 'more_4000')
  ) {
    taxLoss += 420;
  }

  // Épargne non placée → manque à gagner fiscal (PEA, assurance-vie)
  if (savingsRange === 'none') {
    taxLoss += 200;
  } else if (savingsRange === 'less_10k') {
    taxLoss += 300;
  }

  // --- CONTRATS NON OPTIMISÉS ---
  contractsLoss += 240; // assurance/mutuelle
  if (housingStatus === 'owner_mortgage') {
    contractsLoss += 400; // taxe foncière + intérêts déductibles
  } else if (housingStatus === 'owner_paid') {
    contractsLoss += 300; // taxe foncière seule
  }
  if (childrenRange !== 'none' && childrenRange !== null) {
    contractsLoss += 200;
  }

  // Pas d'épargne placée → contrats non optimisés
  if (savingsRange === 'none') {
    contractsLoss += 400;
  }

  const totalLoss = aidsLoss + taxLoss + contractsLoss;
  const maxLoss = 10000;
  const score = Math.max(5, Math.min(95, Math.round(100 - (totalLoss / maxLoss) * 100)));

  return {
    score,
    totalLoss,
    breakdown: { aids: aidsLoss, tax: taxLoss, contracts: contractsLoss },
  };
};
