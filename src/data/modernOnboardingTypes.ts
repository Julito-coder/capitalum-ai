// Types for the onboarding quiz diagnostic

export type AgeRange = '18_25' | '26_35' | '36_50' | '51_plus';
export type ProfessionalStatus = 'employee' | 'self_employed' | 'student' | 'job_seeker' | 'retired';
export type FamilyStatus = 'single' | 'couple' | 'married' | 'divorced';
export type ChildrenRange = 'none' | '1_or_2' | '3_or_more';
export type HousingStatus = 'tenant' | 'owner' | 'hosted';
export type IncomeRange = 'less_1000' | '1000_1800' | '1800_3000' | '3000_5000' | 'more_5000';

export interface ModernOnboardingData {
  ageRange: AgeRange | null;
  professionalStatus: ProfessionalStatus | null;
  familyStatus: FamilyStatus | null;
  childrenRange: ChildrenRange | null;
  housingStatus: HousingStatus | null;
  incomeRange: IncomeRange | null;
  fullName: string;
}

export const DEFAULT_MODERN_ONBOARDING: ModernOnboardingData = {
  ageRange: null,
  professionalStatus: null,
  familyStatus: null,
  childrenRange: null,
  housingStatus: null,
  incomeRange: null,
  fullName: '',
};
