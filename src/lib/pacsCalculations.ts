// Moteur PACS / Mariage — Comparaison déclaration séparée vs commune
// Barème IR 2025 (revenus 2024)

const IR_BRACKETS = [
  { min: 0, max: 11_294, rate: 0 },
  { min: 11_294, max: 28_797, rate: 0.11 },
  { min: 28_797, max: 82_341, rate: 0.30 },
  { min: 82_341, max: 177_106, rate: 0.41 },
  { min: 177_106, max: Infinity, rate: 0.45 },
];

// Décote 2025
const DECOTE_SEUIL_SINGLE = 1_929;
const DECOTE_SEUIL_COUPLE = 3_191;
const DECOTE_MAX_SINGLE = 873;
const DECOTE_MAX_COUPLE = 1_444;

// Plafonnement quotient familial (par demi-part) 2025
const QF_PLAFOND_DEMI_PART = 1_759;
const QF_PLAFOND_PARENT_ISOLE_PREMIERE = 4_149;

export interface PacsInput {
  revenuA: number;          // revenu net imposable annuel A
  revenuB: number;          // revenu net imposable annuel B
  enfants: number;          // enfants à charge
  parentIsoleAvant: boolean; // parent isolé avant union (case T pour A ou B seul)
  pensionVersee: number;    // pension alimentaire versée (déductible)
  pensionRecue: number;     // pension alimentaire reçue (imposable)
}

export interface PacsResult {
  separateIR: number;
  jointIR: number;
  savings: number;          // > 0 si union avantageuse
  recommendation: string;
  detailSeparate: { irA: number; irB: number; partsA: number; partsB: number };
  detailJoint: { ir: number; parts: number };
}

/** IR progressif sur revenu imposable, avec quotient familial */
export function calculateIR(taxableIncome: number, parts: number = 1): number {
  if (taxableIncome <= 0) return 0;
  const incomePerPart = taxableIncome / parts;
  let irPerPart = 0;
  for (const bracket of IR_BRACKETS) {
    if (incomePerPart <= bracket.min) break;
    const taxable = Math.min(incomePerPart, bracket.max) - bracket.min;
    irPerPart += taxable * bracket.rate;
  }
  return irPerPart * parts;
}

/** Nombre de parts fiscales */
export function calculateParts(
  status: 'single' | 'couple',
  children: number,
  parentIsole: boolean = false
): number {
  let parts = status === 'couple' ? 2 : 1;
  if (status === 'single' && parentIsole && children > 0) parts += 0.5; // case T
  if (children >= 1) parts += 0.5;
  if (children >= 2) parts += 0.5;
  if (children >= 3) parts += children - 2;
  return parts;
}

/** Décote 2025 */
export function applyDecote(ir: number, status: 'single' | 'couple'): number {
  const seuil = status === 'couple' ? DECOTE_SEUIL_COUPLE : DECOTE_SEUIL_SINGLE;
  const max = status === 'couple' ? DECOTE_MAX_COUPLE : DECOTE_MAX_SINGLE;
  if (ir >= seuil) return ir;
  const decote = max - ir * 0.4525;
  return Math.max(0, ir - Math.max(0, decote));
}

/** Plafonnement des effets du quotient familial */
export function applyQFCeiling(
  irWithoutQF: number,
  irWithQF: number,
  demiPartsSupp: number,
  parentIsole: boolean = false
): number {
  if (demiPartsSupp <= 0) return irWithQF;
  const reductionMax =
    demiPartsSupp * QF_PLAFOND_DEMI_PART +
    (parentIsole ? QF_PLAFOND_PARENT_ISOLE_PREMIERE - QF_PLAFOND_DEMI_PART : 0);
  const reductionReelle = irWithoutQF - irWithQF;
  if (reductionReelle > reductionMax) {
    return irWithoutQF - reductionMax;
  }
  return irWithQF;
}

function computeIRWithCeiling(
  income: number,
  status: 'single' | 'couple',
  children: number,
  parentIsole: boolean = false
): number {
  const partsBase = status === 'couple' ? 2 : 1;
  const partsTotal = calculateParts(status, children, parentIsole);
  const demiPartsSupp = (partsTotal - partsBase) * 2;

  const irBase = calculateIR(income, partsBase);
  const irQF = calculateIR(income, partsTotal);
  const irPlafonne = applyQFCeiling(irBase, irQF, demiPartsSupp, parentIsole);
  return applyDecote(irPlafonne, status);
}

/** Compare déclaration séparée vs commune */
export function compareSeparateVsJoint(input: PacsInput): PacsResult {
  const { revenuA, revenuB, enfants, parentIsoleAvant, pensionVersee, pensionRecue } = input;

  // Hypothèse simple : pension versée par A, pension reçue par A (ou répartie sur A en séparé)
  const baseA = Math.max(0, revenuA + pensionRecue - pensionVersee);
  const baseB = Math.max(0, revenuB);

  // Séparé : enfants rattachés à celui qui en bénéficie le plus (heuristique : le plus haut revenu)
  const enfantsSurA = revenuA >= revenuB ? enfants : 0;
  const enfantsSurB = revenuA >= revenuB ? 0 : enfants;
  const irA = computeIRWithCeiling(baseA, 'single', enfantsSurA, parentIsoleAvant && enfantsSurA > 0);
  const irB = computeIRWithCeiling(baseB, 'single', enfantsSurB, false);
  const partsA = calculateParts('single', enfantsSurA, parentIsoleAvant && enfantsSurA > 0);
  const partsB = calculateParts('single', enfantsSurB, false);

  // Commun
  const baseJoint = Math.max(0, revenuA + revenuB + pensionRecue - pensionVersee);
  const irJoint = computeIRWithCeiling(baseJoint, 'couple', enfants, false);
  const partsJoint = calculateParts('couple', enfants, false);

  const separateIR = Math.round(irA + irB);
  const jointIR = Math.round(irJoint);
  const savings = separateIR - jointIR;

  let recommendation = '';
  if (savings > 100) {
    recommendation = `Le PACS ou mariage te ferait gagner ${Math.round(savings).toLocaleString('fr-FR')} €/an. C'est avantageux dans ta situation.`;
  } else if (savings < -100) {
    recommendation = `Attention : l'union commune te coûterait ${Math.round(-savings).toLocaleString('fr-FR')} €/an de plus. Tu peux opter pour la déclaration séparée la 1re année.`;
  } else {
    recommendation = `L'impact fiscal est quasi neutre (${Math.round(savings)} €). D'autres critères peuvent guider ton choix (succession, protection sociale).`;
  }

  return {
    separateIR,
    jointIR,
    savings,
    recommendation,
    detailSeparate: { irA: Math.round(irA), irB: Math.round(irB), partsA, partsB },
    detailJoint: { ir: jointIR, parts: partsJoint },
  };
}
