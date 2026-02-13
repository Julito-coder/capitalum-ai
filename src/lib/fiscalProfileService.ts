import { supabase } from '@/integrations/supabase/client';
import { OnboardingData, DEFAULT_ONBOARDING_DATA } from '@/data/onboardingTypes';

export interface FiscalProfileData extends OnboardingData {
  declaresInFrance: boolean;
  hasRentalIncome: boolean;
  hasInvestments: boolean;
}

const DEFAULT_FISCAL: FiscalProfileData = {
  ...DEFAULT_ONBOARDING_DATA,
  declaresInFrance: true,
  hasRentalIncome: false,
  hasInvestments: false,
};

/**
 * Load the full fiscal profile from DB.
 */
export const loadFiscalProfile = async (userId: string): Promise<FiscalProfileData> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return DEFAULT_FISCAL;

    const d = data as any;
    const profileTypes: OnboardingData['profileTypes'] = [];
    if (d.is_employee) profileTypes.push('employee');
    if (d.is_self_employed) profileTypes.push('self_employed');
    if (d.is_retired) profileTypes.push('retired');
    if (d.is_investor) profileTypes.push('investor');

    return {
      profileTypes,
      fullName: d.full_name || '',
      nif: d.nif || '',
      birthYear: d.birth_year || 1985,
      phone: d.phone || '',
      addressStreet: d.address_street || '',
      addressCity: d.address_city || '',
      addressPostalCode: d.address_postal_code || '',
      residenceDurationYears: d.residence_duration_years || 0,
      isHomeowner: d.is_homeowner || false,
      familyStatus: d.family_status || 'single',
      childrenCount: d.children_count || 0,
      childrenDetails: d.children_details || [],
      spouseIncome: d.spouse_income || 0,
      primaryObjective: d.primary_objective || 'reduce_ir',
      employerName: d.employer_name || '',
      employerSiret: d.employer_siret || '',
      contractType: d.contract_type || 'cdi',
      contractStartDate: d.contract_start_date || '',
      grossMonthlySalary: d.gross_monthly_salary || 0,
      netMonthlySalary: d.net_monthly_salary || 0,
      annualBonus: d.annual_bonus || 0,
      thirteenthMonth: d.thirteenth_month || 0,
      overtimeAnnual: d.overtime_annual || 0,
      hasRealExpenses: d.has_real_expenses || false,
      realExpensesAmount: d.real_expenses_amount || 0,
      hasCompanyHealthInsurance: d.has_company_health_insurance || false,
      hasMealVouchers: d.has_meal_vouchers || false,
      peeAmount: d.pee_amount || 0,
      percoAmount: d.perco_amount || 0,
      stockOptionsValue: d.stock_options_value || 0,
      siret: d.siret || '',
      companyCreationDate: d.company_creation_date || '',
      apeCode: d.ape_code || '',
      fiscalStatus: d.fiscal_status || 'micro',
      annualRevenueHt: d.annual_revenue_ht || 0,
      socialChargesPaid: d.social_charges_paid || 0,
      officeRent: d.office_rent || 0,
      vehicleExpenses: d.vehicle_expenses || 0,
      professionalSupplies: d.professional_supplies || 0,
      topClients: d.top_clients || [],
      accountingSoftware: d.accounting_software || '',
      mainPensionAnnual: d.main_pension_annual || 0,
      complementaryPensions: d.complementary_pensions || [],
      liquidationDate: d.liquidation_date || '',
      supplementaryIncome: d.supplementary_income || 0,
      capitalGains2025: d.capital_gains_2025 || 0,
      recentDonations: d.recent_donations || [],
      rentalProperties: d.rental_properties || [],
      rentalScheme: d.rental_scheme || 'nu',
      annualRentalWorks: d.annual_rental_works || 0,
      mortgageRemaining: d.mortgage_remaining || 0,
      ifiLiable: d.ifi_liable || false,
      peaBalance: d.pea_balance || 0,
      peaContributions2025: d.pea_contributions_2025 || 0,
      ctoDividends: d.cto_dividends || 0,
      ctoCapitalGains: d.cto_capital_gains || 0,
      lifeInsuranceBalance: d.life_insurance_balance || 0,
      lifeInsuranceContributions: d.life_insurance_contributions || 0,
      lifeInsuranceWithdrawals: d.life_insurance_withdrawals || 0,
      cryptoWalletAddress: d.crypto_wallet_address || '',
      cryptoPnl2025: d.crypto_pnl_2025 || 0,
      scpiInvestments: d.scpi_investments || 0,
      crowdfundingInvestments: d.crowdfunding_investments || 0,
      gdprConsent: d.gdpr_consent || false,
      aiAnalysisConsent: d.ai_analysis_consent || false,
      declaresInFrance: d.declares_in_france ?? true,
      hasRentalIncome: d.has_rental_income || false,
      hasInvestments: d.has_investments || false,
    };
  } catch {
    return DEFAULT_FISCAL;
  }
};

