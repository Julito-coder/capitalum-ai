// Tax Scanner Types & Constants for French Tax Declaration 2026

// ============== ENUMS ==============

export type FamilyStatus = 'single' | 'married' | 'pacs' | 'widowed' | 'divorced';
export type ProfessionalStatus = 'employee' | 'self_employed' | 'retired' | 'student' | 'unemployed' | 'mixed';
export type PropertyType = 'owner' | 'tenant' | 'free_housing';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type OptimizationType = 'savings' | 'credit' | 'deduction' | 'exoneration';

// ============== INTERFACES ==============

export interface TaxScannerInput {
  // Personal situation
  familyStatus: FamilyStatus;
  birthYear: number;
  spouseBirthYear?: number;
  
  // Children
  childrenCount: number;
  childrenAges: number[];
  childrenHandicapped: number[];
  childrenStudents: number[];
  childrenAlternatingCustody: number;
  
  // Professional
  professionalStatus: ProfessionalStatus;
  isJournalist: boolean;
  isSalesRep: boolean;
  isMilitary: boolean;
  isSeafarer: boolean;
  isFarmer: boolean;
  
  // Income - Employment
  salaryGross: number;
  salaryNet: number;
  salaryDeclared: number;
  overtimeHours: number;
  bonuses: number;
  severanceIndemnity: number;
  
  // Income - Self-employed
  businessRevenue: number;
  businessExpenses: number;
  isMicroEnterprise: boolean;
  businessType: 'BIC' | 'BNC' | 'none';
  
  // Income - Rental
  rentalIncome: number;
  rentalFurnished: boolean;
  rentalExpenses: number;
  rentalWorks: number;
  hasAirbnb: boolean;
  airbnbIncome: number;
  
  // Income - Financial
  dividends: number;
  interests: number;
  livretAInterests: number;
  capitalGains: number;
  cryptoGains: number;
  hasPEA: boolean;
  peaValue: number;
  
  // Deductions
  realExpenses: number;
  realExpensesDetails: {
    transport: number;
    meals: number;
    professional: number;
    other: number;
  };
  alimonyPaid: number;
  alimonyReceived: number;
  perContributions: number;
  perAvailable: number;
  madelinContributions: number;
  unionDues: number;
  
  // Tax credits & reductions
  childcareExpenses: number;
  homeEmployeeExpenses: number;
  donations: number;
  donationsAssociations: number;
  schoolingExpenses: { college: number; lycee: number; university: number };
  
  // Investments
  pinelInvestment: number;
  denormandieInvestment: number;
  malrauxInvestment: number;
  fipFcpiInvestment: number;
  pmeInvestment: number;
  esusInvestment: number;
  
  // Property
  propertyType: PropertyType;
  isFirstTimeBuyer: boolean;
  loanInterests: number;
  
  // Special situations
  hasDisability: boolean;
  spouseHasDisability: boolean;
  caresForElderlyParent: boolean;
  elderlyParentExpenses: number;
  hasForeignIncome: boolean;
  foreignIncome: number;
  
  // Location
  livesInQPV: boolean;
  propertiesInQPV: boolean;
}

export interface TaxError {
  id: string;
  category: string;
  code: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  taxBox?: string;
  estimatedRisk: number;
  legalReference?: string;
  action: string;
}

export interface TaxOptimization {
  id: string;
  category: string;
  type: OptimizationType;
  title: string;
  description: string;
  currentValue: number;
  optimizedValue: number;
  estimatedSavings: number;
  effort: string;
  deadline?: string;
  taxBox?: string;
  legalReference?: string;
  conditions?: string[];
}

export interface ScanResult {
  score: number;
  errors: TaxError[];
  optimizations: TaxOptimization[];
  totalPotentialSavings: number;
  totalRiskAmount: number;
  timestamp: Date;
}

// ============== 2026 TAX CONSTANTS ==============

