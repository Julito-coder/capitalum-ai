// Types for the intelligent onboarding form

export type ProfileType = 'employee' | 'self_employed' | 'retired' | 'investor';
export type PrimaryObjective = 'reduce_ir' | 'optimize_is' | 'treasury' | 'hiring';
export type FiscalStatus = 'micro' | 'micro_social' | 'reel_simplifie' | 'reel_normal';
export type ContractType = 'cdi' | 'cdd' | 'interim' | 'freelance';
export type RentalScheme = 'nu' | 'meuble' | 'lmnp' | 'lmp' | 'pinel' | 'denormandie';

export interface ChildDetail {
  age: number;
  isStudent: boolean;
  hasDisability: boolean;
}

export interface TopClient {
  name: string;
  annualRevenue: number;
}

export interface ComplementaryPension {
  name: string;
  annualAmount: number;
}

export interface RentalProperty {
  address: string;
  annualRent: number;
  annualCharges: number;
  scheme: RentalScheme;
}

export interface OnboardingData {
  // Step 1: Profile Selection
  profileTypes: ProfileType[];
  
  // Step 2: Identity
  fullName: string;
  nif: string;
  birthYear: number;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  residenceDurationYears: number;
  isHomeowner: boolean;
  
  // Step 3: Family
  familyStatus: 'single' | 'married' | 'pacs' | 'divorced' | 'widowed';
  childrenCount: number;
  childrenDetails: ChildDetail[];
  spouseIncome: number;
  
  // Step 4: Objective
  primaryObjective: PrimaryObjective;
  
  // Employee fields
  employerName: string;
  employerSiret: string;
  contractType: ContractType;
  contractStartDate: string;
  grossMonthlySalary: number;
  netMonthlySalary: number;
  annualBonus: number;
  thirteenthMonth: number;
  overtimeAnnual: number;
  hasRealExpenses: boolean;
  realExpensesAmount: number;
  hasCompanyHealthInsurance: boolean;
  hasMealVouchers: boolean;
  peeAmount: number;
  percoAmount: number;
  stockOptionsValue: number;
  
  // Self-employed fields
  siret: string;
  companyCreationDate: string;
  apeCode: string;
  fiscalStatus: FiscalStatus;
  annualRevenueHt: number;
  socialChargesPaid: number;
  officeRent: number;
  vehicleExpenses: number;
  professionalSupplies: number;
  topClients: TopClient[];
  accountingSoftware: string;
  
  // Retired fields
  mainPensionAnnual: number;
  complementaryPensions: ComplementaryPension[];
  liquidationDate: string;
  supplementaryIncome: number;
  capitalGains2025: number;
  recentDonations: { amount: number; date: string }[];
  
  // Investment: Real Estate
  rentalProperties: RentalProperty[];
  rentalScheme: RentalScheme;
  annualRentalWorks: number;
  mortgageRemaining: number;
  ifiLiable: boolean;
  
  // Investment: Financial
  peaBalance: number;
  peaContributions2025: number;
  ctoDividends: number;
  ctoCapitalGains: number;
  lifeInsuranceBalance: number;
  lifeInsuranceContributions: number;
  lifeInsuranceWithdrawals: number;
  cryptoWalletAddress: string;
  cryptoPnl2025: number;
  scpiInvestments: number;
  crowdfundingInvestments: number;
  
  // Consents
  gdprConsent: boolean;
  aiAnalysisConsent: boolean;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  profileTypes: [],
  fullName: '',
  nif: '',
  birthYear: 1985,
  phone: '',
  addressStreet: '',
  addressCity: '',
  addressPostalCode: '',
  residenceDurationYears: 0,
  isHomeowner: false,
  familyStatus: 'single',
  childrenCount: 0,
  childrenDetails: [],
  spouseIncome: 0,
  primaryObjective: 'reduce_ir',
  
  // Employee
  employerName: '',
  employerSiret: '',
  contractType: 'cdi',
  contractStartDate: '',
  grossMonthlySalary: 0,
  netMonthlySalary: 0,
  annualBonus: 0,
  thirteenthMonth: 0,
  overtimeAnnual: 0,
  hasRealExpenses: false,
  realExpensesAmount: 0,
  hasCompanyHealthInsurance: false,
  hasMealVouchers: false,
  peeAmount: 0,
  percoAmount: 0,
  stockOptionsValue: 0,
  
  // Self-employed
  siret: '',
  companyCreationDate: '',
  apeCode: '',
  fiscalStatus: 'micro',
  annualRevenueHt: 0,
  socialChargesPaid: 0,
  officeRent: 0,
  vehicleExpenses: 0,
  professionalSupplies: 0,
  topClients: [],
  accountingSoftware: '',
  
  // Retired
  mainPensionAnnual: 0,
  complementaryPensions: [],
  liquidationDate: '',
  supplementaryIncome: 0,
  capitalGains2025: 0,
  recentDonations: [],
  
  // Investment: Real Estate
  rentalProperties: [],
  rentalScheme: 'nu',
  annualRentalWorks: 0,
  mortgageRemaining: 0,
  ifiLiable: false,
  
  // Investment: Financial
  peaBalance: 0,
  peaContributions2025: 0,
  ctoDividends: 0,
  ctoCapitalGains: 0,
  lifeInsuranceBalance: 0,
  lifeInsuranceContributions: 0,
  lifeInsuranceWithdrawals: 0,
  cryptoWalletAddress: '',
  cryptoPnl2025: 0,
  scpiInvestments: 0,
  crowdfundingInvestments: 0,
  
  gdprConsent: false,
  aiAnalysisConsent: false,
};

export const PROFILE_ICONS = {
  employee: '💼',
  self_employed: '🚀',
  retired: '👴',
  investor: '📈',
};

export const PROFILE_LABELS = {
  employee: 'Salarié(e)',
  self_employed: 'Auto-entrepreneur / Indépendant',
  retired: 'Retraité(e)',
  investor: 'Investisseur',
};

export const OBJECTIVE_LABELS = {
  reduce_ir: 'Réduire mon impôt sur le revenu',
  optimize_is: 'Optimiser l\'IS de mon entreprise',
  treasury: 'Améliorer ma trésorerie',
  hiring: 'Préparer une embauche',
};
