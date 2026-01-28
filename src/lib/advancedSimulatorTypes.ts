// Types for stress test settings
export interface StressTestSettings {
  rentHaircut: number; // % reduction on rent
  vacancyIncrease: number; // % points added to vacancy
  chargesIncrease: number; // % increase on charges
  rateIncrease: number; // % points added to rate
  enabled: boolean;
}

export const DEFAULT_STRESS_SETTINGS: StressTestSettings = {
  rentHaircut: 10,
  vacancyIncrease: 50, // relative increase, e.g., 5% vacancy becomes 7.5%
  chargesIncrease: 15,
  rateIncrease: 1,
  enabled: false,
};

export const BANK_STRESS_SETTINGS: StressTestSettings = {
  rentHaircut: 15,
  vacancyIncrease: 100, // doubles the vacancy rate
  chargesIncrease: 20,
  rateIncrease: 2,
  enabled: true,
};

// Extended wizard state for advanced mode
export interface AdvancedWizardState {
  // Project info
  project: {
    type: 'LOCATIF' | 'RP';
    title: string;
    address?: string;
    city: string;
    postalCode?: string;
    zoneId?: string;
    propertyType: 'apartment' | 'house' | 'building' | 'commercial';
    surfaceM2: number;
    rooms: number;
    lots?: number;
    floor?: number;
    hasElevator?: boolean;
    hasExterior?: boolean;
    hasParking?: boolean;
    condition: 'to_refresh' | 'good' | 'renovated' | 'new';
    constructionYear?: number;
    dpe?: string;
    rentControl?: boolean;
    localRules?: string;
  };

  // Acquisition
  acquisition: {
    priceNetSeller: number;
    agencyFeeMode: 'percentage' | 'amount';
    agencyFeeValue: number;
    notaryFeeAmount: number;
    notaryFeeEstimated: boolean;
    // Detailed works
    works: {
      structure: number;
      electrical: number;
      plumbing: number;
      flooring: number;
      painting: number;
      kitchen: number;
      bathroom: number;
      other: number;
    };
    worksTotal: number;
    worksScheduleMonths: number;
    initialVacancyMonths: number;
    // Furniture (for furnished)
    furniture: {
      bedroom: number;
      living: number;
      kitchen: number;
      bathroom: number;
      appliances: number;
      other: number;
    };
    furnitureTotal: number;
    // Other fees
    diagnostics: number;
    condoDossier: number;
    bankFees: number;
    guaranteeFees: number;
    brokerageFees: number;
    otherFees: number;
    // Calculated
    totalProjectCost: number;
  };

  // Financing
  financing: {
    downPayment: number;
    downPaymentAllocation: 'fees' | 'capital' | 'mixed';
    loanAmount: number;
    durationMonths: number;
    nominalRate: number;
    loanType: 'fixed' | 'variable';
    insuranceMode: 'monthly' | 'initial_percent' | 'crd_percent';
    insuranceValue: number;
    guaranteeType: 'surety' | 'mortgage';
    guaranteeCost: number;
    guaranteePeriodic: boolean;
    defermentType: 'none' | 'partial' | 'total';
    defermentMonths: number;
    modulationEnabled: boolean;
    modulationPercent: number;
    earlyRepaymentDate?: string;
    earlyRepaymentAmount: number;
    // PTZ for RP
    ptzEnabled: boolean;
    ptzAmount: number;
    ptzDuration: number;
    // Calculated
    monthlyPayment: number;
    totalInterest: number;
    totalInsurance: number;
    taeg?: number;
  };

  // Rental income (LOCATIF)
  rental: {
    locationType: 'nu' | 'meuble' | 'coloc' | 'saisonnier';
    // Standard
    rentMonthly: number;
    rentPerRoom?: number; // For coloc
    recoverableCharges: number;
    rentGrowthRate: number;
    vacancyRate: number;
    vacancyMonths?: number;
    defaultRate: number;
    relocationCost: number;
    relocationFrequencyYears: number;
    // Seasonal
    seasonalEnabled: boolean;
    nightlyRate: number;
    occupancyRate: number;
    seasonalCoefficients: number[]; // 12 months
    platformFeesPct: number;
    cleaningFeePerStay: number;
    linenCost: number;
    checkInCost: number;
    utilitiesCost: number;
    conciergeriePct: number;
  };

