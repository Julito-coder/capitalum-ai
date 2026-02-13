// Types for the modern simplified onboarding wizard

export type ProfessionalStatus = 'salarie' | 'independant' | 'chef_entreprise' | 'etudiant' | 'autre';
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55+';
export type FamilySituation = 'celibataire' | 'en_couple' | 'avec_enfants';
export type FinancialObjective = 'retraite' | 'impots' | 'cash' | 'bourse' | 'famille';
export type IncomeRange = '<1500' | '1500-3000' | '3000-5000' | '>5000';
export type PatrimonyRange = '<10000' | '10000-50000' | '50000-200000' | '>200000';
export type RiskTolerance = 'tres_prudent' | 'prudent' | 'equilibre' | 'dynamique' | 'tres_dynamique';
export type TaxBracket = '0' | '0-11' | '11-30' | '30-41' | '41-45' | 'unknown';

export interface ModernOnboardingData {
  professionalStatus: ProfessionalStatus | null;
  ageRange: AgeRange | null;
  familySituation: FamilySituation | null;
  financialObjectives: FinancialObjective[];
  incomeRange: IncomeRange | null;
  patrimonyRange: PatrimonyRange | null;
  riskTolerance: RiskTolerance | null;
  declaresInFrance: boolean | null;
  taxBracket: TaxBracket | null;
  fullName: string;
}

export const DEFAULT_MODERN_ONBOARDING: ModernOnboardingData = {
  professionalStatus: null,
  ageRange: null,
  familySituation: null,
  financialObjectives: [],
  incomeRange: null,
  patrimonyRange: null,
  riskTolerance: null,
  declaresInFrance: null,
  taxBracket: null,
  fullName: '',
};

export const PROFESSIONAL_STATUS_OPTIONS: { value: ProfessionalStatus; label: string; emoji: string }[] = [
  { value: 'salarie', label: 'Salarié', emoji: '💼' },
  { value: 'independant', label: 'Indépendant / Freelance', emoji: '🚀' },
  { value: 'chef_entreprise', label: "Chef d'entreprise", emoji: '🏢' },
  { value: 'etudiant', label: 'Étudiant', emoji: '🎓' },
  { value: 'autre', label: 'Autre', emoji: '✨' },
];

export const AGE_RANGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: '18-24', label: '18 – 24 ans' },
  { value: '25-34', label: '25 – 34 ans' },
  { value: '35-44', label: '35 – 44 ans' },
  { value: '45-54', label: '45 – 54 ans' },
  { value: '55+', label: '55 ans et +' },
];

export const FAMILY_OPTIONS: { value: FamilySituation; label: string; emoji: string }[] = [
  { value: 'celibataire', label: 'Célibataire', emoji: '🙋' },
  { value: 'en_couple', label: 'En couple', emoji: '💑' },
  { value: 'avec_enfants', label: 'Avec enfants', emoji: '👨‍👩‍👧‍👦' },
];

export const OBJECTIVE_OPTIONS: { value: FinancialObjective; label: string; emoji: string; description: string }[] = [
  { value: 'retraite', label: 'Préparer ma retraite', emoji: '🏖️', description: 'PER, assurance vie, épargne long terme' },
  { value: 'impots', label: 'Optimiser mes impôts', emoji: '📉', description: 'Réductions, crédits, niches fiscales' },
  { value: 'cash', label: 'Piloter mon cash', emoji: '💰', description: 'Budget, dépenses, trésorerie' },
  { value: 'bourse', label: 'Investir en bourse', emoji: '📈', description: 'ETF, actions, PEA, CTO' },
  { value: 'famille', label: 'Sécuriser ma famille', emoji: '🛡️', description: 'Assurance, prévoyance, succession' },
];

export const INCOME_OPTIONS: { value: IncomeRange; label: string }[] = [
  { value: '<1500', label: 'Moins de 1 500 €' },
  { value: '1500-3000', label: '1 500 – 3 000 €' },
  { value: '3000-5000', label: '3 000 – 5 000 €' },
  { value: '>5000', label: 'Plus de 5 000 €' },
];

export const PATRIMONY_OPTIONS: { value: PatrimonyRange; label: string }[] = [
  { value: '<10000', label: 'Moins de 10 000 €' },
  { value: '10000-50000', label: '10 000 – 50 000 €' },
  { value: '50000-200000', label: '50 000 – 200 000 €' },
  { value: '>200000', label: 'Plus de 200 000 €' },
];

export const RISK_OPTIONS: { value: RiskTolerance; label: string; emoji: string }[] = [
  { value: 'tres_prudent', label: 'Très prudent', emoji: '🐢' },
  { value: 'prudent', label: 'Prudent', emoji: '🦔' },
  { value: 'equilibre', label: 'Équilibré', emoji: '⚖️' },
  { value: 'dynamique', label: 'Dynamique', emoji: '🚀' },
  { value: 'tres_dynamique', label: 'Très dynamique', emoji: '🔥' },
];

export const TAX_BRACKET_OPTIONS: { value: TaxBracket; label: string }[] = [
  { value: '0', label: '0 %' },
  { value: '0-11', label: '0 – 11 %' },
  { value: '11-30', label: '11 – 30 %' },
  { value: '30-41', label: '30 – 41 %' },
  { value: '41-45', label: '41 – 45 %' },
  { value: 'unknown', label: 'Je ne sais pas' },
];