export const TAX_CONSTANTS_2026 = {
  // Income tax brackets (updated for 2026)
  brackets: [
    { limit: 11497, rate: 0 },
    { limit: 29315, rate: 0.11 },
    { limit: 83823, rate: 0.30 },
    { limit: 180294, rate: 0.41 },
    { limit: Infinity, rate: 0.45 }
  ],
  
  // Standard deductions
  standardDeduction: 0.10,
  maxStandardDeduction: 14171,
  minStandardDeduction: 495,
  
  // Professional-specific deductions
  journalistDeduction: 7650,
  salesRepDeduction: 0.30,
  
  // Micro-enterprise thresholds
  microBNCThreshold: 77700,
  microBICThreshold: 188700,
  microBNCAbatement: 0.34,
  microBICAbatement: 0.71,
  
  // Rental
  microFoncierThreshold: 15000,
  microFoncierAbatement: 0.30,
  maxRentalDeficit: 10700,
  
  // Financial
  flatTaxRate: 0.30,
  flatTaxIRPart: 0.128,
  flatTaxSocialPart: 0.172,
  
  // PER
  maxPERDeduction: 35194,
  maxPERDeductionCouple: 70388,
  
  // Credits & reductions
  childcareCredit: 0.50,
  maxChildcarePerChild: 3500,
  homeEmployeeCredit: 0.50,
  maxHomeEmployeeCredit: 12000,
  maxHomeEmployeeCreditFirstYear: 15000,
  
  donationReduction75: 0.75,
  donationReduction75Max: 1000,
  donationReduction66: 0.66,
  
  schoolingCreditCollege: 61,
  schoolingCreditLycee: 153,
  schoolingCreditUniversity: 183,
  
  // Investment reductions
  pinelReduction: [0.09, 0.12], // 6 ans, 9 ans
  denormandieReduction: 0.21,
  fipFcpiReduction: 0.25,
  maxFipFcpi: 12000,
  pmeReduction: 0.25,
  maxPME: 50000,
  esusReduction: 0.25,
  maxESUS: 10000,
  
  // Alimony
  maxAlimonyPerChild: 6674,
  alimonyFlatRate: 3786,
  
  // Family quotient
  halfShareCap: 1759,
  
  // Thresholds
  livretAMaxInterest: 1250, // exempt
  lepMaxBalance: 10000,
  
  // Social contributions
  csgRate: 0.097,
  crdsRate: 0.005,
};

// ============== QUESTIONNAIRE STEPS ==============