  // Owner occupier (RP)
  ownerOccupier: {
    avoidedRentMonthly: number;
    valueGrowthRate: number;
    scenarioType: 'prudent' | 'base' | 'optimist';
    prudentGrowthRate: number;
    optimistGrowthRate: number;
    // Household analysis
    householdIncomeMonthly: number;
    existingCreditsMonthly: number;
    otherChargesMonthly: number;
    remainingLiquidity: number;
    // Household members
    householdMembers: {
      id: string;
      firstName: string;
      relation: string;
      professionalStatus: string;
      netMonthlySalary: number;
      contractType: string;
      existingCredits: number;
    }[];
  };

  // Operating costs
  operatingCosts: {
    propertyTaxAnnual: number;
    propertyTaxGrowthRate: number;
    condoNonRecoverableAnnual: number;
    condoWorksReserve: number;
    insurancePNO: number;
    managementPct: number;
    managementMinMonthly: number;
    managementSpecificFees: number;
    maintenanceMode: 'percentage' | 'fixed';
    maintenanceValue: number;
    majorWorksProvision: number;
    majorWorksFrequencyYears: number;
    accountingAnnual: number;
    membershipFees: number;
    bankFees: number;
    miscFees: number;
    // Utilities (for furnished/seasonal)
    utilitiesWater: number;
    utilitiesElec: number;
    utilitiesGas: number;
    utilitiesInternet: number;
    cfeAnnual: number;
    otherTaxes: number;
    inflationRate: number;
  };

  // Tax config
  taxConfig: {
    taxMode: 'simple' | 'regime' | 'override';
    tmiRate: number;
    socialRate: number;
    regimeKey: string;
    interestDeductible: boolean;
    costsDeductible: boolean;
    amortizationEnabled: boolean;
    amortizationComponents: {
      name: string;
      valuePct: number;
      durationYears: number;
    }[];
    deficitEnabled: boolean;
    deficitCeiling?: number;
    deficitDurationYears?: number;
    exploitationStartDate?: string;
    annualTaxOverride?: number;
    capitalGainMode: 'simple' | 'advanced';
    capitalGainRate: number;
  };

  // Sale / Exit
  saleData: {
    resaleYear: number;
    propertyGrowthRate: number;
    prudentGrowthRate: number;
    optimistGrowthRate: number;
    resaleAgencyPct: number;
    resaleOtherFees: number;
    resaleWorks: number;
    capitalGainTaxMode: 'simple' | 'detailed';
    capitalGainTaxRate: number;
    netSaleProceeds: number;
  };

  // Stress tests
  stressSettings: StressTestSettings;
}

// Wizard steps for Locatif
export const LOCATIF_WIZARD_STEPS = [
  { id: 'project', title: 'Bien & Marché', description: 'Type et caractéristiques' },
  { id: 'acquisition', title: 'Acquisition', description: 'Coût total détaillé' },
  { id: 'financing', title: 'Financement', description: 'Structure de dette' },
  { id: 'rental', title: 'Revenus', description: 'Revenus locatifs' },
  { id: 'costs', title: 'Charges', description: 'Exploitation' },
  { id: 'tax', title: 'Fiscalité', description: 'Régime et impôts' },
  { id: 'sale', title: 'Revente', description: 'Stratégie patrimoine' },
  { id: 'stress', title: 'Stress Tests', description: 'Tests banque' },
];

// Wizard steps for RP
export const RP_WIZARD_STEPS = [
  { id: 'project', title: 'Bien & Achat', description: 'Caractéristiques' },
  { id: 'acquisition', title: 'Acquisition', description: 'Coût total' },
  { id: 'financing', title: 'Financement', description: 'Prêt et aides' },
  { id: 'costs', title: 'Charges', description: 'Budget logement' },
  { id: 'household', title: 'Ménage', description: 'Analyse banque' },
  { id: 'patrimony', title: 'Patrimoine', description: 'Valeur & revente' },
];

