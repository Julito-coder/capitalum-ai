// Types for the onboarding quiz diagnostic

export type AgeRange = '18_25' | '26_35' | '36_50' | '51_plus';
export type ProfessionalStatus = 'employee' | 'self_employed' | 'student' | 'job_seeker' | 'retired';
export type FamilyStatus = 'single' | 'couple' | 'married' | 'divorced';
export type ChildrenRange = 'none' | '1' | '2' | '3_or_more';
export type HousingStatus = 'tenant' | 'owner_mortgage' | 'owner_paid' | 'hosted';
export type IncomeRange = 'less_1500' | '1500_2500' | '2500_4000' | 'more_4000';
export type SavingsRange = 'none' | 'less_10k' | '10k_50k' | 'more_50k';
export type TaxDeclarationMode = 'online_self' | 'accountant' | 'not_yet' | 'unknown';

export interface ModernOnboardingData {
  ageRange: AgeRange | null;
  professionalStatus: ProfessionalStatus | null;
  familyStatus: FamilyStatus | null;
  childrenRange: ChildrenRange | null;
  housingStatus: HousingStatus | null;
  incomeRange: IncomeRange | null;
  savingsRange: SavingsRange | null;
  taxDeclarationMode: TaxDeclarationMode | null;
  fullName: string;
}

export const DEFAULT_MODERN_ONBOARDING: ModernOnboardingData = {
  ageRange: null,
  professionalStatus: null,
  familyStatus: null,
  childrenRange: null,
  housingStatus: null,
  incomeRange: null,
  savingsRange: null,
  taxDeclarationMode: null,
  fullName: '',
};
