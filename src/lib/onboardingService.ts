import { supabase } from '@/integrations/supabase/client';
import { OnboardingData } from '@/data/onboardingTypes';

export const saveOnboardingData = async (userId: string, data: OnboardingData): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        // Identity
        full_name: data.fullName,
        nif: data.nif,
        birth_year: data.birthYear,
        phone: data.phone,
        address_street: data.addressStreet,
        address_city: data.addressCity,
        address_postal_code: data.addressPostalCode,
        residence_duration_years: data.residenceDurationYears,
        is_homeowner: data.isHomeowner,
        
        // Family
        family_status: data.familyStatus,
        children_count: data.childrenCount,
        children_details: data.childrenDetails,
        spouse_income: data.spouseIncome,
        
        // Objective & Profile Types
        primary_objective: data.primaryObjective,
        is_employee: data.profileTypes.includes('employee'),
        is_self_employed: data.profileTypes.includes('self_employed'),
        is_retired: data.profileTypes.includes('retired'),
        is_investor: data.profileTypes.includes('investor'),
        
        // Employee fields
        employer_name: data.employerName,
        employer_siret: data.employerSiret,
        contract_type: data.contractType,
        contract_start_date: data.contractStartDate || null,
        gross_monthly_salary: data.grossMonthlySalary,
        net_monthly_salary: data.netMonthlySalary,
        annual_bonus: data.annualBonus,
        thirteenth_month: data.thirteenthMonth,
        overtime_annual: data.overtimeAnnual,
        has_real_expenses: data.hasRealExpenses,
        real_expenses_amount: data.realExpensesAmount,
        has_company_health_insurance: data.hasCompanyHealthInsurance,
        has_meal_vouchers: data.hasMealVouchers,
        pee_amount: data.peeAmount,
        perco_amount: data.percoAmount,
        stock_options_value: data.stockOptionsValue,
        
        // Self-employed fields
        siret: data.siret,
        company_creation_date: data.companyCreationDate || null,
        ape_code: data.apeCode,
        fiscal_status: data.fiscalStatus,
        annual_revenue_ht: data.annualRevenueHt,
        social_charges_paid: data.socialChargesPaid,
        office_rent: data.officeRent,
        vehicle_expenses: data.vehicleExpenses,
        professional_supplies: data.professionalSupplies,
        top_clients: data.topClients,
        accounting_software: data.accountingSoftware,
        
        // Retired fields
        main_pension_annual: data.mainPensionAnnual,
        complementary_pensions: data.complementaryPensions,
        liquidation_date: data.liquidationDate || null,
        supplementary_income: data.supplementaryIncome,
        capital_gains_2025: data.capitalGains2025,
        recent_donations: data.recentDonations,
        
        // Investment: Real Estate
        rental_properties: data.rentalProperties,
        rental_scheme: data.rentalScheme,
        annual_rental_works: data.annualRentalWorks,
        mortgage_remaining: data.mortgageRemaining,
        ifi_liable: data.ifiLiable,
        
        // Investment: Financial
        pea_balance: data.peaBalance,
        pea_contributions_2025: data.peaContributions2025,
        cto_dividends: data.ctoDividends,
        cto_capital_gains: data.ctoCapitalGains,
        life_insurance_balance: data.lifeInsuranceBalance,
        life_insurance_contributions: data.lifeInsuranceContributions,
        life_insurance_withdrawals: data.lifeInsuranceWithdrawals,
        crypto_wallet_address: data.cryptoWalletAddress,
        crypto_pnl_2025: data.cryptoPnl2025,
        scpi_investments: data.scpiInvestments,
        crowdfunding_investments: data.crowdfundingInvestments,
        
        // Onboarding status
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        gdpr_consent: data.gdprConsent,
        gdpr_consent_date: data.gdprConsent ? new Date().toISOString() : null,
        ai_analysis_consent: data.aiAnalysisConsent,
        
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving onboarding data:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return { success: false, error: 'Une erreur est survenue lors de la sauvegarde' };
  }
};

