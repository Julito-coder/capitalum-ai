/**
 * Moteur de calcul des statuts juridiques français — Barèmes 2025
 * 
 * Sources : urssaf.fr, impots.gouv.fr, service-public.fr
 * 
 * Ce module isole TOUTE la logique métier hors de l'UI.
 */

// ─── Constantes fiscales 2025 ───────────────────────────────────────────────

/** Seuils micro-entreprise 2025 */
export const MICRO_THRESHOLDS = {
  vente: 188_700,
  services: 77_700,
  liberal: 77_700,
} as const;

/** Taux de cotisations sociales micro-entrepreneur 2025 (après réforme) */
export const MICRO_SOCIAL_RATES = {
  vente: 0.123,       // 12.3% achat-revente
  services: 0.217,    // 21.7% prestations BIC
  liberal: 0.232,     // 23.2% professions libérales (CIPAV/URSSAF)
} as const;

/** Abattements forfaitaires micro (pour calcul IR) */
export const MICRO_ABATTEMENTS = {
  vente: 0.71,        // 71% abattement BIC vente
  services: 0.50,     // 50% abattement BIC services
  liberal: 0.34,      // 34% abattement BNC
} as const;

/** Barème IR 2025 (revenus 2024) */
const IR_BRACKETS: Array<{ min: number; max: number; rate: number }> = [
  { min: 0, max: 11_294, rate: 0 },
  { min: 11_294, max: 28_797, rate: 0.11 },
  { min: 28_797, max: 82_341, rate: 0.30 },
  { min: 82_341, max: 177_106, rate: 0.41 },
  { min: 177_106, max: Infinity, rate: 0.45 },
];

/** Taux IS 2025 */
const IS_TAUX_REDUIT = 0.15;       // jusqu'à 42 500 €
const IS_TAUX_NORMAL = 0.25;       // au-delà
const IS_SEUIL_REDUIT = 42_500;

/** Flat tax sur dividendes */
const PFU_RATE = 0.30;

/** Taux charges TNS (gérant majoritaire EURL/SARL) — estimation globale */
const TNS_CHARGES_RATE = 0.45;

/** Taux charges salariales + patronales assimilé salarié (SASU) — estimation globale */
const ASSIMILE_SALARIE_CHARGES_RATE = 0.82; // pour 1€ net versé, coût total ~1.82€

/** Portage salarial — frais de gestion typiques */
const PORTAGE_FRAIS_GESTION = 0.08; // 8% en moyenne
const PORTAGE_CHARGES_RATE = 0.50;  // ~50% charges salariales

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActivityType = 'services' | 'vente' | 'liberal';

export interface StatusFormData {
  annualRevenue: number;
  businessExpenses: number;
  activityType: ActivityType;
  hasEmployees: boolean;
  employeeCount: number;
  hasOffice: boolean;
  officeRent: number;
  hasVehicle: boolean;
  vehicleExpenses: number;
  wantsUnemployment: boolean;
  wantsDividends: boolean;
  planningToSell: boolean;
  yearsInBusiness: number;
  familyStatus: 'single' | 'married' | 'pacs';
  otherHouseholdIncome: number;
}

export interface StatusAnalysis {
  id: string;
  name: string;
  eligible: boolean;
  eligibilityReason?: string;
  charges: number;
  ir: number;
  is: number;
  netAfterTax: number;
  chargesRate: number;
  effectiveTaxRate: number;
  pros: string[];
  cons: string[];
  warnings: string[];
  capitalumScore: number;
  recommendation: string;
  details: {
    label: string;
    value: string;
    highlight?: boolean;
  }[];
}

// ─── Fonctions utilitaires ──────────────────────────────────────────────────

