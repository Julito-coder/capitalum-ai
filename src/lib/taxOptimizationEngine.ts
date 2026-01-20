// Tax Optimization Engine for French Tax Declaration 2026

import { TaxScannerInput, TaxOptimization, TAX_CONSTANTS_2026 } from '@/data/taxScannerTypes';

export function detectOptimizations(input: TaxScannerInput): TaxOptimization[] {
  const optimizations: TaxOptimization[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // Calculate approximate marginal tax rate
  const totalIncome = input.salaryDeclared + input.businessRevenue + input.rentalIncome;
  const marginRate = totalIncome > 180294 ? 0.45 : 
                     totalIncome > 83823 ? 0.41 :
                     totalIncome > 29315 ? 0.30 :
                     totalIncome > 11497 ? 0.11 : 0;
  
  // ============== 1. SALARY OPTIMIZATIONS ==============
  
  // Real expenses vs standard deduction
  if (input.salaryDeclared > 0 && input.realExpenses > 0) {
    const standardDeduction = Math.min(
      Math.max(input.salaryDeclared * c.standardDeduction, c.minStandardDeduction),
      c.maxStandardDeduction
    );
    
    if (input.realExpenses > standardDeduction) {
      const savings = (input.realExpenses - standardDeduction) * marginRate;
      optimizations.push({
        id: 'OPT_REAL_EXPENSES',
        category: 'Revenus salariés',
        type: 'deduction',
        title: 'Opter pour les frais réels',
        description: 'Vos frais réels sont supérieurs à l\'abattement forfaitaire de 10%.',
        currentValue: standardDeduction,
        optimizedValue: input.realExpenses,
        estimatedSavings: Math.round(savings),
        effort: 'Classer et numériser les justificatifs (30 min)',
        deadline: '31 mai 2027',
        taxBox: '1AK',
        legalReference: 'CGI Art. 83-3°',
        conditions: ['Justificatifs à conserver 3 ans', 'Frais liés à l\'emploi']
      });
    }
  }
  
  // Journalist/sales rep deductions
  if (input.isJournalist && input.salaryDeclared > 0) {
    const savings = c.journalistDeduction * marginRate;
    optimizations.push({
      id: 'OPT_JOURNALIST',
      category: 'Revenus salariés',
      type: 'deduction',
      title: 'Abattement journaliste',
      description: `Déduction spécifique de ${c.journalistDeduction}€ pour les journalistes.`,
      currentValue: 0,
      optimizedValue: c.journalistDeduction,
      estimatedSavings: Math.round(savings),
      effort: 'Vérifier carte de presse (5 min)',
      taxBox: '1AJ',
      legalReference: 'CGI Art. 81'
    });
  }
  
  // ============== 2. RENTAL OPTIMIZATIONS ==============
  
  // Micro-foncier vs réel
  if (input.rentalIncome > 0 && input.rentalIncome <= c.microFoncierThreshold) {
    const microDeduction = input.rentalIncome * c.microFoncierAbatement;
    const realDeduction = input.rentalExpenses + input.rentalWorks;
    
    if (realDeduction > microDeduction) {
      const savings = (realDeduction - microDeduction) * marginRate;
      optimizations.push({
        id: 'OPT_RENTAL_REAL',
        category: 'Revenus fonciers',
        type: 'deduction',
        title: 'Régime réel plus avantageux',
        description: 'Vos charges foncières dépassent l\'abattement micro-foncier de 30%.',
        currentValue: microDeduction,
        optimizedValue: realDeduction,
        estimatedSavings: Math.round(savings),
        effort: 'Déclaration 2044 à remplir (1h)',
        deadline: '31 mai 2027',
        taxBox: '4BA',
        legalReference: 'CGI Art. 32',
        conditions: ['Engagement 3 ans', 'Justificatifs travaux']
      });
    } else {
      const savings = (microDeduction - realDeduction) * marginRate;
      optimizations.push({
        id: 'OPT_RENTAL_MICRO',
        category: 'Revenus fonciers',
        type: 'deduction',
        title: 'Micro-foncier avantageux',
        description: 'Le régime micro-foncier avec abattement 30% est plus favorable.',
        currentValue: realDeduction,
        optimizedValue: microDeduction,
        estimatedSavings: Math.round(savings),
        effort: 'Déclaration simplifiée (5 min)',
        taxBox: '4BE',
        legalReference: 'CGI Art. 32'
      });
    }
  }
  
  // Furnished rental BIC
  if (input.rentalFurnished && input.rentalIncome > 0) {
    const microBICDeduction = input.rentalIncome * 0.50;
    const currentDeduction = input.rentalExpenses;
    
    if (microBICDeduction > currentDeduction) {
      const savings = (microBICDeduction - currentDeduction) * marginRate;
      optimizations.push({
        id: 'OPT_LMNP',
        category: 'Revenus fonciers',
        type: 'deduction',
        title: 'Statut LMNP à considérer',
        description: 'Location meublée : abattement 50% en micro-BIC ou amortissements en réel.',
        currentValue: currentDeduction,
        optimizedValue: microBICDeduction,
        estimatedSavings: Math.round(savings),
        effort: 'Étude fiscale recommandée (2h)',
        taxBox: '5NG',
        legalReference: 'CGI Art. 50-0',
        conditions: ['Meublé de tourisme ou résidence principale', 'Déclaration début activité']
      });
    }
  }
  
  // ============== 3. FINANCIAL OPTIMIZATIONS ==============
  
  // Flat tax vs progressive for dividends
  if (input.dividends > 0 && marginRate < 0.30) {
    const flatTaxAmount = input.dividends * c.flatTaxRate;
    const progressiveBase = input.dividends * 0.60; // 40% abatement
    const progressiveAmount = progressiveBase * marginRate + (input.dividends * c.flatTaxSocialPart);
    
    if (progressiveAmount < flatTaxAmount) {
      const savings = flatTaxAmount - progressiveAmount;
      optimizations.push({
        id: 'OPT_DIVIDENDS_PROGRESSIVE',
        category: 'Revenus financiers',
        type: 'savings',
        title: 'Opter pour le barème progressif',
        description: 'Votre TMI étant inférieur à 30%, le barème progressif est plus avantageux.',
        currentValue: flatTaxAmount,
        optimizedValue: progressiveAmount,
        estimatedSavings: Math.round(savings),
        effort: 'Cocher case 2OP (2 min)',
        taxBox: '2OP',
        legalReference: 'CGI Art. 200 A',
        conditions: ['S\'applique à tous les revenus mobiliers', 'Abattement 40% sur dividendes']
      });
    }
  }
  
  // ============== 4. PER OPTIMIZATION ==============
  
  // PER contribution recommendation
  const isCoupled = input.familyStatus === 'married' || input.familyStatus === 'pacs';
  const maxPER = isCoupled ? c.maxPERDeductionCouple : c.maxPERDeduction;
  const perAvailable = Math.min(input.perAvailable || maxPER, maxPER - input.perContributions);
  
  if (perAvailable > 0 && marginRate >= 0.30) {
    const optimalPER = Math.min(perAvailable, totalIncome * 0.10);
    const savings = optimalPER * marginRate;
    
    optimizations.push({
      id: 'OPT_PER',
      category: 'Épargne retraite',
      type: 'deduction',
      title: 'Versement PER recommandé',
      description: `Vous pouvez encore verser ${Math.round(perAvailable)}€ déductibles sur votre PER.`,
      currentValue: input.perContributions,
      optimizedValue: input.perContributions + optimalPER,
      estimatedSavings: Math.round(savings),
      effort: 'Virement bancaire (5 min)',
      deadline: '31 décembre 2026',
      taxBox: '6NS/6NT',
      legalReference: 'CGI Art. 163 quatervicies',
      conditions: ['Fonds bloqués jusqu\'à retraite', 'Exceptions déblocage anticipé']
    });
  }
  
  // ============== 5. TAX CREDITS ==============
  
  // Childcare credit
  if (input.childrenAges.some(age => age < 6) && input.childcareExpenses === 0) {
    const potentialCredit = c.maxChildcarePerChild * c.childcareCredit;
    optimizations.push({
      id: 'OPT_CHILDCARE',
      category: 'Crédits d\'impôt',
      type: 'credit',
      title: 'Crédit garde d\'enfants',
      description: `Crédit de 50% des frais de garde, jusqu'à ${c.maxChildcarePerChild}€/enfant.`,
      currentValue: 0,
      optimizedValue: potentialCredit,
      estimatedSavings: Math.round(potentialCredit),
      effort: 'Conserver attestations (10 min)',
      taxBox: '7GA/7GB',
      legalReference: 'CGI Art. 200 quater B',
      conditions: ['Enfant de moins de 6 ans', 'Mode de garde agréé']
    });
  }
  
  // Home employee credit
  if (input.homeEmployeeExpenses > 0) {
    const credit = Math.min(input.homeEmployeeExpenses, c.maxHomeEmployeeCredit) * c.homeEmployeeCredit;
    optimizations.push({
      id: 'OPT_HOME_EMPLOYEE',
      category: 'Crédits d\'impôt',
      type: 'credit',
      title: 'Crédit emploi à domicile',
      description: `Crédit de 50% des dépenses, plafonné à ${c.maxHomeEmployeeCredit}€/an.`,
      currentValue: 0,
      optimizedValue: credit,
      estimatedSavings: Math.round(credit),
      effort: 'Déclaration CESU/Pajemploi automatique',
      taxBox: '7DB/7DF',
      legalReference: 'CGI Art. 199 sexdecies'
    });
  }
  
  // Donation optimization
  if (input.donations > 0 || input.donationsAssociations > 0) {
    const totalDonations = input.donations + input.donationsAssociations;
    const credit75 = Math.min(input.donationsAssociations, c.donationReduction75Max) * c.donationReduction75;
    const remaining = totalDonations - Math.min(input.donationsAssociations, c.donationReduction75Max);
    const credit66 = remaining * c.donationReduction66;
    const totalCredit = credit75 + credit66;
    
    optimizations.push({
      id: 'OPT_DONATIONS',
      category: 'Crédits d\'impôt',
      type: 'credit',
      title: 'Réduction dons optimisée',
      description: `75% jusqu'à ${c.donationReduction75Max}€ (aide urgente), puis 66% au-delà.`,
      currentValue: 0,
      optimizedValue: totalCredit,
      estimatedSavings: Math.round(totalCredit),
      effort: 'Conserver reçus fiscaux',
      taxBox: '7UD/7UF',
      legalReference: 'CGI Art. 200'
    });
  }
  
  // Schooling credit
  const schoolingCredits = 
    input.schoolingExpenses.college * c.schoolingCreditCollege +
    input.schoolingExpenses.lycee * c.schoolingCreditLycee +
    input.schoolingExpenses.university * c.schoolingCreditUniversity;
  
  if (schoolingCredits === 0 && input.childrenStudents.length > 0) {
    const potentialCredit = input.childrenStudents.reduce((sum, age) => {
      if (age >= 11 && age <= 14) return sum + c.schoolingCreditCollege;
      if (age >= 15 && age <= 17) return sum + c.schoolingCreditLycee;
      if (age >= 18) return sum + c.schoolingCreditUniversity;
      return sum;
    }, 0);
    
    if (potentialCredit > 0) {
      optimizations.push({
        id: 'OPT_SCHOOLING',
        category: 'Crédits d\'impôt',
        type: 'credit',
        title: 'Réduction frais scolarité',
        description: `${c.schoolingCreditCollege}€/collégien, ${c.schoolingCreditLycee}€/lycéen, ${c.schoolingCreditUniversity}€/étudiant.`,
        currentValue: 0,
        optimizedValue: potentialCredit,
        estimatedSavings: potentialCredit,
        effort: 'Renseigner les cases (2 min)',
        taxBox: '7EA/7EC/7EF',
        legalReference: 'CGI Art. 199 quater F'
      });
    }
  }
  
  // ============== 6. INVESTMENT REDUCTIONS ==============
  
  // FIP/FCPI
  if (input.fipFcpiInvestment > 0) {
    const reduction = Math.min(input.fipFcpiInvestment, c.maxFipFcpi) * c.fipFcpiReduction;
    optimizations.push({
      id: 'OPT_FIP_FCPI',
      category: 'Investissements',
      type: 'deduction',
      title: 'Réduction FIP/FCPI',
      description: `Réduction de ${c.fipFcpiReduction * 100}% de l'investissement, max ${c.maxFipFcpi}€.`,
      currentValue: 0,
      optimizedValue: reduction,
      estimatedSavings: Math.round(reduction),
      effort: 'Investissement déjà réalisé',
      taxBox: '7GQ/7GR',
      legalReference: 'CGI Art. 199 terdecies-0 A',
      conditions: ['Conservation 5 ans minimum', 'PME éligibles']
    });
  }
  
  // PME investment
  if (input.pmeInvestment > 0) {
    const reduction = Math.min(input.pmeInvestment, c.maxPME) * c.pmeReduction;
    optimizations.push({
      id: 'OPT_PME',
      category: 'Investissements',
      type: 'deduction',
      title: 'Réduction capital PME',
      description: `Réduction de ${c.pmeReduction * 100}% des souscriptions au capital de PME.`,
      currentValue: 0,
      optimizedValue: reduction,
      estimatedSavings: Math.round(reduction),
      effort: 'Attestation de la PME',
      taxBox: '7CF',
      legalReference: 'CGI Art. 199 terdecies-0 A',
      conditions: ['Société non cotée', 'Conservation 5 ans']
    });
  }
  
  // ESUS investment
  if (input.esusInvestment > 0) {
    const reduction = Math.min(input.esusInvestment, c.maxESUS) * c.esusReduction;
    optimizations.push({
      id: 'OPT_ESUS',
      category: 'Investissements',
      type: 'deduction',
      title: 'Réduction ESUS solidaire',
      description: `Réduction de ${c.esusReduction * 100}% pour entreprises solidaires.`,
      currentValue: 0,
      optimizedValue: reduction,
      estimatedSavings: Math.round(reduction),
      effort: 'Attestation ESUS',
      taxBox: '7GW',
      legalReference: 'CGI Art. 199 terdecies-0 AA'
    });
  }
  
  // ============== 7. SPECIAL SITUATIONS ==============
  
  // Elderly parent care
  if (input.caresForElderlyParent && input.elderlyParentExpenses > 0) {
    const deduction = Math.min(input.elderlyParentExpenses, c.alimonyFlatRate);
    const savings = deduction * marginRate;
    optimizations.push({
      id: 'OPT_ELDERLY_PARENT',
      category: 'Situations particulières',
      type: 'deduction',
      title: 'Déduction accueil parent',
      description: `Déduction forfaitaire de ${c.alimonyFlatRate}€ pour hébergement d'un parent.`,
      currentValue: 0,
      optimizedValue: deduction,
      estimatedSavings: Math.round(savings),
      effort: 'Attestation hébergement',
      taxBox: '6EU',
      legalReference: 'CGI Art. 156-II-2°',
      conditions: ['Parent de plus de 75 ans ou invalide', 'Ressources insuffisantes']
    });
  }
  
  // Disability half-share
  if (input.hasDisability) {
    optimizations.push({
      id: 'OPT_DISABILITY',
      category: 'Situations particulières',
      type: 'exoneration',
      title: 'Demi-part invalidité',
      description: 'Demi-part supplémentaire pour invalidité (carte d\'invalidité 80%+).',
      currentValue: 0,
      optimizedValue: c.halfShareCap,
      estimatedSavings: c.halfShareCap,
      effort: 'Joindre justificatif (5 min)',
      taxBox: 'P/F',
      legalReference: 'CGI Art. 195',
      conditions: ['Carte d\'invalidité ou CMI', 'Taux d\'incapacité ≥ 80%']
    });
  }
  
  // Sort by estimated savings descending
  return optimizations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}

// Calculate overall tax score (0-100)
export function calculateTaxScore(errorsCount: number, criticalErrors: number, optimizationsApplied: number, totalOptimizations: number): number {
  let score = 100;
  
  // Deduct for errors
  score -= criticalErrors * 15;
  score -= (errorsCount - criticalErrors) * 5;
  
  // Bonus for applied optimizations
  if (totalOptimizations > 0) {
    const optimizationRate = optimizationsApplied / totalOptimizations;
    score -= (1 - optimizationRate) * 20;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
