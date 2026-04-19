// Tax Optimization Engine — port Deno (depuis src/lib/taxOptimizationEngine.ts)
// Garde la même logique. Toute mise à jour côté front doit être répliquée ici.

export type FamilyStatus = 'single' | 'married' | 'pacs' | 'widowed' | 'divorced';
export type OptimizationType = 'savings' | 'credit' | 'deduction' | 'exoneration';

export interface TaxScannerInput {
  familyStatus: FamilyStatus;
  birthYear: number;
  childrenCount: number;
  childrenAges: number[];
  childrenStudents: number[];
  isJournalist: boolean;
  isSalesRep: boolean;
  salaryDeclared: number;
  businessRevenue: number;
  rentalIncome: number;
  rentalFurnished: boolean;
  rentalExpenses: number;
  rentalWorks: number;
  dividends: number;
  realExpenses: number;
  perContributions: number;
  perAvailable: number;
  childcareExpenses: number;
  homeEmployeeExpenses: number;
  donations: number;
  donationsAssociations: number;
  schoolingExpenses: { college: number; lycee: number; university: number };
  fipFcpiInvestment: number;
  pmeInvestment: number;
  esusInvestment: number;
  hasDisability: boolean;
  caresForElderlyParent: boolean;
  elderlyParentExpenses: number;
}

export interface TaxOptimization {
  id: string;
  category: string;
  type: OptimizationType;
  title: string;
  description: string;
  estimatedSavings: number;
  effort: string;
  deadline?: string;
  taxBox?: string;
  legalReference?: string;
}

export const TAX_CONSTANTS_2026 = {
  standardDeduction: 0.10,
  maxStandardDeduction: 14171,
  minStandardDeduction: 495,
  journalistDeduction: 7650,
  microFoncierThreshold: 15000,
  microFoncierAbatement: 0.30,
  flatTaxRate: 0.30,
  flatTaxSocialPart: 0.172,
  maxPERDeduction: 35194,
  maxPERDeductionCouple: 70388,
  childcareCredit: 0.50,
  maxChildcarePerChild: 3500,
  homeEmployeeCredit: 0.50,
  maxHomeEmployeeCredit: 12000,
  donationReduction75: 0.75,
  donationReduction75Max: 1000,
  donationReduction66: 0.66,
  schoolingCreditCollege: 61,
  schoolingCreditLycee: 153,
  schoolingCreditUniversity: 183,
  fipFcpiReduction: 0.25,
  maxFipFcpi: 12000,
  pmeReduction: 0.25,
  maxPME: 50000,
  esusReduction: 0.25,
  maxESUS: 10000,
  alimonyFlatRate: 3786,
  halfShareCap: 1759,
};