/** Calcul IR progressif sur un revenu imposable */
export function computeIR(taxableIncome: number, parts: number = 1): number {
  if (taxableIncome <= 0) return 0;
  const incomePerPart = taxableIncome / parts;
  let irPerPart = 0;
  for (const bracket of IR_BRACKETS) {
    if (incomePerPart <= bracket.min) break;
    const taxable = Math.min(incomePerPart, bracket.max) - bracket.min;
    irPerPart += taxable * bracket.rate;
  }
  return Math.round(irPerPart * parts);
}

/** Calcul IS progressif */
export function computeIS(profit: number): number {
  if (profit <= 0) return 0;
  if (profit <= IS_SEUIL_REDUIT) return Math.round(profit * IS_TAUX_REDUIT);
  return Math.round(IS_SEUIL_REDUIT * IS_TAUX_REDUIT + (profit - IS_SEUIL_REDUIT) * IS_TAUX_NORMAL);
}

/** TMI (tranche marginale d'imposition) */
export function computeTMI(taxableIncome: number, parts: number = 1): number {
  const incomePerPart = taxableIncome / parts;
  let tmi = 0;
  for (const bracket of IR_BRACKETS) {
    if (incomePerPart > bracket.min) tmi = bracket.rate;
  }
  return tmi;
}

/** Nombre de parts fiscales */
export function computeParts(familyStatus: string, childrenCount: number = 0): number {
  let parts = familyStatus === 'single' ? 1 : 2;
  if (childrenCount >= 1) parts += 0.5;
  if (childrenCount >= 2) parts += 0.5;
  if (childrenCount >= 3) parts += childrenCount - 2; // 1 part par enfant à partir du 3e
  return parts;
}

