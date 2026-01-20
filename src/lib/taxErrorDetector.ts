// Tax Error Detection Engine for French Tax Declaration 2026

import { TaxScannerInput, TaxError, TAX_CONSTANTS_2026 } from '@/data/taxScannerTypes';

export function detectTaxErrors(input: TaxScannerInput): TaxError[] {
  const errors: TaxError[] = [];
  const c = TAX_CONSTANTS_2026;
  
  // ============== A. SALARY ERRORS ==============
  
  // A1: Declared salary vs net salary mismatch
  if (input.salaryDeclared > 0 && input.salaryNet > 0) {
    const diff = Math.abs(input.salaryDeclared - input.salaryNet);
    const tolerance = input.salaryNet * 0.05;
    if (diff > tolerance) {
      errors.push({
        id: 'ERR_SALARY_MISMATCH',
        category: 'Revenus salariés',
        code: 'A1',
        severity: 'warning',
        title: 'Écart revenu imposable / net perçu',
        description: `Différence de ${Math.round(diff)}€ entre le montant déclaré et le net perçu. Vérifiez votre bulletin de paie.`,
        taxBox: '1AJ/1BJ',
        estimatedRisk: diff * 0.30,
        legalReference: 'CGI Art. 79',
        action: 'Comparer avec le cumul net imposable du bulletin de décembre'
      });
    }
  }
  
  // A2: Journalist deduction forgotten
  if (input.isJournalist && input.salaryDeclared > 0) {
    errors.push({
      id: 'ERR_JOURNALIST_DEDUCTION',
      category: 'Revenus salariés',
      code: 'A2',
      severity: 'info',
      title: 'Abattement journaliste disponible',
      description: `En tant que journaliste, vous pouvez déduire ${c.journalistDeduction}€ de votre revenu.`,
      taxBox: '1AJ',
      estimatedRisk: c.journalistDeduction * 0.30,
      legalReference: 'CGI Art. 81',
      action: 'Appliquer l\'abattement spécifique journalistes'
    });
  }
  
  // A3: Real expenses vs standard deduction
  if (input.realExpenses > 0 && input.salaryDeclared > 0) {
    const standardDeduction = Math.min(
      Math.max(input.salaryDeclared * c.standardDeduction, c.minStandardDeduction),
      c.maxStandardDeduction
    );
    if (input.realExpenses > standardDeduction) {
      errors.push({
        id: 'ERR_REAL_EXPENSES_BETTER',
        category: 'Revenus salariés',
        code: 'A3',
        severity: 'info',
        title: 'Frais réels plus avantageux',
        description: `Vos frais réels (${input.realExpenses}€) dépassent l'abattement forfaitaire (${Math.round(standardDeduction)}€).`,
        taxBox: '1AK',
        estimatedRisk: (input.realExpenses - standardDeduction) * 0.30,
        legalReference: 'CGI Art. 83',
        action: 'Opter pour les frais réels et conserver les justificatifs'
      });
    }
  }
  
  // A4: Real expenses > 50% of income (red flag)
  if (input.realExpenses > input.salaryDeclared * 0.5 && input.salaryDeclared > 0) {
    errors.push({
      id: 'ERR_EXCESSIVE_EXPENSES',
      category: 'Revenus salariés',
      code: 'A4',
      severity: 'critical',
      title: 'Frais réels excessifs',
      description: `Vos frais réels représentent plus de 50% de votre revenu. Risque élevé de contrôle fiscal.`,
      taxBox: '1AK',
      estimatedRisk: input.realExpenses * 0.3,
      legalReference: 'CGI Art. 83 - LPF Art. L10',
      action: 'Préparer tous les justificatifs ou reconsidérer le montant déclaré'
    });
  }
  
  // A5: Severance not properly classified
  if (input.severanceIndemnity > 0) {
    errors.push({
      id: 'ERR_SEVERANCE_CHECK',
      category: 'Revenus salariés',
      code: 'A5',
      severity: 'warning',
      title: 'Indemnité de rupture à vérifier',
      description: `L'indemnité de ${input.severanceIndemnity}€ peut être partiellement exonérée selon les conditions de départ.`,
      taxBox: '1AJ/1AP',
      estimatedRisk: input.severanceIndemnity * 0.15,
      legalReference: 'CGI Art. 80 duodecies',
      action: 'Distinguer part exonérée (indemnité légale) et part imposable'
    });
  }
  
  // ============== B. RENTAL INCOME ERRORS ==============
  
  // B1: Airbnb not declared
  if (input.hasAirbnb && input.airbnbIncome === 0) {
    errors.push({
      id: 'ERR_AIRBNB_UNDECLARED',
      category: 'Revenus fonciers',
      code: 'B1',
      severity: 'critical',
      title: 'Revenus Airbnb non déclarés',
      description: 'Les revenus de location touristique doivent être déclarés, même occasionnels.',
      taxBox: '5NG/5ND',
      estimatedRisk: 5000,
      legalReference: 'CGI Art. 35 bis',
      action: 'Déclarer les revenus en BIC (micro ou réel)'
    });
  }
  
  // B2: Rental deficit exceeds limit
  const rentalDeficit = input.rentalExpenses + input.rentalWorks - input.rentalIncome;
  if (rentalDeficit > c.maxRentalDeficit) {
    errors.push({
      id: 'ERR_RENTAL_DEFICIT_LIMIT',
      category: 'Revenus fonciers',
      code: 'B2',
      severity: 'warning',
      title: 'Déficit foncier dépassant le plafond',
      description: `Votre déficit (${Math.round(rentalDeficit)}€) dépasse le maximum déductible (${c.maxRentalDeficit}€/an).`,
      taxBox: '4BC',
      estimatedRisk: (rentalDeficit - c.maxRentalDeficit) * 0.30,
      legalReference: 'CGI Art. 156-I-3°',
      action: 'Reporter l\'excédent sur les années suivantes (10 ans max)'
    });
  }
  
  // B3: Furnished rental wrongly categorized
  if (input.rentalFurnished && input.rentalIncome > 0 && !input.hasAirbnb) {
    errors.push({
      id: 'ERR_FURNISHED_CATEGORY',
      category: 'Revenus fonciers',
      code: 'B3',
      severity: 'info',
      title: 'Location meublée : vérifier régime',
      description: 'La location meublée relève des BIC, pas des revenus fonciers.',
      taxBox: '5NG/5NK',
      estimatedRisk: input.rentalIncome * 0.10,
      legalReference: 'CGI Art. 35 bis',
      action: 'Déclarer en micro-BIC (50% d\'abattement) ou réel BIC'
    });
  }
  
  // ============== C. FINANCIAL INCOME ERRORS ==============
  
  // C1: Flat tax incorrectly applied
  if (input.dividends > 0) {
    errors.push({
      id: 'ERR_FLAT_TAX_CHECK',
      category: 'Revenus financiers',
      code: 'C1',
      severity: 'info',
      title: 'Flat tax vs barème progressif',
      description: `Pour ${input.dividends}€ de dividendes, comparer flat tax (30%) et barème progressif avec abattement 40%.`,
      taxBox: '2DC/2CK',
      estimatedRisk: input.dividends * 0.05,
      legalReference: 'CGI Art. 158-3-2°',
      action: 'Simuler les deux options pour choisir la plus avantageuse'
    });
  }
  
  // C2: Crypto gains not declared
  if (input.cryptoGains > 0) {
    errors.push({
      id: 'ERR_CRYPTO_DECLARED',
      category: 'Revenus financiers',
      code: 'C2',
      severity: 'warning',
      title: 'Plus-values crypto déclarées',
      description: `Assurez-vous que les ${input.cryptoGains}€ de gains crypto sont correctement déclarés.`,
      taxBox: '3AN/3BN',
      estimatedRisk: input.cryptoGains * 0.30,
      legalReference: 'CGI Art. 150 VH bis',
      action: 'Déclarer via formulaire 2086 et case 3AN'
    });
  }
  
  // C3: Livret A interests declared (should be exempt)
  if (input.livretAInterests > c.livretAMaxInterest) {
    errors.push({
      id: 'ERR_LIVRET_A_EXCESS',
      category: 'Revenus financiers',
      code: 'C3',
      severity: 'warning',
      title: 'Intérêts Livret A suspects',
      description: `Les intérêts Livret A (${input.livretAInterests}€) semblent élevés. Vérifiez le montant.`,
      taxBox: 'Non déclarable',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 157-7°',
      action: 'Les intérêts Livret A sont exonérés - ne pas les déclarer'
    });
  }
  
  // ============== D. DEDUCTION ERRORS ==============
  
  // D1: Alimony inversion check
  if (input.alimonyPaid > 0 && input.alimonyReceived > 0) {
    errors.push({
      id: 'ERR_ALIMONY_INVERSION',
      category: 'Charges déductibles',
      code: 'D1',
      severity: 'warning',
      title: 'Pension alimentaire : double déclaration',
      description: 'Vous déclarez à la fois verser ET recevoir une pension. Vérifiez la cohérence.',
      taxBox: '6GU/1AO',
      estimatedRisk: Math.min(input.alimonyPaid, input.alimonyReceived) * 0.30,
      legalReference: 'CGI Art. 156-II-2°',
      action: 'La pension versée se déduit, celle reçue s\'ajoute au revenu'
    });
  }
  
  // D2: Alimony for adult child conditions
  if (input.alimonyPaid > 0 && input.childrenCount > 0) {
    const hasAdultChild = input.childrenAges.some(age => age >= 18);
    if (hasAdultChild) {
      errors.push({
        id: 'ERR_ALIMONY_ADULT_CHILD',
        category: 'Charges déductibles',
        code: 'D2',
        severity: 'info',
        title: 'Pension enfant majeur',
        description: `Plafond de ${c.maxAlimonyPerChild}€/an pour enfant majeur non rattaché au foyer.`,
        taxBox: '6EL/6EM',
        estimatedRisk: 0,
        legalReference: 'CGI Art. 156-II-2°',
        action: 'Vérifier le choix entre rattachement et déduction pension'
      });
    }
  }
  
  // D3: PER contribution check
  if (input.perContributions > c.maxPERDeduction) {
    const isCoupled = input.familyStatus === 'married' || input.familyStatus === 'pacs';
    const maxPER = isCoupled ? c.maxPERDeductionCouple : c.maxPERDeduction;
    
    if (input.perContributions > maxPER) {
      errors.push({
        id: 'ERR_PER_EXCESS',
        category: 'Charges déductibles',
        code: 'D3',
        severity: 'warning',
        title: 'Versement PER dépassant le plafond',
        description: `Vos versements PER (${input.perContributions}€) dépassent le plafond déductible (${maxPER}€).`,
        taxBox: '6NS/6NT',
        estimatedRisk: (input.perContributions - maxPER) * 0.30,
        legalReference: 'CGI Art. 163 quatervicies',
        action: 'L\'excédent n\'est pas déductible cette année'
      });
    }
  }
  
  // ============== E. FAMILY SITUATION ERRORS ==============
  
  // E1: Child attached to both parents after divorce
  if (input.familyStatus === 'divorced' && input.childrenCount > 0) {
    errors.push({
      id: 'ERR_CHILD_DOUBLE_ATTACHMENT',
      category: 'Situation familiale',
      code: 'E1',
      severity: 'warning',
      title: 'Rattachement enfant après divorce',
      description: 'Un enfant ne peut être rattaché qu\'à un seul foyer fiscal (sauf garde alternée).',
      taxBox: 'C/D/H',
      estimatedRisk: c.halfShareCap,
      legalReference: 'CGI Art. 196',
      action: 'Vérifier la convention de divorce et déclarer la garde alternée si applicable'
    });
  }
  
  // E2: Alternating custody declared
  if (input.childrenAlternatingCustody > 0) {
    errors.push({
      id: 'ERR_ALTERNATING_CUSTODY',
      category: 'Situation familiale',
      code: 'E2',
      severity: 'info',
      title: 'Garde alternée déclarée',
      description: `${input.childrenAlternatingCustody} enfant(s) en garde alternée = demi-part partagée.`,
      taxBox: 'H',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 194',
      action: 'Chaque parent déclare 0.25 part par enfant'
    });
  }
  
  // E3: Handicapped child half-share
  if (input.childrenHandicapped.length > 0) {
    errors.push({
      id: 'ERR_HANDICAPPED_CHILD',
      category: 'Situation familiale',
      code: 'E3',
      severity: 'info',
      title: 'Majoration demi-part enfant handicapé',
      description: `${input.childrenHandicapped.length} enfant(s) handicapé(s) = demi-part supplémentaire par enfant.`,
      taxBox: 'G',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 195',
      action: 'Vérifier que la case G est bien cochée pour chaque enfant concerné'
    });
  }
  
  // ============== F. SPECIAL CASES ERRORS ==============
  
  // F1: Foreign income not declared
  if (input.hasForeignIncome && input.foreignIncome === 0) {
    errors.push({
      id: 'ERR_FOREIGN_INCOME_MISSING',
      category: 'Cas particuliers',
      code: 'F1',
      severity: 'critical',
      title: 'Revenus étrangers non déclarés',
      description: 'Les revenus de source étrangère doivent être déclarés en France.',
      taxBox: '8TK',
      estimatedRisk: 10000,
      legalReference: 'CGI Art. 4A',
      action: 'Déclarer les revenus et vérifier les conventions fiscales applicables'
    });
  }
  
  // F2: First-time buyer credits
  if (input.isFirstTimeBuyer && input.loanInterests > 0) {
    errors.push({
      id: 'ERR_FIRST_TIME_BUYER',
      category: 'Cas particuliers',
      code: 'F2',
      severity: 'info',
      title: 'Primo-accédant : vérifier crédits',
      description: 'Certains dispositifs d\'aide à l\'accession peuvent s\'appliquer.',
      taxBox: '7VY/7VZ',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 200 quaterdecies',
      action: 'Vérifier éligibilité PTZ et autres dispositifs'
    });
  }
  
  // ============== G. COHERENCE CHECKS ==============
  
  // G1: Adult child with higher income than parents
  const hasAdultChild = input.childrenAges.some(age => age >= 18 && age <= 25);
  if (hasAdultChild && input.childrenStudents.length > 0) {
    errors.push({
      id: 'ERR_ADULT_CHILD_INCOME',
      category: 'Cohérence données',
      code: 'G1',
      severity: 'info',
      title: 'Enfant majeur étudiant',
      description: 'Vérifiez les revenus de l\'enfant majeur rattaché (stages, jobs étudiants).',
      taxBox: '0/N',
      estimatedRisk: 0,
      legalReference: 'CGI Art. 6-3°',
      action: 'Les revenus de l\'enfant sont à ajouter aux vôtres s\'il est rattaché'
    });
  }
  
  // G2: Near-zero income with high deductions
  const totalIncome = input.salaryDeclared + input.businessRevenue + input.rentalIncome + input.dividends + input.interests;
  const totalDeductions = input.realExpenses + input.alimonyPaid + input.perContributions;
  if (totalIncome < 10000 && totalDeductions > 5000) {
    errors.push({
      id: 'ERR_LOW_INCOME_HIGH_DEDUCTIONS',
      category: 'Cohérence données',
      code: 'G2',
      severity: 'warning',
      title: 'Incohérence revenus/charges',
      description: 'Revenus faibles avec charges élevées peut déclencher un contrôle.',
      taxBox: 'Multiple',
      estimatedRisk: totalDeductions * 0.20,
      legalReference: 'LPF Art. L10',
      action: 'Préparer les justificatifs de toutes les charges déclarées'
    });
  }
  
  return errors;
}
