export type AgeRange = '18-24' | '25-34' | '35-49' | '50-64' | '65+';
export type FamilySituation = 'single' | 'couple_married' | 'couple_unmarried' | 'divorced' | 'widowed';
export type ChildrenCount = '0' | '1' | '2' | '3' | '4' | '5+';
export type ProfessionalStatus = 'employee' | 'public_employee' | 'self_employed' | 'student' | 'unemployed' | 'retired';
export type AnnualIncome = '0-10k' | '10-18k' | '18-26k' | '26-36k' | '36-50k' | '50-80k' | '80k+';
export type HousingStatus = 'owner_no_mortgage' | 'owner_mortgage' | 'tenant' | 'hosted';
export type Zone = 'zone_1' | 'zone_2' | 'zone_3';
export type TransportMode = 'car_short' | 'car_long' | 'public_transport' | 'bike_walk' | 'remote';
export type TaxDeclaration = 'auto_validate' | 'self_check' | 'accountant' | 'never_done';
export type DonationsStatus = 'no_donations' | 'donations_declared' | 'donations_not_declared';
export type SavingsType = 'livret_a' | 'assurance_vie' | 'per' | 'pea' | 'scpi_immo' | 'none';
export type CurrentAid = 'apl' | 'prime_activite' | 'css' | 'ars' | 'cheque_energie' | 'allocations_familiales' | 'none';
export type LifeEvent = 'marriage_pacs' | 'birth' | 'divorce' | 'property_purchase' | 'job_change' | 'retirement' | 'none';
export type InvestmentType = 'rental_property' | 'crypto' | 'foreign_accounts' | 'stock_options' | 'none';
export type ConfidenceLevel = 'lost' | 'anxious' | 'passive' | 'okay' | 'confident';

export interface QuizAnswers {
  age: AgeRange | null;
  familySituation: FamilySituation | null;
  children: ChildrenCount | null;
  professionalStatus: ProfessionalStatus | null;
  annualIncome: AnnualIncome | null;
  housing: HousingStatus | null;
  zone: Zone | null;
  transport: TransportMode | null;
  taxDeclaration: TaxDeclaration | null;
  donations: DonationsStatus | null;
  savings: SavingsType[];
  currentAids: CurrentAid[];
  lifeEvents: LifeEvent[];
  investments: InvestmentType[];
  confidence: ConfidenceLevel | null;
}

export const DEFAULT_QUIZ_ANSWERS: QuizAnswers = {
  age: null,
  familySituation: null,
  children: null,
  professionalStatus: null,
  annualIncome: null,
  housing: null,
  zone: null,
  transport: null,
  taxDeclaration: null,
  donations: null,
  savings: [],
  currentAids: [],
  lifeEvents: [],
  investments: [],
  confidence: null,
};

export interface DiagnosticDetail {
  label: string;
  amount: number;
  category: 'aid' | 'optimization' | 'risk';
}

export interface DiagnosticResult {
  score: number;
  totalLoss: number;
  breakdown: {
    missedAids: number;
    missedOptimizations: number;
    risks: number;
  };
  details: DiagnosticDetail[];
}

export type QuestionType = 'single' | 'multi' | 'grid';

export interface QuizQuestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: QuestionType;
  field: keyof QuizAnswers;
  options: {
    value: string;
    label: string;
    subtitle?: string;
  }[];
  condition?: (answers: QuizAnswers) => boolean;
}