// Default initial state
export const getDefaultAdvancedState = (type: 'LOCATIF' | 'RP'): AdvancedWizardState => ({
  project: {
    type,
    title: '',
    city: '',
    propertyType: 'apartment',
    surfaceM2: 50,
    rooms: 2,
    condition: 'good',
    rentControl: false,
  },
  acquisition: {
    priceNetSeller: 200000,
    agencyFeeMode: 'percentage',
    agencyFeeValue: 5,
    notaryFeeAmount: 15000,
    notaryFeeEstimated: true,
    works: { structure: 0, electrical: 0, plumbing: 0, flooring: 0, painting: 0, kitchen: 0, bathroom: 0, other: 0 },
    worksTotal: 0,
    worksScheduleMonths: 0,
    initialVacancyMonths: 0,
    furniture: { bedroom: 0, living: 0, kitchen: 0, bathroom: 0, appliances: 0, other: 0 },
    furnitureTotal: 0,
    diagnostics: 500,
    condoDossier: 300,
    bankFees: 500,
    guaranteeFees: 2000,
    brokerageFees: 0,
    otherFees: 0,
    totalProjectCost: 0,
  },
  financing: {
    downPayment: 30000,
    downPaymentAllocation: 'fees',
    loanAmount: 190000,
    durationMonths: 240,
    nominalRate: 3.5,
    loanType: 'fixed',
    insuranceMode: 'initial_percent',
    insuranceValue: 0.30,
    guaranteeType: 'surety',
    guaranteeCost: 2000,
    guaranteePeriodic: false,
    defermentType: 'none',
    defermentMonths: 0,
    modulationEnabled: false,
    modulationPercent: 0,
    earlyRepaymentAmount: 0,
    ptzEnabled: false,
    ptzAmount: 0,
    ptzDuration: 0,
    monthlyPayment: 0,
    totalInterest: 0,
    totalInsurance: 0,
  },
  rental: {
    locationType: type === 'LOCATIF' ? 'meuble' : 'nu',
    rentMonthly: 900,
    recoverableCharges: 50,
    rentGrowthRate: 1,
    vacancyRate: 5,
    defaultRate: 2,
    relocationCost: 500,
    relocationFrequencyYears: 3,
    seasonalEnabled: false,
    nightlyRate: 80,
    occupancyRate: 70,
    seasonalCoefficients: [0.5, 0.6, 0.8, 0.9, 1.0, 1.2, 1.5, 1.5, 1.0, 0.8, 0.6, 0.7],
    platformFeesPct: 15,
    cleaningFeePerStay: 30,
    linenCost: 0,
    checkInCost: 0,
    utilitiesCost: 0,
    conciergeriePct: 0,
  },
  ownerOccupier: {
    avoidedRentMonthly: 1200,
    valueGrowthRate: 2,
    scenarioType: 'base',
    prudentGrowthRate: 1,
    optimistGrowthRate: 3,
    householdIncomeMonthly: 5000,
    existingCreditsMonthly: 0,
    otherChargesMonthly: 500,
    remainingLiquidity: 10000,
    householdMembers: [],
  },
  operatingCosts: {
    propertyTaxAnnual: 1000,
    propertyTaxGrowthRate: 2,
    condoNonRecoverableAnnual: 1200,
    condoWorksReserve: 0,
    insurancePNO: 150,
    managementPct: 8,
    managementMinMonthly: 0,
    managementSpecificFees: 0,
    maintenanceMode: 'percentage',
    maintenanceValue: 5,
    majorWorksProvision: 500,
    majorWorksFrequencyYears: 10,
    accountingAnnual: 300,
    membershipFees: 0,
    bankFees: 50,
    miscFees: 0,
    utilitiesWater: 0,
    utilitiesElec: 0,
    utilitiesGas: 0,
    utilitiesInternet: 0,
    cfeAnnual: 0,
    otherTaxes: 0,
    inflationRate: 2,
  },
  taxConfig: {
    taxMode: 'simple',
    tmiRate: 30,
    socialRate: 17.2,
    regimeKey: 'micro_foncier',
    interestDeductible: true,
    costsDeductible: true,
    amortizationEnabled: false,
    amortizationComponents: [
      { name: 'bati', valuePct: 80, durationYears: 30 },
      { name: 'mobilier', valuePct: 100, durationYears: 7 },
      { name: 'travaux', valuePct: 100, durationYears: 10 },
    ],
    deficitEnabled: false,
    capitalGainMode: 'simple',
    capitalGainRate: 36.2,
  },
  saleData: {
    resaleYear: 20,
    propertyGrowthRate: 2,
    prudentGrowthRate: 1,
    optimistGrowthRate: 3,
    resaleAgencyPct: 5,
    resaleOtherFees: 1000,
    resaleWorks: 0,
    capitalGainTaxMode: 'simple',
    capitalGainTaxRate: 36.2,
    netSaleProceeds: 0,
  },
  stressSettings: DEFAULT_STRESS_SETTINGS,
});
