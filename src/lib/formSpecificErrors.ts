// Form-Specific Error Detection for French Tax Forms
// Covers: 2086 (crypto), 3916 (foreign accounts), 2074 (capital gains), 
// 2031 (LMNP), 2035 (BNC), 2047 (foreign income)

import { TaxError, TAX_CONSTANTS_2026 } from '@/data/taxScannerTypes';
import { TaxFormType, ExtendedTaxInput } from '@/data/taxFormTypes';

// ============== CRYPTO ERRORS (2086) ==============

export function detectCryptoErrors(input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  
  // CRYPTO-1: FIFO method not applied
  if (input.cryptoTransactions.length > 0 && !input.hasUsedFIFO) {
    errors.push({
      id: 'ERR_CRYPTO_FIFO',
      category: 'Crypto-actifs',
      code: 'CRYPTO-1',
      severity: 'critical',
      title: 'Méthode FIFO non appliquée',
      description: 'La méthode FIFO (First In First Out) globale est obligatoire pour calculer les plus-values crypto.',
      taxBox: '3AN',
      estimatedRisk: Math.max(input.totalCryptoPortfolioValue * 0.1, 5000),
      legalReference: 'CGI Art. 150 VH bis - BOI-RPPM-PVBMC-30-10',
      action: 'Recalculer toutes les plus-values avec la méthode FIFO globale'
    });
  }
  
  // CRYPTO-2: Airdrops not declared
  if (input.hasStakingIncome && !input.hasDeclaredAirdrops) {
    errors.push({
      id: 'ERR_CRYPTO_AIRDROPS',
      category: 'Crypto-actifs',
      code: 'CRYPTO-2',
      severity: 'warning',
      title: 'Airdrops/Staking potentiellement non déclarés',
      description: 'Les revenus de staking et airdrops constituent des revenus imposables dès leur réception.',
      taxBox: '3AN/BIC',
      estimatedRisk: 2000,
      legalReference: 'BOI-BIC-CHAMP-60-50-20',
      action: 'Déclarer la valeur en euros au moment de la réception'
    });
  }
  
  // CRYPTO-3: Swap crypto-crypto considered as disposal
  const swaps = input.cryptoTransactions.filter(t => t.type === 'swap');
  if (swaps.length > 0) {
    errors.push({
      id: 'ERR_CRYPTO_SWAP',
      category: 'Crypto-actifs',
      code: 'CRYPTO-3',
      severity: 'info',
      title: 'Conversions crypto → crypto',
      description: `${swaps.length} conversion(s) détectée(s). Attention: seules les cessions vers fiat sont imposables (depuis 2023).`,
      taxBox: '3AN',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 150 VH bis modifié',
      action: 'Vérifier que les swaps crypto-crypto ne sont pas déclarés comme cessions imposables'
    });
  }
  
  // CRYPTO-4: Lending income
  if (input.hasLendingIncome) {
    errors.push({
      id: 'ERR_CRYPTO_LENDING',
      category: 'Crypto-actifs',
      code: 'CRYPTO-4',
      severity: 'warning',
      title: 'Revenus de lending crypto',
      description: 'Les intérêts de lending sont imposables comme revenus mobiliers, pas comme plus-values.',
      taxBox: '2TR/2BH',
      estimatedRisk: 1500,
      legalReference: 'BOI-RPPM-RCM-10-10-80',
      action: 'Déclarer en revenus de capitaux mobiliers (case 2TR)'
    });
  }

  return errors;
}

// ============== FOREIGN ACCOUNTS ERRORS (3916 / 3916-bis) ==============