export const loadOnboardingData = async (userId: string): Promise<Partial<OnboardingData> | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    const profileTypes: OnboardingData['profileTypes'] = [];
    if ((data as any).is_employee) profileTypes.push('employee');
    if ((data as any).is_self_employed) profileTypes.push('self_employed');
    if ((data as any).is_retired) profileTypes.push('retired');
    if ((data as any).is_investor) profileTypes.push('investor');

    return {
      profileTypes,
      fullName: data.full_name || '',
      nif: (data as any).nif || '',
      birthYear: data.birth_year || 1985,
      phone: (data as any).phone || '',
      addressStreet: (data as any).address_street || '',
      addressCity: (data as any).address_city || '',
      addressPostalCode: (data as any).address_postal_code || '',
      residenceDurationYears: (data as any).residence_duration_years || 0,
      isHomeowner: (data as any).is_homeowner || false,
      familyStatus: (data.family_status as OnboardingData['familyStatus']) || 'single',
      childrenCount: data.children_count || 0,
      childrenDetails: (data as any).children_details || [],
      spouseIncome: (data as any).spouse_income || 0,
      primaryObjective: ((data as any).primary_objective as OnboardingData['primaryObjective']) || 'reduce_ir',
      // Employee
      employerName: (data as any).employer_name || '',
      employerSiret: (data as any).employer_siret || '',
      contractType: ((data as any).contract_type as OnboardingData['contractType']) || 'cdi',
      contractStartDate: (data as any).contract_start_date || '',
      grossMonthlySalary: (data as any).gross_monthly_salary || 0,
      netMonthlySalary: (data as any).net_monthly_salary || 0,
      annualBonus: (data as any).annual_bonus || 0,
      thirteenthMonth: (data as any).thirteenth_month || 0,
      overtimeAnnual: (data as any).overtime_annual || 0,
      hasRealExpenses: (data as any).has_real_expenses || false,
      realExpensesAmount: (data as any).real_expenses_amount || 0,
      hasCompanyHealthInsurance: (data as any).has_company_health_insurance || false,
      hasMealVouchers: (data as any).has_meal_vouchers || false,
      peeAmount: (data as any).pee_amount || 0,
      percoAmount: (data as any).perco_amount || 0,
      stockOptionsValue: (data as any).stock_options_value || 0,
      // Self-employed
      siret: (data as any).siret || '',
      companyCreationDate: (data as any).company_creation_date || '',
      apeCode: (data as any).ape_code || '',
      fiscalStatus: ((data as any).fiscal_status as OnboardingData['fiscalStatus']) || 'micro',
      annualRevenueHt: (data as any).annual_revenue_ht || 0,
      socialChargesPaid: (data as any).social_charges_paid || 0,
      officeRent: (data as any).office_rent || 0,
      vehicleExpenses: (data as any).vehicle_expenses || 0,
      professionalSupplies: (data as any).professional_supplies || 0,
      topClients: (data as any).top_clients || [],
      accountingSoftware: (data as any).accounting_software || '',
      // Retired
      mainPensionAnnual: (data as any).main_pension_annual || 0,
      complementaryPensions: (data as any).complementary_pensions || [],
      liquidationDate: (data as any).liquidation_date || '',
      supplementaryIncome: (data as any).supplementary_income || 0,
      capitalGains2025: (data as any).capital_gains_2025 || 0,
      recentDonations: (data as any).recent_donations || [],
      // Investment
      rentalProperties: (data as any).rental_properties || [],
      rentalScheme: ((data as any).rental_scheme as OnboardingData['rentalScheme']) || 'nu',
      annualRentalWorks: (data as any).annual_rental_works || 0,
      mortgageRemaining: (data as any).mortgage_remaining || 0,
      ifiLiable: (data as any).ifi_liable || false,
      peaBalance: (data as any).pea_balance || 0,
      peaContributions2025: (data as any).pea_contributions_2025 || 0,
      ctoDividends: (data as any).cto_dividends || 0,
      ctoCapitalGains: (data as any).cto_capital_gains || 0,
      lifeInsuranceBalance: (data as any).life_insurance_balance || 0,
      lifeInsuranceContributions: (data as any).life_insurance_contributions || 0,
      lifeInsuranceWithdrawals: (data as any).life_insurance_withdrawals || 0,
      cryptoWalletAddress: (data as any).crypto_wallet_address || '',
      cryptoPnl2025: (data as any).crypto_pnl_2025 || 0,
      scpiInvestments: (data as any).scpi_investments || 0,
      crowdfundingInvestments: (data as any).crowdfunding_investments || 0,
      gdprConsent: (data as any).gdpr_consent || false,
      aiAnalysisConsent: (data as any).ai_analysis_consent || false,
    };
  } catch (error) {
    console.error('Error loading onboarding data:', error);
    return null;
  }
};
