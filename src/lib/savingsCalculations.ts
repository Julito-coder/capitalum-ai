/**
 * Moteur de calcul pour le simulateur d'épargne long terme
 * Calculs des intérêts composés, projections PEA/PER avec indices détaillés
 */

import {
  SavingsInputs,
  SavingsSimulationResults,
  EnvelopeSimulation,
  YearlyProjection,
  SavingsProfile,
  EnvelopeType,
  SAVINGS_CONSTANTS,
} from './savingsTypes';

import {
  RiskProfile,
  RISK_PROFILES,
  getRiskProfileById,
  getIndexById,
} from './savingsIndicesData';

/**
 * Calcule la projection annuelle avec intérêts composés
 * Formule : Capital(n) = Capital(n-1) * (1 + r) + Versements annuels
 */
export function calculateYearlyProjections(
  monthlyContribution: number,
  durationYears: number,
  annualRate: number
): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  const yearlyContribution = monthlyContribution * 12;
  const rate = annualRate / 100;
  
  let capitalEnd = 0;
  let totalContributed = 0;
  
  for (let year = 1; year <= durationYears; year++) {
    totalContributed += yearlyContribution;
    
    // Intérêts sur capital existant + versements de l'année (approximation mi-année)
    const interestYearly = capitalEnd * rate + (yearlyContribution * rate * 0.5);
    capitalEnd = capitalEnd + yearlyContribution + interestYearly;
    
    const interestCumulated = capitalEnd - totalContributed;
    
    projections.push({
      year,
      totalContributed: Math.round(totalContributed),
      capitalEnd: Math.round(capitalEnd),
      interestCumulated: Math.round(interestCumulated),
      interestYearly: Math.round(interestYearly),
    });
  }
  
  return projections;
}

/**
 * Calcule le rendement pondéré d'un portefeuille basé sur un profil de risque
 */
export function calculatePortfolioReturn(profileId: string): number {
  const profile = getRiskProfileById(profileId);
  if (!profile) return 5; // Default équilibré
  
  let weightedReturn = 0;
  let totalWeight = 0;
  
  for (const alloc of profile.suggestedAllocation) {
    const index = getIndexById(alloc.indexId);
    if (index) {
      weightedReturn += index.annualizedReturn10Y * alloc.weight;
      totalWeight += alloc.weight;
    }
  }
  
  return totalWeight > 0 ? weightedReturn / totalWeight : profile.expectedReturn;
}

/**
 * Calcule la volatilité pondérée du portefeuille
 */
export function calculatePortfolioVolatility(profileId: string): number {
  const profile = getRiskProfileById(profileId);
  if (!profile) return 10;
  
  let weightedVolatility = 0;
  let totalWeight = 0;
  
  for (const alloc of profile.suggestedAllocation) {
    const index = getIndexById(alloc.indexId);
    if (index) {
      // Simplification : on suppose une corrélation de 0.7 entre actifs
      weightedVolatility += Math.pow(index.volatility * alloc.weight / 100, 2);
      totalWeight += alloc.weight;
    }
  }
  
  return Math.sqrt(weightedVolatility) * 100 * 0.85; // Factor for diversification
}

/**
 * Projections avec scénarios Monte Carlo simplifiés
 */
export function calculateScenarioProjections(
  monthlyContribution: number,
  durationYears: number,
  expectedReturn: number,
  volatility: number
): {
  optimistic: YearlyProjection[];
  median: YearlyProjection[];
  pessimistic: YearlyProjection[];
} {
  // Optimistic: expected + 0.5 * volatility
  const optimisticRate = expectedReturn + volatility * 0.3;
  // Pessimistic: expected - 0.5 * volatility  
  const pessimisticRate = Math.max(0, expectedReturn - volatility * 0.3);
  
  return {
    optimistic: calculateYearlyProjections(monthlyContribution, durationYears, optimisticRate),
    median: calculateYearlyProjections(monthlyContribution, durationYears, expectedReturn),
    pessimistic: calculateYearlyProjections(monthlyContribution, durationYears, pessimisticRate),
  };
}

/**
 * Calcule la simulation pour une enveloppe (PEA ou PER)
 */
export function calculateEnvelopeSimulation(
  inputs: SavingsInputs,
  envelope: EnvelopeType,
  profile: SavingsProfile
): EnvelopeSimulation {
  const annualRate = SAVINGS_CONSTANTS.RATES[profile];
  const projections = calculateYearlyProjections(
    inputs.monthlyContribution,
    inputs.durationYears,
    annualRate
  );
  
  const lastProjection = projections[projections.length - 1];
  const totalContributed = lastProjection?.totalContributed ?? 0;
  const capitalEnd = lastProjection?.capitalEnd ?? 0;
  const interestTotal = lastProjection?.interestCumulated ?? 0;
  
  const simulation: EnvelopeSimulation = {
    envelope,
    profile,
    annualRate,
    totalContributed,
    capitalEnd,
    interestTotal,
    projections,
  };
  
  // Calculs spécifiques PER : économie d'impôt à l'entrée
  if (envelope === 'per' && inputs.tmi > 0) {
    const yearlyContribution = inputs.monthlyContribution * 12;
    const annualTaxSavings = yearlyContribution * (inputs.tmi / 100);
    simulation.taxSavings = Math.round(annualTaxSavings * inputs.durationYears);
    simulation.netEffort = totalContributed - simulation.taxSavings;
  }
  
  return simulation;
}