export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  condition?: (input: Partial<TaxScannerInput>) => boolean;
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    id: 'personal',
    title: 'Situation personnelle',
    description: 'Votre situation familiale et personnelle',
    fields: ['familyStatus', 'birthYear', 'spouseBirthYear', 'hasDisability', 'spouseHasDisability']
  },
  {
    id: 'children',
    title: 'Enfants à charge',
    description: 'Informations sur vos enfants',
    fields: ['childrenCount', 'childrenAges', 'childrenHandicapped', 'childrenStudents', 'childrenAlternatingCustody']
  },
  {
    id: 'professional',
    title: 'Situation professionnelle',
    description: 'Votre statut et activité',
    fields: ['professionalStatus', 'isJournalist', 'isSalesRep', 'isMilitary', 'isSeafarer', 'isFarmer']
  },
  {
    id: 'salary',
    title: 'Revenus salariés',
    description: 'Vos salaires et primes',
    fields: ['salaryGross', 'salaryNet', 'salaryDeclared', 'overtimeHours', 'bonuses', 'severanceIndemnity'],
    condition: (input) => input.professionalStatus === 'employee' || input.professionalStatus === 'mixed'
  },
  {
    id: 'business',
    title: 'Revenus indépendants',
    description: 'Vos revenus d\'activité indépendante',
    fields: ['businessRevenue', 'businessExpenses', 'isMicroEnterprise', 'businessType'],
    condition: (input) => input.professionalStatus === 'self_employed' || input.professionalStatus === 'mixed'
  },
  {
    id: 'rental',
    title: 'Revenus fonciers',
    description: 'Vos revenus locatifs',
    fields: ['rentalIncome', 'rentalFurnished', 'rentalExpenses', 'rentalWorks', 'hasAirbnb', 'airbnbIncome']
  },
  {
    id: 'financial',
    title: 'Revenus financiers',
    description: 'Dividendes, intérêts et plus-values',
    fields: ['dividends', 'interests', 'livretAInterests', 'capitalGains', 'cryptoGains', 'hasPEA', 'peaValue']
  },
  {
    id: 'deductions',
    title: 'Charges déductibles',
    description: 'Vos déductions fiscales',
    fields: ['realExpenses', 'realExpensesDetails', 'alimonyPaid', 'alimonyReceived', 'perContributions', 'madelinContributions', 'unionDues']
  },
  {
    id: 'credits',
    title: 'Crédits d\'impôt',
    description: 'Dépenses ouvrant droit à crédit',
    fields: ['childcareExpenses', 'homeEmployeeExpenses', 'donations', 'schoolingExpenses']
  },
  {
    id: 'investments',
    title: 'Investissements défiscalisants',
    description: 'Vos investissements éligibles',
    fields: ['pinelInvestment', 'denormandieInvestment', 'malrauxInvestment', 'fipFcpiInvestment', 'pmeInvestment', 'esusInvestment']
  },
  {
    id: 'special',
    title: 'Situations particulières',
    description: 'Autres éléments à considérer',
    fields: ['caresForElderlyParent', 'elderlyParentExpenses', 'hasForeignIncome', 'foreignIncome', 'livesInQPV', 'propertiesInQPV']
  }
];

// ============== DEFAULT INPUT ==============

export const DEFAULT_TAX_INPUT: TaxScannerInput = {
  familyStatus: 'single',
  birthYear: 1985,
  childrenCount: 0,
  childrenAges: [],
  childrenHandicapped: [],
  childrenStudents: [],
  childrenAlternatingCustody: 0,
  professionalStatus: 'employee',
  isJournalist: false,
  isSalesRep: false,
  isMilitary: false,
  isSeafarer: false,
  isFarmer: false,
  salaryGross: 0,
  salaryNet: 0,
  salaryDeclared: 0,
  overtimeHours: 0,
  bonuses: 0,
  severanceIndemnity: 0,
  businessRevenue: 0,
  businessExpenses: 0,
  isMicroEnterprise: false,
  businessType: 'none',
  rentalIncome: 0,
  rentalFurnished: false,
  rentalExpenses: 0,
  rentalWorks: 0,
  hasAirbnb: false,
  airbnbIncome: 0,
  dividends: 0,
  interests: 0,
  livretAInterests: 0,
  capitalGains: 0,
  cryptoGains: 0,
  hasPEA: false,
  peaValue: 0,
  realExpenses: 0,
  realExpensesDetails: { transport: 0, meals: 0, professional: 0, other: 0 },
  alimonyPaid: 0,
  alimonyReceived: 0,
  perContributions: 0,
  perAvailable: 0,
  madelinContributions: 0,
  unionDues: 0,
  childcareExpenses: 0,
  homeEmployeeExpenses: 0,
  donations: 0,
  donationsAssociations: 0,
  schoolingExpenses: { college: 0, lycee: 0, university: 0 },
  pinelInvestment: 0,
  denormandieInvestment: 0,
  malrauxInvestment: 0,
  fipFcpiInvestment: 0,
  pmeInvestment: 0,
  esusInvestment: 0,
  propertyType: 'tenant',
  isFirstTimeBuyer: false,
  loanInterests: 0,
  hasDisability: false,
  spouseHasDisability: false,
  caresForElderlyParent: false,
  elderlyParentExpenses: 0,
  hasForeignIncome: false,
  foreignIncome: 0,
  livesInQPV: false,
  propertiesInQPV: false,
};
