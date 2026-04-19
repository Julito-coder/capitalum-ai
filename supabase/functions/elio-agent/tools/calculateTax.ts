// Calcul IR France 2025 — porté de src/lib/statusCalculations.ts
// Barème 2025 (revenus 2024)

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
  // 0.5 par enfant pour les 2 premiers, 1 part par enfant à partir du 3e
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
  taxable_income: number;
  family_status: string;
  children_count: number;
}

export interface CalculateTaxResult {
  taxable_income: number;
  parts: number;
  quotient: number;
  ir_estimated: number;
  marginal_rate: number;
  effective_rate: number;
  family_status: string;
  children_count: number;
}

export function calculateTax(input: CalculateTaxInput): CalculateTaxResult {
  const { taxable_income, family_status, children_count } = input;
  const parts = computeParts(family_status, children_count);
  const quotient = taxable_income / parts;
  const irPerPart = computeIROnQuotient(quotient);
  const ir = Math.round(irPerPart * parts);

  // Tranche marginale
  let marginal = 0;
  for (const b of BRACKETS_2025) {
    if (quotient > (b === BRACKETS_2025[0] ? 0 : BRACKETS_2025[BRACKETS_2025.indexOf(b) - 1].limit)) {
      marginal = b.rate;
    }
  }

  return {
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