export function detectOptimizations(input: TaxScannerInput): TaxOptimization[] {
  const out: TaxOptimization[] = [];
  const c = TAX_CONSTANTS_2026;
  const totalIncome = input.salaryDeclared + input.businessRevenue + input.rentalIncome;
  const marginRate =
    totalIncome > 180294 ? 0.45 :
    totalIncome > 83823 ? 0.41 :
    totalIncome > 29315 ? 0.30 :
    totalIncome > 11497 ? 0.11 : 0;

  // Frais réels
  if (input.salaryDeclared > 0 && input.realExpenses > 0) {
    const std = Math.min(Math.max(input.salaryDeclared * c.standardDeduction, c.minStandardDeduction), c.maxStandardDeduction);
    if (input.realExpenses > std) {
      out.push({
        id: 'OPT_REAL_EXPENSES',
        category: 'Revenus salariés',
        type: 'deduction',
        title: 'Opter pour les frais réels',
        description: 'Tes frais réels dépassent l\'abattement forfaitaire de 10%.',
        estimatedSavings: Math.round((input.realExpenses - std) * marginRate),
        effort: 'Classer tes justificatifs (30 min)',
        deadline: '31 mai 2027',
        taxBox: '1AK',
      });
    }
  }

  if (input.isJournalist && input.salaryDeclared > 0) {
    out.push({
      id: 'OPT_JOURNALIST',
      category: 'Revenus salariés',
      type: 'deduction',
      title: 'Abattement journaliste',
      description: `Déduction spécifique de ${c.journalistDeduction}€.`,
      estimatedSavings: Math.round(c.journalistDeduction * marginRate),
      effort: 'Vérifier ta carte de presse',
      taxBox: '1AJ',
    });
  }

  // Foncier
  if (input.rentalIncome > 0 && input.rentalIncome <= c.microFoncierThreshold) {
    const micro = input.rentalIncome * c.microFoncierAbatement;
    const reel = input.rentalExpenses + input.rentalWorks;
    if (reel > micro) {
      out.push({
        id: 'OPT_RENTAL_REAL',
        category: 'Revenus fonciers',
        type: 'deduction',
        title: 'Régime réel plus avantageux',
        description: 'Tes charges foncières dépassent l\'abattement micro-foncier de 30%.',
        estimatedSavings: Math.round((reel - micro) * marginRate),
        effort: 'Déclaration 2044 (1h)',
        deadline: '31 mai 2027',
        taxBox: '4BA',
      });
    }
  }

  if (input.rentalFurnished && input.rentalIncome > 0) {
    const microBIC = input.rentalIncome * 0.50;
    if (microBIC > input.rentalExpenses) {
      out.push({
        id: 'OPT_LMNP',
        category: 'Revenus fonciers',
        type: 'deduction',
        title: 'Statut LMNP à considérer',
        description: 'Location meublée : abattement 50% en micro-BIC ou amortissements en réel.',
        estimatedSavings: Math.round((microBIC - input.rentalExpenses) * marginRate),
        effort: 'Étude fiscale (2h)',
        taxBox: '5NG',
      });
    }
  }

  // Dividendes barème
  if (input.dividends > 0 && marginRate < 0.30) {
    const flat = input.dividends * c.flatTaxRate;
    const progressive = input.dividends * 0.60 * marginRate + input.dividends * c.flatTaxSocialPart;
    if (progressive < flat) {
      out.push({
        id: 'OPT_DIVIDENDS_PROGRESSIVE',
        category: 'Revenus financiers',
        type: 'savings',
        title: 'Opter pour le barème progressif',
        description: 'Ta tranche d\'imposition étant inférieure à 30%, le barème est plus avantageux que la flat tax.',
        estimatedSavings: Math.round(flat - progressive),
        effort: 'Cocher la case 2OP',
        taxBox: '2OP',
      });
    }
  }

  // PER
  const isCoupled = input.familyStatus === 'married' || input.familyStatus === 'pacs';
  const maxPER = isCoupled ? c.maxPERDeductionCouple : c.maxPERDeduction;
  const perAvailable = Math.min(input.perAvailable || maxPER, maxPER - input.perContributions);
  if (perAvailable > 0 && marginRate >= 0.30) {
    const optimal = Math.min(perAvailable, totalIncome * 0.10);
    out.push({
      id: 'OPT_PER',
      category: 'Épargne retraite',
      type: 'deduction',
      title: 'Versement PER recommandé',
      description: `Tu peux encore verser ${Math.round(perAvailable)}€ déductibles sur ton PER.`,
      estimatedSavings: Math.round(optimal * marginRate),
      effort: 'Virement bancaire (5 min)',
      deadline: '31 décembre 2026',
      taxBox: '6NS/6NT',
    });
  }

  // Garde d'enfants
  if (input.childrenAges.some(age => age < 6) && input.childcareExpenses === 0) {
    const credit = c.maxChildcarePerChild * c.childcareCredit;
    out.push({
      id: 'OPT_CHILDCARE',
      category: 'Crédits d\'impôt',
      type: 'credit',
      title: 'Crédit garde d\'enfants',
      description: `Crédit de 50% des frais de garde, jusqu'à ${c.maxChildcarePerChild}€/enfant.`,
      estimatedSavings: Math.round(credit),
      effort: 'Conserver les attestations',
      taxBox: '7GA/7GB',
    });
  }

  if (input.homeEmployeeExpenses > 0) {
    const credit = Math.min(input.homeEmployeeExpenses, c.maxHomeEmployeeCredit) * c.homeEmployeeCredit;
    out.push({
      id: 'OPT_HOME_EMPLOYEE',
      category: 'Crédits d\'impôt',
      type: 'credit',
      title: 'Crédit emploi à domicile',
      description: `Crédit de 50% des dépenses, plafond ${c.maxHomeEmployeeCredit}€/an.`,
      estimatedSavings: Math.round(credit),
      effort: 'Déclaration CESU automatique',
      taxBox: '7DB/7DF',
    });
  }

  if (input.donations > 0 || input.donationsAssociations > 0) {
    const total = input.donations + input.donationsAssociations;
    const c75 = Math.min(input.donationsAssociations, c.donationReduction75Max) * c.donationReduction75;
    const remaining = total - Math.min(input.donationsAssociations, c.donationReduction75Max);
    const c66 = remaining * c.donationReduction66;
    out.push({
      id: 'OPT_DONATIONS',
      category: 'Crédits d\'impôt',
      type: 'credit',
      title: 'Réduction dons optimisée',
      description: `75% jusqu'à ${c.donationReduction75Max}€ (aide urgente), puis 66% au-delà.`,
      estimatedSavings: Math.round(c75 + c66),
      effort: 'Conserver les reçus fiscaux',
      taxBox: '7UD/7UF',
    });
  }

  if (input.childrenStudents.length > 0) {
    const credit = input.childrenStudents.reduce((s, age) => {
      if (age >= 11 && age <= 14) return s + c.schoolingCreditCollege;
      if (age >= 15 && age <= 17) return s + c.schoolingCreditLycee;
      if (age >= 18) return s + c.schoolingCreditUniversity;
      return s;
    }, 0);
    if (credit > 0) {
      out.push({
        id: 'OPT_SCHOOLING',
        category: 'Crédits d\'impôt',
        type: 'credit',
        title: 'Réduction frais scolarité',
        description: `${c.schoolingCreditCollege}€/collégien, ${c.schoolingCreditLycee}€/lycéen, ${c.schoolingCreditUniversity}€/étudiant.`,
        estimatedSavings: credit,
        effort: 'Renseigner les cases (2 min)',
        taxBox: '7EA/7EC/7EF',
      });
    }
  }

  if (input.fipFcpiInvestment > 0) {
    const r = Math.min(input.fipFcpiInvestment, c.maxFipFcpi) * c.fipFcpiReduction;
    out.push({
      id: 'OPT_FIP_FCPI',
      category: 'Investissements',
      type: 'deduction',
      title: 'Réduction FIP/FCPI',
      description: `Réduction de 25% de l'investissement, max ${c.maxFipFcpi}€.`,
      estimatedSavings: Math.round(r),
      effort: 'Investissement déjà réalisé',
      taxBox: '7GQ/7GR',
    });
  }

  if (input.pmeInvestment > 0) {
    const r = Math.min(input.pmeInvestment, c.maxPME) * c.pmeReduction;
    out.push({
      id: 'OPT_PME',
      category: 'Investissements',
      type: 'deduction',
      title: 'Réduction capital PME',
      description: 'Réduction de 25% des souscriptions au capital de PME.',
      estimatedSavings: Math.round(r),
      effort: 'Attestation de la PME',
      taxBox: '7CF',
    });
  }

  if (input.esusInvestment > 0) {
    const r = Math.min(input.esusInvestment, c.maxESUS) * c.esusReduction;
    out.push({
      id: 'OPT_ESUS',
      category: 'Investissements',
      type: 'deduction',
      title: 'Réduction ESUS solidaire',
      description: 'Réduction de 25% pour entreprises solidaires d\'utilité sociale.',
      estimatedSavings: Math.round(r),
      effort: 'Attestation ESUS',
      taxBox: '7GW',
    });
  }

  if (input.caresForElderlyParent && input.elderlyParentExpenses > 0) {
    const ded = Math.min(input.elderlyParentExpenses, c.alimonyFlatRate);
    out.push({
      id: 'OPT_ELDERLY_PARENT',
      category: 'Situations particulières',
      type: 'deduction',
      title: 'Déduction accueil parent',
      description: `Déduction forfaitaire de ${c.alimonyFlatRate}€ pour hébergement d'un parent.`,
      estimatedSavings: Math.round(ded * marginRate),
      effort: 'Attestation d\'hébergement',
      taxBox: '6EU',
    });
  }

  if (input.hasDisability) {
    out.push({
      id: 'OPT_DISABILITY',
      category: 'Situations particulières',
      type: 'exoneration',
      title: 'Demi-part invalidité',
      description: 'Demi-part supplémentaire pour invalidité (carte 80%+).',
      estimatedSavings: c.halfShareCap,
      effort: 'Joindre le justificatif',
      taxBox: 'P/F',
    });
  }

  return out.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}