/**
 * Save partial fiscal profile data.
 */
export const saveFiscalProfile = async (
  userId: string,
  data: Partial<FiscalProfileData>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // Map fields only if they exist in data
    if (data.fullName !== undefined) payload.full_name = data.fullName;
    if (data.nif !== undefined) payload.nif = data.nif;
    if (data.birthYear !== undefined) payload.birth_year = data.birthYear;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.addressStreet !== undefined) payload.address_street = data.addressStreet;
    if (data.addressCity !== undefined) payload.address_city = data.addressCity;
    if (data.addressPostalCode !== undefined) payload.address_postal_code = data.addressPostalCode;
    if (data.residenceDurationYears !== undefined) payload.residence_duration_years = data.residenceDurationYears;
    if (data.isHomeowner !== undefined) payload.is_homeowner = data.isHomeowner;
    if (data.familyStatus !== undefined) payload.family_status = data.familyStatus;
    if (data.childrenCount !== undefined) payload.children_count = data.childrenCount;
    if (data.childrenDetails !== undefined) payload.children_details = data.childrenDetails;
    if (data.spouseIncome !== undefined) payload.spouse_income = data.spouseIncome;
    if (data.primaryObjective !== undefined) payload.primary_objective = data.primaryObjective;
    if (data.profileTypes !== undefined) {
      payload.is_employee = data.profileTypes.includes('employee');
      payload.is_self_employed = data.profileTypes.includes('self_employed');
      payload.is_retired = data.profileTypes.includes('retired');
      payload.is_investor = data.profileTypes.includes('investor');
    }
    if (data.employerName !== undefined) payload.employer_name = data.employerName;
    if (data.employerSiret !== undefined) payload.employer_siret = data.employerSiret;
    if (data.contractType !== undefined) payload.contract_type = data.contractType;
    if (data.contractStartDate !== undefined) payload.contract_start_date = data.contractStartDate || null;
    if (data.grossMonthlySalary !== undefined) payload.gross_monthly_salary = data.grossMonthlySalary;
    if (data.netMonthlySalary !== undefined) payload.net_monthly_salary = data.netMonthlySalary;
    if (data.annualBonus !== undefined) payload.annual_bonus = data.annualBonus;
    if (data.thirteenthMonth !== undefined) payload.thirteenth_month = data.thirteenthMonth;
    if (data.overtimeAnnual !== undefined) payload.overtime_annual = data.overtimeAnnual;
    if (data.hasRealExpenses !== undefined) payload.has_real_expenses = data.hasRealExpenses;
    if (data.realExpensesAmount !== undefined) payload.real_expenses_amount = data.realExpensesAmount;
    if (data.hasCompanyHealthInsurance !== undefined) payload.has_company_health_insurance = data.hasCompanyHealthInsurance;
    if (data.hasMealVouchers !== undefined) payload.has_meal_vouchers = data.hasMealVouchers;
    if (data.peeAmount !== undefined) payload.pee_amount = data.peeAmount;
    if (data.percoAmount !== undefined) payload.perco_amount = data.percoAmount;
    if (data.stockOptionsValue !== undefined) payload.stock_options_value = data.stockOptionsValue;
    if (data.siret !== undefined) payload.siret = data.siret;
    if (data.companyCreationDate !== undefined) payload.company_creation_date = data.companyCreationDate || null;
    if (data.apeCode !== undefined) payload.ape_code = data.apeCode;
    if (data.fiscalStatus !== undefined) payload.fiscal_status = data.fiscalStatus;
    if (data.annualRevenueHt !== undefined) payload.annual_revenue_ht = data.annualRevenueHt;
    if (data.socialChargesPaid !== undefined) payload.social_charges_paid = data.socialChargesPaid;
    if (data.officeRent !== undefined) payload.office_rent = data.officeRent;
    if (data.vehicleExpenses !== undefined) payload.vehicle_expenses = data.vehicleExpenses;
    if (data.professionalSupplies !== undefined) payload.professional_supplies = data.professionalSupplies;
    if (data.topClients !== undefined) payload.top_clients = data.topClients;
    if (data.accountingSoftware !== undefined) payload.accounting_software = data.accountingSoftware;
    if (data.mainPensionAnnual !== undefined) payload.main_pension_annual = data.mainPensionAnnual;
    if (data.complementaryPensions !== undefined) payload.complementary_pensions = data.complementaryPensions;
    if (data.liquidationDate !== undefined) payload.liquidation_date = data.liquidationDate || null;
    if (data.supplementaryIncome !== undefined) payload.supplementary_income = data.supplementaryIncome;
    if (data.capitalGains2025 !== undefined) payload.capital_gains_2025 = data.capitalGains2025;
    if (data.recentDonations !== undefined) payload.recent_donations = data.recentDonations;
    if (data.rentalProperties !== undefined) payload.rental_properties = data.rentalProperties;
    if (data.rentalScheme !== undefined) payload.rental_scheme = data.rentalScheme;
    if (data.annualRentalWorks !== undefined) payload.annual_rental_works = data.annualRentalWorks;
    if (data.mortgageRemaining !== undefined) payload.mortgage_remaining = data.mortgageRemaining;
    if (data.ifiLiable !== undefined) payload.ifi_liable = data.ifiLiable;
    if (data.peaBalance !== undefined) payload.pea_balance = data.peaBalance;
    if (data.peaContributions2025 !== undefined) payload.pea_contributions_2025 = data.peaContributions2025;
    if (data.ctoDividends !== undefined) payload.cto_dividends = data.ctoDividends;
    if (data.ctoCapitalGains !== undefined) payload.cto_capital_gains = data.ctoCapitalGains;
    if (data.lifeInsuranceBalance !== undefined) payload.life_insurance_balance = data.lifeInsuranceBalance;
    if (data.lifeInsuranceContributions !== undefined) payload.life_insurance_contributions = data.lifeInsuranceContributions;
    if (data.lifeInsuranceWithdrawals !== undefined) payload.life_insurance_withdrawals = data.lifeInsuranceWithdrawals;
    if (data.cryptoWalletAddress !== undefined) payload.crypto_wallet_address = data.cryptoWalletAddress;
    if (data.cryptoPnl2025 !== undefined) payload.crypto_pnl_2025 = data.cryptoPnl2025;
    if (data.scpiInvestments !== undefined) payload.scpi_investments = data.scpiInvestments;
    if (data.crowdfundingInvestments !== undefined) payload.crowdfunding_investments = data.crowdfundingInvestments;
    if (data.gdprConsent !== undefined) {
      payload.gdpr_consent = data.gdprConsent;
      if (data.gdprConsent) payload.gdpr_consent_date = new Date().toISOString();
    }
    if (data.aiAnalysisConsent !== undefined) payload.ai_analysis_consent = data.aiAnalysisConsent;
    if (data.declaresInFrance !== undefined) payload.declares_in_france = data.declaresInFrance;
    if (data.hasRentalIncome !== undefined) payload.has_rental_income = data.hasRentalIncome;
    if (data.hasInvestments !== undefined) payload.has_investments = data.hasInvestments;

    payload.tax_profile_updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update(payload as any)
      .eq('user_id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur lors de la sauvegarde' };
  }
};

