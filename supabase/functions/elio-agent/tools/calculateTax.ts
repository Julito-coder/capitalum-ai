// Calcul IR France 2025 — porté de src/lib/statusCalculations.ts
// Barème 2025 (revenus 2024)
// Tous les paramètres sont OPTIONNELS. Si non fournis, l'edge function
// les résout depuis le profil via deriveProfile() avant d'appeler calculateTax.

const BRACKETS_2025 = [
  { limit: 11497, rate: 0 },
  { limit: 29315, rate: 0.11 },
  { limit: 83823, rate: 0.30 },
  { limit: 180294, rate: 0.41 },
  { limit: Infinity, rate: 0.45 },
];

function computeParts(familyStatus: string, childrenCount: number): number {
  const isCouple = familyStatus === 'married' || familyStatus === 'pacs';
  let parts = isCouple ? 2 : 1;
  if (childrenCount <= 2) parts += childrenCount * 0.5;
  else parts += 1 + (childrenCount - 2);
  return parts;
}

function computeIROnQuotient(quotient: number): number {
  let tax = 0;
  let prev = 0;
  for (const b of BRACKETS_2025) {
    if (quotient <= prev) break;
    const slice = Math.min(quotient, b.limit) - prev;
    tax += slice * b.rate;
    prev = b.limit;
  }
  return tax;
}

export interface CalculateTaxInput {
  taxable_income?: number | null;
  family_status?: string | null;
  children_count?: number | null;
}

export interface CalculateTaxResult {
  success: true;
  taxable_income: number;
  parts: number;
  quotient: number;
  ir_estimated: number;
  marginal_rate: number;
  effective_rate: number;
  family_status: string;
  children_count: number;
}

export interface CalculateTaxMissing {
  success: false;
  missing: string[];
  message: string;
}

export function calculateTax(
  input: CalculateTaxInput,
): CalculateTaxResult | CalculateTaxMissing {
  const missing: string[] = [];
  if (input.taxable_income == null || isNaN(Number(input.taxable_income))) {
    missing.push('taxable_income');
  }
  if (!input.family_status) missing.push('family_status');
  if (input.children_count == null || isNaN(Number(input.children_count))) {
    missing.push('children_count');
  }

  if (missing.length > 0) {
    return {
      success: false,
      missing,
      message: `Pour calculer ton impôt, il me manque : ${missing.join(', ')}`,
    };
  }

  const taxable_income = Number(input.taxable_income);
  const family_status = String(input.family_status);
  const children_count = Number(input.children_count);

  const parts = computeParts(family_status, children_count);
  const quotient = taxable_income / parts;
  const irPerPart = computeIROnQuotient(quotient);
  const ir = Math.round(irPerPart * parts);

  // Tranche marginale
  let marginal = 0;
  let prevLimit = 0;
  for (const b of BRACKETS_2025) {
    if (quotient > prevLimit) marginal = b.rate;
    prevLimit = b.limit;
  }

  return {
    success: true,
    taxable_income,
    parts,
    quotient: Math.round(quotient),
    ir_estimated: Math.max(0, ir),
    marginal_rate: marginal,
    effective_rate: taxable_income > 0 ? Math.round((ir / taxable_income) * 1000) / 10 : 0,
    family_status,
    children_count,
  };
}