function getTotalExpenses(data: StatusFormData): number {
  return data.businessExpenses +
    (data.hasOffice ? data.officeRent : 0) +
    (data.hasVehicle ? data.vehicleExpenses : 0) +
    (data.hasEmployees ? data.employeeCount * 35_000 : 0);
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

// ─── Calculs par statut ─────────────────────────────────────────────────────

export function calculateMicroEntrepreneur(data: StatusFormData): StatusAnalysis {
  const threshold = MICRO_THRESHOLDS[data.activityType];
  const eligible = data.annualRevenue <= threshold && !data.hasEmployees;
  const socialRate = MICRO_SOCIAL_RATES[data.activityType];
  const abattement = MICRO_ABATTEMENTS[data.activityType];

  const charges = Math.round(data.annualRevenue * socialRate);
  const taxableIncome = Math.round(data.annualRevenue * (1 - abattement));
  const ir = computeIR(taxableIncome);
  const net = data.annualRevenue - charges - ir;

  const totalExpenses = getTotalExpenses(data);
  const forfaitExpenses = data.annualRevenue * abattement;
  const realExpensesBetter = totalExpenses > forfaitExpenses;

  const warnings: string[] = [];
  if (data.annualRevenue > threshold * 0.9 && eligible) {
    warnings.push(`Attention : vous êtes à ${Math.round((data.annualRevenue / threshold) * 100)}% du seuil (${threshold.toLocaleString('fr-FR')} €). Un dépassement 2 années consécutives entraîne la sortie du régime.`);
  }
  if (realExpensesBetter) {
    warnings.push(`Vos charges réelles (${totalExpenses.toLocaleString('fr-FR')} €) dépassent l'abattement forfaitaire (${Math.round(forfaitExpenses).toLocaleString('fr-FR')} €). Un régime réel pourrait être plus avantageux.`);
  }
  if (!eligible && data.hasEmployees) {
    warnings.push('Le statut micro-entrepreneur est peu adapté avec des salariés (pas de déduction des salaires).');
  }

  let score = 60;
  if (eligible) {
    if (!realExpensesBetter) score += 20;
    if (!data.hasEmployees) score += 10;
    if (data.yearsInBusiness < 3) score += 10;
    if (data.annualRevenue < threshold * 0.5) score += 5;
  } else {
    score = 0;
  }
  if (data.wantsUnemployment) score -= 20;
  score = Math.max(0, Math.min(100, score));

  return {
    id: 'micro',
    name: 'Micro-entrepreneur',
    eligible,
    eligibilityReason: !eligible
      ? data.annualRevenue > threshold
        ? `CA (${data.annualRevenue.toLocaleString('fr-FR')} €) supérieur au seuil de ${threshold.toLocaleString('fr-FR')} €`
        : 'Non adapté avec des salariés'
      : undefined,
    charges,
    ir,
    is: 0,
    netAfterTax: net,
    chargesRate: data.annualRevenue > 0 ? (charges / data.annualRevenue) * 100 : 0,
    effectiveTaxRate: data.annualRevenue > 0 ? ((charges + ir) / data.annualRevenue) * 100 : 0,
    pros: [
      'Comptabilité ultra-simplifiée (livre de recettes)',
      'Pas de TVA sous seuil de franchise',
      'Cotisations proportionnelles au CA (pas de minimum)',
      'Déclaration mensuelle ou trimestrielle simple',
    ],
    cons: [
      'Aucune déduction de charges réelles',
      `Plafond de CA : ${threshold.toLocaleString('fr-FR')} €`,
      'Pas de récupération de TVA',
      'Protection sociale limitée (pas de chômage)',
      'Pas de distinction patrimoine pro/perso',
    ],
    warnings,
    capitalumScore: score,
    recommendation: eligible
      ? realExpensesBetter
        ? 'Votre niveau de charges réelles rend le régime réel plus intéressant.'
        : 'Statut idéal pour votre activité actuelle. Simple et efficace.'
      : `Non éligible : ${data.annualRevenue > threshold ? 'CA trop élevé' : 'incompatible avec salariés'}.`,
    details: [
      { label: 'Taux cotisations', value: formatRate(socialRate) },
      { label: 'Abattement forfaitaire', value: formatRate(abattement) },
      { label: 'Revenu imposable', value: `${taxableIncome.toLocaleString('fr-FR')} €` },
      { label: 'Seuil CA', value: `${threshold.toLocaleString('fr-FR')} €`, highlight: data.annualRevenue > threshold * 0.85 },
    ],
  };
}

export function calculateEURL_IR(data: StatusFormData): StatusAnalysis {
  const totalExpenses = getTotalExpenses(data);
  const profit = Math.max(0, data.annualRevenue - totalExpenses);
  const charges = Math.round(profit * TNS_CHARGES_RATE);
  const taxableIncome = Math.max(0, profit - charges);
  const ir = computeIR(taxableIncome);
  const net = profit - charges - ir;

  const warnings: string[] = [];
  if (profit <= 0) warnings.push('Résultat négatif : les cotisations TNS minimales s\'appliquent (~1 100 €/an).');
  if (data.annualRevenue < 30_000) warnings.push('CA faible pour une EURL : les frais fixes (comptable, CFE) pèsent proportionnellement plus.');

  let score = 55;
  if (totalExpenses > data.annualRevenue * 0.35) score += 20;
  if (data.hasEmployees) score += 10;
  if (data.annualRevenue > 77_700) score += 10;
  if (data.wantsUnemployment) score -= 15;
  score = Math.max(0, Math.min(100, score));

  return {
    id: 'eurl_ir',
    name: 'EURL à l\'IR',
    eligible: true,
    charges,
    ir,
    is: 0,
    netAfterTax: net,
    chargesRate: profit > 0 ? (charges / profit) * 100 : 0,
    effectiveTaxRate: data.annualRevenue > 0 ? ((charges + ir) / data.annualRevenue) * 100 : 0,
    pros: [
      'Déduction de toutes les charges réelles',
      'Pas de plafond de CA',
      'Patrimoine pro séparé du perso',
      'Cotisations TNS (moins élevées que salarié)',
      'Récupération de TVA',
    ],
    cons: [
      `Cotisations TNS élevées (~${formatRate(TNS_CHARGES_RATE)} du bénéfice)`,
      'Comptabilité complète obligatoire (~1 500–3 000 €/an)',
      'Pas de droit au chômage (gérant majoritaire TNS)',
      'Cotisations minimales même sans bénéfice (~1 100 €/an)',
    ],
    warnings,
    capitalumScore: score,
    recommendation: totalExpenses > data.annualRevenue * 0.35
      ? 'Vos charges élevées rendent la déduction au réel très avantageuse.'
      : 'Structure solide mais les cotisations TNS à 45% sont significatives.',
    details: [
      { label: 'Bénéfice avant charges', value: `${profit.toLocaleString('fr-FR')} €` },
      { label: 'Cotisations TNS', value: `${charges.toLocaleString('fr-FR')} €` },
      { label: 'Charges déduites', value: `${totalExpenses.toLocaleString('fr-FR')} €` },
      { label: 'TMI estimée', value: formatRate(computeTMI(taxableIncome)) },
    ],
  };
}

export function calculateSASU(data: StatusFormData): StatusAnalysis {
  const totalExpenses = getTotalExpenses(data);
  const profit = Math.max(0, data.annualRevenue - totalExpenses);

  // Répartition optimale typique : 60% rémunération, 40% dividendes
  const salaryNet = Math.round(profit * 0.50); // net versé au dirigeant
  const salaryCostTotal = Math.round(salaryNet * ASSIMILE_SALARIE_CHARGES_RATE); // coût total
  const chargesOnSalary = salaryCostTotal - salaryNet;

  const profitAfterSalary = Math.max(0, profit - salaryCostTotal);
  const is = computeIS(profitAfterSalary);
  const distributable = profitAfterSalary - is;
  const dividends = Math.max(0, distributable);
  const dividendTax = Math.round(dividends * PFU_RATE);

  const irOnSalary = computeIR(salaryNet); // simplifié
  const totalCharges = chargesOnSalary + is;
  const totalTax = irOnSalary + dividendTax;
  const net = salaryNet - irOnSalary + dividends - dividendTax;

  const warnings: string[] = [];
  if (profit < 40_000) warnings.push('Avec un bénéfice < 40 000 €, le coût des charges sociales en SASU est proportionnellement très élevé.');
  if (!data.wantsDividends && !data.wantsUnemployment) warnings.push('Sans besoin de chômage ni de dividendes, une EURL peut être plus avantageuse.');

  let score = 45;
  if (data.wantsUnemployment) score += 25;
  if (data.wantsDividends) score += 15;
  if (data.annualRevenue > 100_000) score += 10;
  if (data.planningToSell) score += 10;
  if (data.hasEmployees) score += 5;
  score = Math.max(0, Math.min(100, score));

  return {
    id: 'sasu',
    name: 'SASU',
    eligible: true,
    charges: totalCharges,
    ir: totalTax,
    is,
    netAfterTax: net,
    chargesRate: profit > 0 ? (totalCharges / profit) * 100 : 0,
    effectiveTaxRate: data.annualRevenue > 0 ? ((totalCharges + totalTax) / data.annualRevenue) * 100 : 0,
    pros: [
      'Président assimilé salarié (meilleure protection sociale)',
      data.wantsUnemployment ? '✅ Droits au chômage (si cumul avec Pôle Emploi)' : 'Droits au chômage possibles',
      'Dividendes au PFU 30% (pas de cotisations sociales)',
      'Image professionnelle forte',
      'Facilite la cession / levée de fonds',
    ],
    cons: [
      `Charges sociales très élevées (~82% du net versé)`,
      'Comptabilité complète obligatoire',
      'Gestion administrative lourde',
      'Bulletin de paie obligatoire',
      profit < 40_000 ? '⚠️ Peu rentable sous 40 000 € de bénéfice' : 'Coût fixe de gestion important',
    ],
    warnings,
    capitalumScore: score,
    recommendation: data.wantsUnemployment
      ? 'La SASU est le seul statut permettant de cumuler activité et droits au chômage.'
      : data.wantsDividends && profit > 60_000
        ? 'Optimisation dividendes efficace grâce au PFU à 30%.'
        : 'Structure adaptée à la croissance et la cession.',
    details: [
      { label: 'Rémunération nette', value: `${salaryNet.toLocaleString('fr-FR')} €` },
      { label: 'Coût total salaire', value: `${salaryCostTotal.toLocaleString('fr-FR')} €` },
      { label: 'IS sur résultat', value: `${is.toLocaleString('fr-FR')} €` },
      { label: 'Dividendes nets', value: `${Math.max(0, dividends - dividendTax).toLocaleString('fr-FR')} €` },
      { label: 'PFU dividendes', value: `${dividendTax.toLocaleString('fr-FR')} €` },
    ],
  };
}

export function calculatePortage(data: StatusFormData): StatusAnalysis {
  const fraisGestion = Math.round(data.annualRevenue * PORTAGE_FRAIS_GESTION);
  const available = data.annualRevenue - fraisGestion;
  const charges = Math.round(available * PORTAGE_CHARGES_RATE);
  const net = available - charges;
  const ir = computeIR(net);
  const netAfterTax = net - ir;

  const warnings: string[] = [];
  if (data.annualRevenue > 100_000) warnings.push('À ce niveau de CA, le portage salarial devient très coûteux. Envisagez une SASU.');
  if (data.hasEmployees) warnings.push('Le portage salarial ne permet pas d\'embaucher.');

  let score = 35;
  if (data.wantsUnemployment) score += 30;
  if (data.yearsInBusiness < 2) score += 20;
  if (!data.hasEmployees && !data.hasOffice) score += 5;
  if (data.annualRevenue > 100_000) score -= 15;
  score = Math.max(0, Math.min(100, score));

  return {
    id: 'portage',
    name: 'Portage salarial',
    eligible: !data.hasEmployees,
    eligibilityReason: data.hasEmployees ? 'Le portage salarial ne permet pas d\'embaucher des salariés.' : undefined,
    charges: fraisGestion + charges,
    ir,
    is: 0,
    netAfterTax,
    chargesRate: data.annualRevenue > 0 ? ((fraisGestion + charges) / data.annualRevenue) * 100 : 0,
    effectiveTaxRate: data.annualRevenue > 0 ? ((fraisGestion + charges + ir) / data.annualRevenue) * 100 : 0,
    pros: [
      'Zéro gestion administrative',
      'Protection sociale complète (CDI possible)',
      '✅ Droits au chômage garantis',
      'Mutuelle, prévoyance, retraite inclus',
      'Idéal pour tester une activité',
    ],
    cons: [
      `Frais de gestion : ${formatRate(PORTAGE_FRAIS_GESTION)} du CA`,
      'Net le plus faible de tous les statuts',
      'Pas de patrimoine professionnel',
      'Impossible d\'embaucher',
      'Pas de récupération de TVA sur achats',
    ],
    warnings,
    capitalumScore: score,
    recommendation: data.wantsUnemployment && data.yearsInBusiness < 2
      ? 'Solution idéale pour démarrer avec filet de sécurité (chômage + CDI).'
      : 'Le portage est sécurisant mais coûteux à long terme.',
    details: [
      { label: 'Frais de gestion', value: `${fraisGestion.toLocaleString('fr-FR')} €` },
      { label: 'Charges sociales', value: `${charges.toLocaleString('fr-FR')} €` },
      { label: 'Net avant IR', value: `${net.toLocaleString('fr-FR')} €` },
      { label: 'Taux prélèvement global', value: formatRate((fraisGestion + charges) / data.annualRevenue) },
    ],
  };
}

/** Calcule tous les statuts et les trie par score */
export function calculateAllStatuses(data: StatusFormData): StatusAnalysis[] {
  const results = [
    calculateMicroEntrepreneur(data),
    calculateEURL_IR(data),
    calculateSASU(data),
    calculatePortage(data),
  ];
  return results.sort((a, b) => b.capitalumScore - a.capitalumScore);
}