// Convertit un row `profiles` en TaxScannerInput minimal
export function profileToScannerInput(p: any): TaxScannerInput {
  const childrenAges: number[] = Array.isArray(p.children_details)
    ? p.children_details.map((c: any) => c?.age ?? 10).filter((n: any) => typeof n === 'number')
    : [];
  const childrenStudents = childrenAges.filter(a => a >= 11);

  const annualSalary = (Number(p.gross_monthly_salary) || 0) * 12 + (Number(p.annual_bonus) || 0) + (Number(p.thirteenth_month) || 0);

  // Rental
  let rentalIncome = 0;
  let rentalExpenses = 0;
  let rentalFurnished = false;
  if (Array.isArray(p.rental_properties)) {
    for (const r of p.rental_properties) {
      rentalIncome += Number(r?.annual_rent) || 0;
      rentalExpenses += Number(r?.annual_charges) || 0;
      if (r?.furnished) rentalFurnished = true;
    }
  }

  return {
    familyStatus: (p.family_status || 'single') as FamilyStatus,
    birthYear: p.birth_year || 1990,
    childrenCount: p.children_count || 0,
    childrenAges,
    childrenStudents,
    isJournalist: false,
    isSalesRep: false,
    salaryDeclared: annualSalary,
    businessRevenue: Number(p.annual_revenue_ht) || 0,
    rentalIncome,
    rentalFurnished,
    rentalExpenses,
    rentalWorks: Number(p.annual_rental_works) || 0,
    dividends: Number(p.cto_dividends) || 0,
    realExpenses: p.has_real_expenses ? (Number(p.real_expenses_amount) || 0) : 0,
    perContributions: 0,
    perAvailable: 0,
    childcareExpenses: 0,
    homeEmployeeExpenses: 0,
    donations: 0,
    donationsAssociations: 0,
    schoolingExpenses: { college: 0, lycee: 0, university: 0 },
    fipFcpiInvestment: 0,
    pmeInvestment: 0,
    esusInvestment: 0,
    hasDisability: false,
    caresForElderlyParent: false,
    elderlyParentExpenses: 0,
  };
}
