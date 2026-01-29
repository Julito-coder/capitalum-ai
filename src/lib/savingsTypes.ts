/**
 * Types pour le simulateur d'épargne long terme
 * PEA (Plan d'Épargne en Actions) et PER (Plan d'Épargne Retraite)
 */

export type SavingsProfile = 'prudent' | 'equilibre' | 'dynamique';

export type EnvelopeType = 'pea' | 'per';

export interface SavingsInputs {
  monthlyContribution: number;
  durationYears: number;
  profile: SavingsProfile;
  tmi: number; // Tranche Marginale d'Imposition (0, 11, 30, 41, 45)
  age: number;
  objective: 'retraite' | 'capital' | 'complement';
}

export interface YearlyProjection {
  year: number;
  totalContributed: number;
  capitalEnd: number;
  interestCumulated: number;
  interestYearly: number;
}

export interface EnvelopeSimulation {
  envelope: EnvelopeType;
  profile: SavingsProfile;
  annualRate: number;
  totalContributed: number;
  capitalEnd: number;
  interestTotal: number;
  projections: YearlyProjection[];
  // PER specific
  taxSavings?: number;
  netEffort?: number;
}

export interface SavingsSimulationResults {
  inputs: SavingsInputs;
  pea: {
    prudent: EnvelopeSimulation;
    equilibre: EnvelopeSimulation;
    dynamique: EnvelopeSimulation;
  };
  per: {
    prudent: EnvelopeSimulation;
    equilibre: EnvelopeSimulation;
    dynamique: EnvelopeSimulation;
  };
}

// Constantes réglementaires
export const SAVINGS_CONSTANTS = {
  PEA_CEILING: 150000, // Plafond PEA
  PER_ANNUAL_CEILING_BASE: 32909, // Plafond PER 2024 (10% du PASS plafonné)
  SOCIAL_CONTRIBUTIONS: 17.2, // Prélèvements sociaux en %
  
  // Taux de rendement par profil (hypothèses pédagogiques)
  RATES: {
    prudent: 3,
    equilibre: 5,
    dynamique: 7,
  } as Record<SavingsProfile, number>,
  
  // TMI France 2024
  TMI_BRACKETS: [0, 11, 30, 41, 45] as const,
};

export const PROFILE_LABELS: Record<SavingsProfile, string> = {
  prudent: 'Prudent',
  equilibre: 'Équilibré',
  dynamique: 'Dynamique',
};

export const ENVELOPE_LABELS: Record<EnvelopeType, string> = {
  pea: 'PEA',
  per: 'PER',
};
