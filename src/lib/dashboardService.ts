import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  fullName: string;
  isEmployee: boolean;
  isSelfEmployed: boolean;
  isRetired: boolean;
  isInvestor: boolean;
  onboardingCompleted: boolean;
  // Employee
  grossMonthlySalary: number;
  netMonthlySalary: number;
  annualBonus: number;
  thirteenthMonth: number;
  overtimeAnnual: number;
  hasRealExpenses: boolean;
  realExpensesAmount: number;
  peeAmount: number;
  percoAmount: number;
  stockOptionsValue: number;
  // Self-employed
  annualRevenueHt: number;
  socialChargesPaid: number;
  officeRent: number;
  vehicleExpenses: number;
  professionalSupplies: number;
  fiscalStatus: string;
  // Retired
  mainPensionAnnual: number;
  supplementaryIncome: number;
  capitalGains2025: number;
  // Investments
  peaBalance: number;
  peaContributions2025: number;
  ctoDividends: number;
  ctoCapitalGains: number;
  lifeInsuranceBalance: number;
  cryptoPnl2025: number;
  scpiInvestments: number;
  rentalPropertiesCount: number;
  annualRentalWorks: number;
  mortgageRemaining: number;
  // Family
  childrenCount: number;
  familyStatus: string;
  spouseIncome: number;
}

export interface DashboardMetrics {
  totalAnnualIncome: number;
  estimatedTax: number;
  potentialSavings: number;
  deductibleExpenses: number;
  profileTypes: string[];
  alerts: DashboardAlert[];
  recommendations: DashboardRecommendation[];
}

export interface DashboardAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  gain: number;
  deadline?: string;
  action?: string;
}

export interface DashboardRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  gain: number;
  effort: string;
  deadline: string;
  currentOption: { label: string; value: number; detail: string };
  recommendedOption: { label: string; value: number; detail: string };
}

const MICRO_THRESHOLD_2025 = 77700;

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const d = data as any;
  return {
    fullName: d.full_name || 'Utilisateur',
    isEmployee: d.is_employee || false,
    isSelfEmployed: d.is_self_employed || false,
    isRetired: d.is_retired || false,
    isInvestor: d.is_investor || false,
    onboardingCompleted: d.onboarding_completed || false,
    grossMonthlySalary: d.gross_monthly_salary || 0,
    netMonthlySalary: d.net_monthly_salary || 0,
    annualBonus: d.annual_bonus || 0,
    thirteenthMonth: d.thirteenth_month || 0,
    overtimeAnnual: d.overtime_annual || 0,
    hasRealExpenses: d.has_real_expenses || false,
    realExpensesAmount: d.real_expenses_amount || 0,
    peeAmount: d.pee_amount || 0,
    percoAmount: d.perco_amount || 0,
    stockOptionsValue: d.stock_options_value || 0,
    annualRevenueHt: d.annual_revenue_ht || 0,
    socialChargesPaid: d.social_charges_paid || 0,
    officeRent: d.office_rent || 0,
    vehicleExpenses: d.vehicle_expenses || 0,
    professionalSupplies: d.professional_supplies || 0,
    fiscalStatus: d.fiscal_status || 'micro',
    mainPensionAnnual: d.main_pension_annual || 0,
    supplementaryIncome: d.supplementary_income || 0,
    capitalGains2025: d.capital_gains_2025 || 0,
    peaBalance: d.pea_balance || 0,
    peaContributions2025: d.pea_contributions_2025 || 0,
    ctoDividends: d.cto_dividends || 0,
    ctoCapitalGains: d.cto_capital_gains || 0,
    lifeInsuranceBalance: d.life_insurance_balance || 0,
    cryptoPnl2025: d.crypto_pnl_2025 || 0,
    scpiInvestments: d.scpi_investments || 0,
    rentalPropertiesCount: (d.rental_properties || []).length,
    annualRentalWorks: d.annual_rental_works || 0,
    mortgageRemaining: d.mortgage_remaining || 0,
    childrenCount: d.children_count || 0,
    familyStatus: d.family_status || 'single',
    spouseIncome: d.spouse_income || 0,
  };
};

