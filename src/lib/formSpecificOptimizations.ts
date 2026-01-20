// Form-Specific Optimization Detection for French Tax Forms

import { TaxOptimization, TAX_CONSTANTS_2026 } from '@/data/taxScannerTypes';
import { TaxFormType, ExtendedTaxInput } from '@/data/taxFormTypes';

// ============== CRYPTO OPTIMIZATIONS (2086) ==============

export function detectCryptoOptimizations(input: ExtendedTaxInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  
  // Harvest losses
  const totalLosses = input.cryptoTransactions
    .filter(t => t.type === 'sell' && t.fiatValueOut < t.fiatValueIn)
    .reduce((sum, t) => sum + (t.fiatValueIn - t.fiatValueOut), 0);
  
  if (totalLosses > 0) {
    optimizations.push({
      id: 'OPT_CRYPTO_HARVEST',
      category: 'Crypto-actifs',
      type: 'deduction',
      title: 'Réaliser les moins-values latentes',
      description: 'Vendre et racheter vos positions en perte pour créer des moins-values déductibles.',
      currentValue: 0,
      optimizedValue: totalLosses,
      estimatedSavings: Math.round(totalLosses * 0.30),
      effort: 'Vendre puis racheter (30 min)',
      taxBox: '3AN',
      legalReference: 'CGI Art. 150 VH bis',
      conditions: ['Attention aux frais de transaction', 'Pas de règle de "wash sale" en France']
    });
  }
  
  // DCA to optimize FIFO
  if (input.totalCryptoPortfolioValue > 10000) {
    optimizations.push({
      id: 'OPT_CRYPTO_DCA',
      category: 'Crypto-actifs',
      type: 'savings',
      title: 'Optimiser le prix d\'acquisition moyen',
      description: 'Continuer les achats réguliers pour lisser votre prix d\'entrée global (FIFO).',
      currentValue: input.totalCryptoAcquisitionValue,
      optimizedValue: input.totalCryptoAcquisitionValue,
      estimatedSavings: 0,
      effort: 'Mise en place DCA (15 min)',
      taxBox: '3AN',
      legalReference: 'CGI Art. 150 VH bis'
    });
  }

  return optimizations;
}

// ============== CAPITAL GAINS OPTIMIZATIONS (2074) ==============

