/**
 * Moteur de calcul pour le simulateur d'épargne long terme
 * Calculs des intérêts composés, projections PEA/PER
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