/**
 * Calcule une simulation avancée basée sur un profil de risque personnalisé
 */
export function calculateAdvancedSimulation(
  inputs: SavingsInputs,
  envelope: EnvelopeType,
  profileId: string
): EnvelopeSimulation & {
  volatility: number;
  scenarios: {
    optimistic: YearlyProjection[];
    median: YearlyProjection[];
    pessimistic: YearlyProjection[];
  };
} {
  const riskProfile = getRiskProfileById(profileId);
  const annualRate = riskProfile?.expectedReturn ?? 5;
  const volatility = riskProfile?.expectedVolatility ?? 10;
  
  const projections = calculateYearlyProjections(
    inputs.monthlyContribution,
    inputs.durationYears,
    annualRate
  );
  
  const scenarios = calculateScenarioProjections(
    inputs.monthlyContribution,
    inputs.durationYears,
    annualRate,
    volatility
  );
  
  const lastProjection = projections[projections.length - 1];
  const totalContributed = lastProjection?.totalContributed ?? 0;
  const capitalEnd = lastProjection?.capitalEnd ?? 0;
  const interestTotal = lastProjection?.interestCumulated ?? 0;
  
  const simulation = {
    envelope,
    profile: profileId as SavingsProfile,
    annualRate,
    totalContributed,
    capitalEnd,
    interestTotal,
    projections,
    volatility,
    scenarios,
  };
  
  // Calculs spécifiques PER
  if (envelope === 'per' && inputs.tmi > 0) {
    const yearlyContribution = inputs.monthlyContribution * 12;
    const annualTaxSavings = yearlyContribution * (inputs.tmi / 100);
    (simulation as any).taxSavings = Math.round(annualTaxSavings * inputs.durationYears);
    (simulation as any).netEffort = totalContributed - (simulation as any).taxSavings;
  }
  
  return simulation as any;
}

/**
 * Génère la simulation complète pour tous les profils et enveloppes
 */
export function generateSavingsSimulation(
  inputs: SavingsInputs
): SavingsSimulationResults {
  const profiles: SavingsProfile[] = ['prudent', 'equilibre', 'dynamique'];
  
  const peaResults = {} as Record<SavingsProfile, EnvelopeSimulation>;
  const perResults = {} as Record<SavingsProfile, EnvelopeSimulation>;
  
  for (const profile of profiles) {
    peaResults[profile] = calculateEnvelopeSimulation(inputs, 'pea', profile);
    perResults[profile] = calculateEnvelopeSimulation(inputs, 'per', profile);
  }
  
  return {
    inputs,
    pea: peaResults as SavingsSimulationResults['pea'],
    per: perResults as SavingsSimulationResults['per'],
  };
}

/**
 * Formate un montant en euros pour l'affichage
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calcule le ratio intérêts / capital versé
 */
export function calculateInterestRatio(
  totalContributed: number,
  interestTotal: number
): number {
  if (totalContributed === 0) return 0;
  return Math.round((interestTotal / totalContributed) * 100);
}

/**
 * Détermine si le PER est pertinent selon le TMI
 */
export function isPERRelevant(tmi: number): boolean {
  return tmi >= 30; // Pertinent à partir de 30% de TMI
}

/**
 * Calcule l'âge à la fin du placement
 */
export function calculateEndAge(currentAge: number, durationYears: number): number {
  return currentAge + durationYears;
}

/**
 * Vérifie si le montant dépasse le plafond PEA
 */
export function checkPEACeiling(totalContributed: number): {
  exceeded: boolean;
  excess: number;
} {
  const exceeded = totalContributed > SAVINGS_CONSTANTS.PEA_CEILING;
  return {
    exceeded,
    excess: exceeded ? totalContributed - SAVINGS_CONSTANTS.PEA_CEILING : 0,
  };
}

/**
 * Calcule le nombre d'années avant d'atteindre un objectif
 */
export function calculateYearsToGoal(
  monthlyContribution: number,
  targetAmount: number,
  annualRate: number
): number {
  const yearlyContribution = monthlyContribution * 12;
  const rate = annualRate / 100;
  
  if (rate === 0) {
    return Math.ceil(targetAmount / yearlyContribution);
  }
  
  // Formule inverse des intérêts composés avec versements réguliers
  let capital = 0;
  let years = 0;
  
  while (capital < targetAmount && years < 100) {
    years++;
    const interest = capital * rate + (yearlyContribution * rate * 0.5);
    capital = capital + yearlyContribution + interest;
  }
  
  return years;
}

/**
 * Calcule le versement mensuel nécessaire pour atteindre un objectif
 */
export function calculateRequiredMonthly(
  targetAmount: number,
  durationYears: number,
  annualRate: number
): number {
  const rate = annualRate / 100;
  const months = durationYears * 12;
  const monthlyRate = rate / 12;
  
  if (monthlyRate === 0) {
    return targetAmount / months;
  }
  
  // Formule PMT inversée
  const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return Math.round(targetAmount / factor);
}