export const calculateDashboardMetrics = (profile: UserProfile): DashboardMetrics => {
  const alerts: DashboardAlert[] = [];
  const recommendations: DashboardRecommendation[] = [];
  let totalAnnualIncome = 0;
  let deductibleExpenses = 0;
  let potentialSavings = 0;
  const profileTypes: string[] = [];

  // Calculate income based on profile types
  if (profile.isEmployee) {
    profileTypes.push('Salarié');
    const annualSalary = profile.grossMonthlySalary * 12 + profile.annualBonus + profile.thirteenthMonth;
    totalAnnualIncome += annualSalary;
    
    // Real expenses vs 10% deduction
    const standardDeduction = annualSalary * 0.10;
    if (profile.hasRealExpenses && profile.realExpensesAmount > standardDeduction) {
      deductibleExpenses += profile.realExpensesAmount;
    } else if (profile.realExpensesAmount > standardDeduction) {
      const gain = Math.round((profile.realExpensesAmount - standardDeduction) * 0.3);
      if (gain > 100) {
        potentialSavings += gain;
        recommendations.push({
          id: 'real-expenses',
          type: 'deduction',
          title: 'Passez aux frais réels',
          description: 'Vos frais professionnels dépassent l\'abattement forfaitaire de 10%.',
          gain,
          effort: '2h de travail',
          deadline: '2025-05-31',
          currentOption: { label: 'Actuel', value: standardDeduction, detail: 'Abattement 10%' },
          recommendedOption: { label: 'Optimisé', value: profile.realExpensesAmount, detail: 'Frais réels déclarés' }
        });
      }
    }

    // PEE/PERCO optimization
    if (profile.peeAmount > 0 || profile.percoAmount > 0) {
      deductibleExpenses += profile.peeAmount + profile.percoAmount;
    } else if (profile.grossMonthlySalary > 3000) {
      const suggestedPee = profile.grossMonthlySalary * 0.05 * 12;
      const gain = Math.round(suggestedPee * 0.15);
      potentialSavings += gain;
      recommendations.push({
        id: 'pee-perco',
        type: 'savings',
        title: 'Optimisez votre épargne salariale',
        description: 'Profitez de l\'abondement employeur sur le PEE/PERCO pour réduire votre imposition.',
        gain,
        effort: '30 min',
        deadline: '2025-12-31',
        currentOption: { label: 'Actuel', value: 0, detail: 'Aucun versement' },
        recommendedOption: { label: 'Optimisé', value: suggestedPee, detail: 'Versement annuel optimisé' }
      });
    }
  }

  if (profile.isSelfEmployed) {
    profileTypes.push('Indépendant');
    totalAnnualIncome += profile.annualRevenueHt;
    deductibleExpenses += profile.socialChargesPaid + profile.officeRent + profile.vehicleExpenses + profile.professionalSupplies;

    // Micro threshold warning
    const microUsage = (profile.annualRevenueHt / MICRO_THRESHOLD_2025) * 100;
    if (microUsage > 90) {
      alerts.push({
        id: 'micro-threshold',
        type: 'threshold',
        title: '⚠️ Seuil micro-entreprise proche',
        message: `Vous êtes à ${Math.round(microUsage)}% du plafond. Anticipez le passage au réel.`,
        severity: 'critical',
        gain: 0,
        deadline: '2025-12-31'
      });
    } else if (microUsage > 70) {
      alerts.push({
        id: 'micro-warning',
        type: 'threshold',
        title: 'Surveillance du seuil micro',
        message: `CA à ${Math.round(microUsage)}% du plafond. Marge de ${formatCurrency(MICRO_THRESHOLD_2025 - profile.annualRevenueHt)}.`,
        severity: 'warning',
        gain: 0
      });
    }

    // Status optimization
    if (profile.fiscalStatus === 'micro' && profile.annualRevenueHt > 50000) {
      const microCharges = profile.annualRevenueHt * 0.22;
      const reelCharges = profile.socialChargesPaid + profile.officeRent + profile.vehicleExpenses + profile.professionalSupplies;
      if (reelCharges > microCharges * 0.5) {
        const gain = Math.round((profile.annualRevenueHt - reelCharges) * 0.1 - (profile.annualRevenueHt * 0.78) * 0.1);
        if (gain > 500) {
          potentialSavings += gain;
          recommendations.push({
            id: 'regime-reel',
            type: 'status',
            title: 'Étudiez le passage au réel',
            description: 'Vos charges justifient potentiellement un passage au régime réel.',
            gain,
            effort: 'Étude comptable',
            deadline: '2025-12-31',
            currentOption: { label: 'Actuel', value: profile.annualRevenueHt * 0.22, detail: 'Micro: abattement 22%' },
            recommendedOption: { label: 'Optimisé', value: reelCharges, detail: 'Réel: charges déduites' }
          });
        }
      }
    }
  }

  if (profile.isRetired) {
    profileTypes.push('Retraité');
    totalAnnualIncome += profile.mainPensionAnnual + profile.supplementaryIncome;
    
    if (profile.capitalGains2025 > 0) {
      alerts.push({
        id: 'capital-gains',
        type: 'declaration',
        title: 'Plus-values à déclarer',
        message: `${formatCurrency(profile.capitalGains2025)} de plus-values réalisées en 2025.`,
        severity: 'info',
        gain: 0
      });
    }
  }

  if (profile.isInvestor) {
    profileTypes.push('Investisseur');
    totalAnnualIncome += profile.ctoDividends + profile.ctoCapitalGains + profile.cryptoPnl2025;
    
    // PEA optimization
    if (profile.peaBalance < 150000 && profile.ctoDividends > 1000) {
      const gain = Math.round(profile.ctoDividends * 0.17);
      potentialSavings += gain;
      recommendations.push({
        id: 'pea-transfer',
        type: 'investment',
        title: 'Privilégiez le PEA',
        description: 'Transférez vos investissements actions vers votre PEA pour une fiscalité allégée après 5 ans.',
        gain,
        effort: '1h',
        deadline: '2025-12-31',
        currentOption: { label: 'Actuel', value: profile.ctoDividends, detail: 'Dividendes CTO (30% flat tax)' },
        recommendedOption: { label: 'Optimisé', value: profile.ctoDividends * 0.828, detail: 'PEA (17.2% après 5 ans)' }
      });
    }

    if (profile.lifeInsuranceBalance > 0) {
      alerts.push({
        id: 'life-insurance',
        type: 'info',
        title: 'Assurance-vie active',
        message: `Encours de ${formatCurrency(profile.lifeInsuranceBalance)}. Vérifiez l'ancienneté pour l'abattement.`,
        severity: 'info',
        gain: 0
      });
    }

    if (profile.cryptoPnl2025 > 0) {
      alerts.push({
        id: 'crypto-declaration',
        type: 'declaration',
        title: 'Crypto à déclarer (2086)',
        message: `Plus-value de ${formatCurrency(profile.cryptoPnl2025)} à reporter sur le formulaire 2086.`,
        severity: 'warning',
        gain: 0,
        action: '/crypto/2086'
      });

      const cryptoTax = Math.round(profile.cryptoPnl2025 * 0.30);
      potentialSavings += Math.round(profile.cryptoPnl2025 * 0.005);
      recommendations.push({
        id: 'crypto-2086',
        type: 'tax',
        title: 'Déclarer mes crypto (2086)',
        description: `${formatCurrency(profile.cryptoPnl2025)} de plus-values crypto à déclarer. Préparez votre formulaire 2086 avec Elio.`,
        gain: Math.round(profile.cryptoPnl2025 * 0.005),
        effort: '30 min',
        deadline: '2025-05-22',
        currentOption: { label: 'Non déclaré', value: cryptoTax + 750, detail: 'Impôt + amende 750 €' },
        recommendedOption: { label: 'Déclaré', value: cryptoTax, detail: `PFU 30% = ${formatCurrency(cryptoTax)}` }
      });
    }

    if (profile.rentalPropertiesCount > 0 && profile.annualRentalWorks > 0) {
      deductibleExpenses += profile.annualRentalWorks;
    }
  }

  // Family quotient optimization
  if (profile.childrenCount > 0) {
    const quotientParts = 1 + (profile.familyStatus === 'married' || profile.familyStatus === 'pacs' ? 1 : 0) + (profile.childrenCount * 0.5);
    alerts.push({
      id: 'family-quotient',
      type: 'quotient',
      title: 'Quotient familial',
      message: `${quotientParts} parts fiscales avec ${profile.childrenCount} enfant(s) à charge.`,
      severity: 'success',
      gain: Math.round(profile.childrenCount * 1500)
    });
  }

  // Calculate estimated tax (simplified)
  const taxableIncome = Math.max(0, totalAnnualIncome - deductibleExpenses);
  let estimatedTax = 0;
  if (taxableIncome > 11294) estimatedTax += (Math.min(taxableIncome, 28797) - 11294) * 0.11;
  if (taxableIncome > 28797) estimatedTax += (Math.min(taxableIncome, 82341) - 28797) * 0.30;
  if (taxableIncome > 82341) estimatedTax += (Math.min(taxableIncome, 177106) - 82341) * 0.41;
  if (taxableIncome > 177106) estimatedTax += (taxableIncome - 177106) * 0.45;

  // Onboarding reminder
  if (!profile.onboardingCompleted) {
    alerts.unshift({
      id: 'complete-profile',
      type: 'onboarding',
      title: 'Complétez votre profil fiscal',
      message: 'Finalisez votre onboarding pour des recommandations personnalisées.',
      severity: 'warning',
      gain: 0
    });
  }

  return {
    totalAnnualIncome,
    estimatedTax: Math.round(estimatedTax),
    potentialSavings,
    deductibleExpenses,
    profileTypes,
    alerts: alerts.slice(0, 5),
    recommendations: recommendations.slice(0, 3)
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount);
};