export function detectForeignAccountErrors(input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  
  // FA-1: Undeclared foreign accounts
  if (input.hasUndeclaredForeignAccounts || input.foreignAccounts.length === 0) {
    const cryptoAccounts = input.foreignAccounts.filter(a => a.type === 'crypto');
    if (cryptoAccounts.length === 0 && input.cryptoTransactions.some(t => ['Binance', 'Kraken', 'Coinbase', 'Bitstamp'].includes(t.platform))) {
      errors.push({
        id: 'ERR_FA_CRYPTO_UNDECLARED',
        category: 'Comptes étrangers',
        code: 'FA-1',
        severity: 'critical',
        title: 'Compte crypto étranger non déclaré',
        description: 'Les comptes sur exchanges étrangers doivent être déclarés via formulaire 3916-bis.',
        taxBox: '3916-bis',
        estimatedRisk: 10000, // Minimum 1500€ per account per year + 80% penalty
        legalReference: 'CGI Art. 1649 AA - Amende 1500€/compte/an',
        action: 'Déclarer tous les comptes d\'actifs numériques détenus à l\'étranger'
      });
    }
  }
  
  // FA-2: Missing foreign bank accounts
  const bankAccounts = input.foreignAccounts.filter(a => a.type === 'bank');
  input.foreignIncomeByCountry.forEach(foreign => {
    const hasAccount = bankAccounts.some(a => a.country === foreign.country);
    if (!hasAccount && foreign.income > 0) {
      errors.push({
        id: `ERR_FA_BANK_${foreign.country}`,
        category: 'Comptes étrangers',
        code: 'FA-2',
        severity: 'critical',
        title: `Compte bancaire ${foreign.country} non déclaré`,
        description: `Vous déclarez des revenus de ${foreign.country} mais aucun compte bancaire de ce pays.`,
        taxBox: '3916',
        estimatedRisk: 1500,
        legalReference: 'CGI Art. 1649 A - Amende 1500€/compte/an',
        action: 'Déclarer le compte bancaire utilisé pour percevoir ces revenus'
      });
    }
  });
  
  // FA-3: Broker accounts
  const brokerAccounts = input.foreignAccounts.filter(a => a.type === 'broker');
  if (brokerAccounts.length === 0 && input.capitalGains.some(g => g.type === 'stock')) {
    errors.push({
      id: 'ERR_FA_BROKER',
      category: 'Comptes étrangers',
      code: 'FA-3',
      severity: 'warning',
      title: 'Compte courtier étranger potentiel',
      description: 'Si vous utilisez un courtier étranger (IBKR, Degiro, etc.), il doit être déclaré.',
      taxBox: '3916',
      estimatedRisk: 1500,
      legalReference: 'CGI Art. 1649 A',
      action: 'Vérifier si votre courtier est basé hors de France'
    });
  }

  return errors;
}

// ============== CAPITAL GAINS ERRORS (2074) ==============