/**
 * Calculate profile completion percentage based on relevant fields per profile type.
 */
export const calculateProfileCompletion = (data: FiscalProfileData): number => {
  const checks: boolean[] = [];

  // Identity (always relevant)
  checks.push(!!data.fullName);
  checks.push(!!data.nif);
  checks.push(data.birthYear > 0 && data.birthYear !== 1985);
  checks.push(!!data.phone);
  checks.push(!!data.addressCity);

  // Family
  checks.push(!!data.familyStatus);
  checks.push(data.childrenCount >= 0); // always true, but let's check details
  if (data.childrenCount > 0) {
    checks.push(data.childrenDetails.length > 0);
  }

  // Profile types
  checks.push(data.profileTypes.length > 0);

  // Employee-specific
  if (data.profileTypes.includes('employee')) {
    checks.push(!!data.employerName);
    checks.push(data.grossMonthlySalary > 0);
    checks.push(data.netMonthlySalary > 0);
    checks.push(!!data.contractType);
  }

  // Self-employed
  if (data.profileTypes.includes('self_employed')) {
    checks.push(!!data.siret);
    checks.push(data.annualRevenueHt > 0);
    checks.push(!!data.fiscalStatus);
  }

  // Retired
  if (data.profileTypes.includes('retired')) {
    checks.push(data.mainPensionAnnual > 0);
  }

  // Investments
  if (data.profileTypes.includes('investor') || data.hasInvestments) {
    checks.push(
      data.peaBalance > 0 ||
      data.lifeInsuranceBalance > 0 ||
      data.scpiInvestments > 0 ||
      data.crowdfundingInvestments > 0 ||
      data.cryptoPnl2025 !== 0
    );
  }

  // Consents
  checks.push(data.gdprConsent);

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};