export function detectCapitalGainOptimizations(input: ExtendedTaxInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // Flat tax vs progressive comparison
  const totalGains = input.capitalGains.reduce((sum, g) => sum + Math.max(0, g.salePrice - g.acquisitionPrice - g.fees), 0);
  
  if (totalGains > 0 && !input.hasOptedProgressiveTax) {
    // Calculate with abatement for long-term holdings
    const eligibleForAbatement = input.capitalGains.filter(g => {
      const years = Math.floor((g.saleDate.getTime() - g.acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return years >= 2;
    });
    
    if (eligibleForAbatement.length > 0) {
      const totalAbatement = eligibleForAbatement.reduce((sum, g) => {
        const years = Math.floor((g.saleDate.getTime() - g.acquisitionDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const rate = years >= 8 ? 0.65 : 0.50;
        return sum + (g.salePrice - g.acquisitionPrice) * rate;
      }, 0);
      
      const flatTax = totalGains * 0.30;
      const progressiveTax = (totalGains - totalAbatement) * 0.30; // Simplified
      
      if (progressiveTax < flatTax) {
        optimizations.push({
          id: 'OPT_CG_PROGRESSIVE',
          category: 'Plus-values mobilières',
          type: 'savings',
          title: 'Option barème progressif avantageuse',
          description: `Avec l'abattement durée (${Math.round(totalAbatement)}€), le barème progressif peut être plus favorable.`,
          currentValue: flatTax,
          optimizedValue: progressiveTax,
          estimatedSavings: Math.round(flatTax - progressiveTax),
          effort: 'Cocher case 2OP (2 min)',
          deadline: '31 mai 2027',
          taxBox: '2OP',
          legalReference: 'CGI Art. 200 A'
        });
      }
    }
  }
  
  // PEA optimization
  if (input.capitalGains.some(g => g.type === 'stock')) {
    optimizations.push({
      id: 'OPT_CG_PEA',
      category: 'Plus-values mobilières',
      type: 'exoneration',
      title: 'Privilégier le PEA pour actions européennes',
      description: 'Les plus-values PEA sont exonérées après 5 ans (hors prélèvements sociaux).',
      currentValue: 0,
      optimizedValue: 0,
      estimatedSavings: 0,
      effort: 'Ouvrir/utiliser un PEA',
      taxBox: 'N/A',
      legalReference: 'CGI Art. 157-5° bis',
      conditions: ['Actions UE uniquement', 'Plafond 150 000€ de versements', 'Pas de retrait avant 5 ans']
    });
  }

  return optimizations;
}

// ============== RENTAL OPTIMIZATIONS (2031 / 2044) ==============

export function detectRentalOptimizations(input: ExtendedTaxInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // LMNP vs location nue
  const nudeRentals = input.rentalProperties.filter(p => p.type === 'nude');
  if (nudeRentals.length > 0) {
    const totalNudeIncome = nudeRentals.reduce((sum, p) => sum + p.grossIncome, 0);
    const nudeTax = totalNudeIncome * 0.70 * 0.30; // 30% abatement, 30% marginal
    const lmnpTax = totalNudeIncome * 0.50 * 0.30; // 50% abatement
    
    if (lmnpTax < nudeTax) {
      optimizations.push({
        id: 'OPT_RENTAL_LMNP',
        category: 'Immobilier locatif',
        type: 'savings',
        title: 'Passer en location meublée (LMNP)',
        description: 'L\'abattement passe de 30% (nu) à 50% (meublé micro-BIC), ou amortissements en réel.',
        currentValue: nudeTax,
        optimizedValue: lmnpTax,
        estimatedSavings: Math.round(nudeTax - lmnpTax),
        effort: 'Meubler le bien + déclaration P0i (2h)',
        taxBox: '5NG',
        legalReference: 'CGI Art. 50-0',
        conditions: ['Mobilier suffisant obligatoire', 'Inscription au greffe', 'CFE à payer']
      });
    }
  }
  
  // Amortissement optimization in real regime
  const furnishedRentals = input.rentalProperties.filter(p => p.regime === 'lmnp_real' || p.regime === 'lmp');
  if (furnishedRentals.length > 0) {
    const withoutDepreciation = furnishedRentals.filter(p => p.depreciation === 0);
    if (withoutDepreciation.length > 0) {
      // Estimate depreciation (2.5% of building value)
      const estimatedDepreciation = withoutDepreciation.reduce((sum, p) => sum + p.grossIncome * 0.8, 0); // rough estimate
      
      optimizations.push({
        id: 'OPT_RENTAL_DEPRECIATION',
        category: 'Immobilier locatif',
        type: 'deduction',
        title: 'Calculer les amortissements LMNP',
        description: 'En régime réel, vous pouvez amortir le bien (2-3%/an) et le mobilier (10-20%/an).',
        currentValue: 0,
        optimizedValue: estimatedDepreciation,
        estimatedSavings: Math.round(estimatedDepreciation * 0.30),
        effort: 'Faire appel à un comptable LMNP (200€/an)',
        taxBox: 'Liasse 2031',
        legalReference: 'CGI Art. 39 C',
        conditions: ['Tenir une comptabilité', 'Conserver factures mobilier']
      });
    }
  }
  
  // Deficit foncier strategy
  if (input.totalRentalDeficit > 0 || input.carryForwardRentalDeficit > 0) {
    optimizations.push({
      id: 'OPT_RENTAL_DEFICIT',
      category: 'Immobilier locatif',
      type: 'deduction',
      title: 'Stratégie déficit foncier',
      description: `Max ${c.maxRentalDeficit}€/an déductible du revenu global. Excédent reportable 10 ans.`,
      currentValue: 0,
      optimizedValue: Math.min(input.totalRentalDeficit, c.maxRentalDeficit),
      estimatedSavings: Math.round(Math.min(input.totalRentalDeficit, c.maxRentalDeficit) * 0.30),
      effort: 'Planifier les travaux stratégiquement',
      taxBox: '4BC',
      legalReference: 'CGI Art. 156 I-3°',
      conditions: ['Location nue uniquement', 'Maintenir location 3 ans après imputation']
    });
  }

  return optimizations;
}

// ============== BNC/BIC OPTIMIZATIONS (2035 / 2031) ==============

export function detectProfessionalOptimizations(input: ExtendedTaxInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // CGA/AGA adhesion
  if (input.professionType !== 'none' && !input.hasAccountant) {
    optimizations.push({
      id: 'OPT_PRO_CGA',
      category: 'Revenus professionnels',
      type: 'deduction',
      title: 'Adhérer à un CGA/AGA',
      description: 'Évitez la majoration de 15% du bénéfice et bénéficiez d\'une réduction d\'impôt.',
      currentValue: 0,
      optimizedValue: 915,
      estimatedSavings: 915,
      effort: 'Adhésion en ligne (30 min)',
      deadline: '31 mai N+1',
      taxBox: '7FF',
      legalReference: 'CGI Art. 158-7-1°',
      conditions: ['Cotisation ~150-200€/an', 'Régime réel uniquement']
    });
  }
  
  // PER for self-employed
  if (input.professionType !== 'none') {
    const maxMadelin = 76000; // Approximate max for self-employed
    optimizations.push({
      id: 'OPT_PRO_PER',
      category: 'Revenus professionnels',
      type: 'deduction',
      title: 'Versements PER déductibles',
      description: 'Les indépendants ont un plafond PER majoré (10% du bénéfice + 15% de la fraction > PASS).',
      currentValue: 0,
      optimizedValue: maxMadelin,
      estimatedSavings: Math.round(maxMadelin * 0.41),
      effort: 'Ouvrir un PER individuel (1h)',
      deadline: '31 décembre 2026',
      taxBox: '6NS',
      legalReference: 'CGI Art. 163 quatervicies',
      conditions: ['Fonds bloqués jusqu\'à retraite', 'Fiscalité à la sortie']
    });
  }

  return optimizations;
}

// ============== FOREIGN INCOME OPTIMIZATIONS (2047) ==============

export function detectForeignIncomeOptimizations(input: ExtendedTaxInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  
  // Tax credit optimization
  const totalForeignTax = input.foreignIncomeByCountry.reduce((sum, f) => sum + f.taxPaid, 0);
  if (totalForeignTax > 0) {
    optimizations.push({
      id: 'OPT_FI_CREDIT',
      category: 'Revenus étrangers',
      type: 'credit',
      title: 'Optimiser le crédit d\'impôt étranger',
      description: `Vous avez payé ${totalForeignTax}€ d'impôt à l'étranger. Récupérez-le en crédit d'impôt.`,
      currentValue: 0,
      optimizedValue: totalForeignTax,
      estimatedSavings: totalForeignTax,
      effort: 'Déclarer en case 8TK (5 min)',
      taxBox: '8TK',
      legalReference: 'Conventions fiscales internationales'
    });
  }
  
  // Treaty benefits
  if (!input.hasTaxTreaty && input.foreignIncomeByCountry.length > 0) {
    optimizations.push({
      id: 'OPT_FI_TREATY',
      category: 'Revenus étrangers',
      type: 'exoneration',
      title: 'Vérifier les conventions fiscales',
      description: 'La France a signé 120+ conventions. Certains revenus peuvent être exonérés.',
      currentValue: 0,
      optimizedValue: 0,
      estimatedSavings: 0,
      effort: 'Consulter impots.gouv.fr (30 min)',
      taxBox: '2047',
      legalReference: 'Conventions fiscales bilatérales'
    });
  }

  return optimizations;
}

// ============== MAIN DISPATCHER ==============

export function detectFormSpecificOptimizations(formType: TaxFormType, input: ExtendedTaxInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  
  switch (formType) {
    case '2086':
      optimizations.push(...detectCryptoOptimizations(input));
      break;
    case '2074':
      optimizations.push(...detectCapitalGainOptimizations(input));
      break;
    case '2031':
    case '2044':
      optimizations.push(...detectRentalOptimizations(input));
      break;
    case '2035':
    case '2042-C-PRO':
    case '2065':
      optimizations.push(...detectProfessionalOptimizations(input));
      break;
    case '2047':
      optimizations.push(...detectForeignIncomeOptimizations(input));
      break;
    case '2042':
    case '2042-C':
    case '2042-RICI':
    default:
      // All optimizations for main forms
      optimizations.push(...detectCryptoOptimizations(input));
      optimizations.push(...detectCapitalGainOptimizations(input));
      optimizations.push(...detectRentalOptimizations(input));
      optimizations.push(...detectProfessionalOptimizations(input));
      optimizations.push(...detectForeignIncomeOptimizations(input));
      break;
  }
  
  // Sort by estimated savings
  return optimizations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}