export function detectCapitalGainErrors(input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // CG-1: Carry-forward losses not used
  if (input.carryForwardLosses > 0) {
    const totalGains = input.capitalGains.reduce((sum, g) => sum + Math.max(0, g.salePrice - g.acquisitionPrice - g.fees), 0);
    if (totalGains > 0) {
      const usableLoss = Math.min(input.carryForwardLosses, totalGains);
      errors.push({
        id: 'ERR_CG_LOSSES',
        category: 'Plus-values mobilières',
        code: 'CG-1',
        severity: 'warning',
        title: 'Moins-values reportables à imputer',
        description: `Vous avez ${input.carryForwardLosses}€ de moins-values reportables à imputer sur vos gains de ${totalGains}€.`,
        taxBox: '3VH',
        estimatedRisk: usableLoss * 0.30,
        legalReference: 'CGI Art. 150-0 D',
        action: 'Reporter les moins-values en case 3VH pour les imputer'
      });
    }
  }
  
  // CG-2: Abatement not applied
  const eligibleGains = input.capitalGains.filter(g => g.abatementEligible && g.abatementRate === 0);
  if (eligibleGains.length > 0) {
    const totalMissedAbatement = eligibleGains.reduce((sum, g) => {
      const yearsHeld = Math.floor((g.saleDate.getTime() - g.acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      let rate = 0;
      if (yearsHeld >= 8) rate = 0.65;
      else if (yearsHeld >= 2) rate = 0.50;
      return sum + (g.salePrice - g.acquisitionPrice) * rate;
    }, 0);
    
    if (totalMissedAbatement > 0) {
      errors.push({
        id: 'ERR_CG_ABATEMENT',
        category: 'Plus-values mobilières',
        code: 'CG-2',
        severity: 'info',
        title: 'Abattement pour durée de détention',
        description: `Abattement potentiel de ${Math.round(totalMissedAbatement)}€ si option barème progressif.`,
        taxBox: '3SG/3SH',
        estimatedRisk: totalMissedAbatement * 0.30,
        legalReference: 'CGI Art. 150-0 D ter',
        action: 'Comparer flat tax (30%) vs barème avec abattement'
      });
    }
  }
  
  // CG-3: PEA partial withdrawal issues
  const peaGains = input.capitalGains.filter(g => g.type === 'pea');
  if (peaGains.length > 0) {
    const recentPEA = peaGains.filter(g => {
      const yearsHeld = Math.floor((g.saleDate.getTime() - g.acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return yearsHeld < 5;
    });
    
    if (recentPEA.length > 0) {
      errors.push({
        id: 'ERR_CG_PEA_EARLY',
        category: 'Plus-values mobilières',
        code: 'CG-3',
        severity: 'warning',
        title: 'Retrait PEA avant 5 ans',
        description: 'Les retraits PEA avant 5 ans sont imposables (sauf cas exceptionnels).',
        taxBox: '3VT',
        estimatedRisk: recentPEA.reduce((sum, g) => sum + (g.salePrice - g.acquisitionPrice) * 0.30, 0),
        legalReference: 'CGI Art. 157-5° bis',
        action: 'Vérifier si une exception s\'applique (licenciement, invalidité, création entreprise)'
      });
    }
  }

  return errors;
}

// ============== LMNP/LMP ERRORS (2031) ==============

export function detectRentalErrors(input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // LMNP-1: LMP threshold check
  if (input.lmpThresholdCheck.rentalIncome > 23000 && input.lmpThresholdCheck.rentalIncome > input.lmpThresholdCheck.otherIncome) {
    if (!input.isLMP) {
      errors.push({
        id: 'ERR_LMNP_THRESHOLD',
        category: 'Location meublée',
        code: 'LMNP-1',
        severity: 'critical',
        title: 'Passage obligatoire au statut LMP',
        description: `Vos revenus locatifs (${input.lmpThresholdCheck.rentalIncome}€) dépassent 23000€ ET vos autres revenus. Vous êtes LMP.`,
        taxBox: '5NG',
        estimatedRisk: input.lmpThresholdCheck.rentalIncome * 0.20,
        legalReference: 'CGI Art. 155 IV',
        action: 'Déclarer en tant que LMP (implications sociales et fiscales importantes)'
      });
    }
  }
  
  // LMNP-2: Depreciation errors
  const furnishedProperties = input.rentalProperties.filter(p => p.type === 'furnished' || p.type === 'seasonal');
  if (furnishedProperties.length > 0) {
    const hasDepreciation = furnishedProperties.some(p => p.depreciation > 0);
    if (!hasDepreciation) {
      errors.push({
        id: 'ERR_LMNP_DEPRECIATION',
        category: 'Location meublée',
        code: 'LMNP-2',
        severity: 'info',
        title: 'Amortissements non déclarés',
        description: 'En régime réel LMNP, vous pouvez amortir le bien et le mobilier.',
        taxBox: 'Liasse 2031',
        estimatedRisk: 0,
        legalReference: 'CGI Art. 39 C',
        action: 'Calculer les amortissements (environ 2-3% du bien/an, 10-20% du mobilier/an)'
      });
    }
  }
  
  // LMNP-3: Airbnb specific
  const airbnbProperties = input.rentalProperties.filter(p => p.type === 'airbnb');
  if (airbnbProperties.length > 0) {
    const totalAirbnb = airbnbProperties.reduce((sum, p) => sum + p.grossIncome, 0);
    if (totalAirbnb > 77700) {
      errors.push({
        id: 'ERR_LMNP_AIRBNB_THRESHOLD',
        category: 'Location meublée',
        code: 'LMNP-3',
        severity: 'warning',
        title: 'Dépassement seuil micro-BIC meublé tourisme',
        description: `Vos revenus Airbnb (${totalAirbnb}€) dépassent 77700€. Passage au réel obligatoire.`,
        taxBox: '5NG',
        estimatedRisk: totalAirbnb * 0.10,
        legalReference: 'CGI Art. 50-0',
        action: 'Basculer au régime réel pour l\'année prochaine'
      });
    }
  }
  
  // LMNP-4: Deficit carry-forward
  if (input.totalRentalDeficit > 0 && input.isLMNP && !input.isLMP) {
    errors.push({
      id: 'ERR_LMNP_DEFICIT',
      category: 'Location meublée',
      code: 'LMNP-4',
      severity: 'info',
      title: 'Déficit LMNP reportable',
      description: `Déficit de ${input.totalRentalDeficit}€. En LMNP, il ne s'impute que sur revenus de même nature (10 ans).`,
      taxBox: '5NY',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 156 I-1° bis',
      action: 'Reporter le déficit en case 5NY pour l\'imputer les années suivantes'
    });
  }

  return errors;
}

// ============== BNC ERRORS (2035) ==============

export function detectBNCErrors(input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // BNC-1: Micro-BNC threshold
  if (input.professionType === 'liberal') {
    // These would come from extended input in practice
    errors.push({
      id: 'ERR_BNC_REGIME',
      category: 'Professions libérales',
      code: 'BNC-1',
      severity: 'info',
      title: 'Vérification régime BNC',
      description: `Seuil micro-BNC: ${c.microBNCThreshold}€ (abattement ${c.microBNCAbatement * 100}%). Au-delà: régime réel 2035.`,
      taxBox: '5QC',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 102 ter',
      action: 'Vérifier si le régime réel serait plus avantageux (charges > 34%)'
    });
  }
  
  // BNC-2: VAT considerations
  if (input.hasVAT && input.vatRegime === 'franchise') {
    errors.push({
      id: 'ERR_BNC_VAT',
      category: 'Professions libérales',
      code: 'BNC-2',
      severity: 'warning',
      title: 'Franchise TVA à vérifier',
      description: 'Seuil franchise TVA: 36 800€ (services) ou 91 900€ (ventes). Dépassement = TVA obligatoire.',
      taxBox: 'CA3/CA12',
      estimatedRisk: 2000,
      legalReference: 'CGI Art. 293 B',
      action: 'Vérifier le CA de l\'année N et N-1 pour anticiper l\'assujettissement'
    });
  }

  return errors;
}

// ============== FOREIGN INCOME ERRORS (2047) ==============

export function detectForeignIncomeErrors(input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  
  // FI-1: Tax credit not claimed
  input.foreignIncomeByCountry.forEach(foreign => {
    if (foreign.taxPaid > 0 && input.taxCreditMethod === 'none') {
      errors.push({
        id: `ERR_FI_CREDIT_${foreign.country}`,
        category: 'Revenus étrangers',
        code: 'FI-1',
        severity: 'critical',
        title: `Crédit d'impôt ${foreign.country} non réclamé`,
        description: `Vous avez payé ${foreign.taxPaid}€ d'impôt en ${foreign.country}. Un crédit d'impôt est probablement applicable.`,
        taxBox: '8TK',
        estimatedRisk: foreign.taxPaid,
        legalReference: 'Convention fiscale France-' + foreign.country,
        action: 'Déclarer l\'impôt étranger en case 8TK pour obtenir le crédit'
      });
    }
  });
  
  // FI-2: Double taxation check
  const totalForeignIncome = input.foreignIncomeByCountry.reduce((sum, f) => sum + f.income, 0);
  if (totalForeignIncome > 0 && !input.hasTaxTreaty) {
    errors.push({
      id: 'ERR_FI_TREATY',
      category: 'Revenus étrangers',
      code: 'FI-2',
      severity: 'warning',
      title: 'Convention fiscale à vérifier',
      description: 'Vérifiez si une convention fiscale existe pour éviter la double imposition.',
      taxBox: '2047',
      estimatedRisk: totalForeignIncome * 0.15,
      legalReference: 'Conventions fiscales internationales',
      action: 'Consulter la convention fiscale applicable sur impots.gouv.fr'
    });
  }

  return errors;
}

// ============== MAIN DISPATCHER ==============

export function detectFormSpecificErrors(formType: TaxFormType, input: ExtendedTaxInput): TaxError[] {
  const errors: TaxError[] = [];
  
  switch (formType) {
    case '2086':
      errors.push(...detectCryptoErrors(input));
      break;
    case '3916':
    case '3916-bis':
      errors.push(...detectForeignAccountErrors(input));
      break;
    case '2074':
      errors.push(...detectCapitalGainErrors(input));
      break;
    case '2031':
    case '2044':
      errors.push(...detectRentalErrors(input));
      break;
    case '2035':
    case '2042-C-PRO':
      errors.push(...detectBNCErrors(input));
      break;
    case '2047':
      errors.push(...detectForeignIncomeErrors(input));
      break;
    case '2042':
    case '2042-C':
    case '2042-RICI':
    default:
      // All checks for main forms
      errors.push(...detectCryptoErrors(input));
      errors.push(...detectForeignAccountErrors(input));
      errors.push(...detectCapitalGainErrors(input));
      errors.push(...detectRentalErrors(input));
      errors.push(...detectForeignIncomeErrors(input));
      break;
  }
  
  return errors;
}
