// Helpers d'estimation de gain pour décider si une reco vaut la peine (seuil 100€).
// Utilisés par les tools (get_fiscal_concept, etc.) pour produire un champ
// `personalization.estimated_gain_if_applied`.

import { deriveProfile, type RawProfile } from './profileDeriver.ts';

// Barème 2025 (revenus 2024) — par part
export function estimateTaxBracket(taxable_income: number, tax_parts: number): number {
  if (!taxable_income || !tax_parts) return 0;
  const per_part = taxable_income / tax_parts;
  if (per_part <= 11497) return 0;
  if (per_part <= 29315) return 11;
  if (per_part <= 83823) return 30;
  if (per_part <= 180294) return 41;
  return 45;
}

export function estimateGainPER(profile: RawProfile, versement: number): number {
  const { derived } = deriveProfile(profile);
  if (!derived.taxable_income || !derived.tax_parts) return 0;
  const bracket = estimateTaxBracket(derived.taxable_income, derived.tax_parts);
  return Math.round(versement * (bracket / 100));
}

export function estimateGainFraisReels(profile: RawProfile, depenses_annuelles: number): number {
  const { derived } = deriveProfile(profile);
  if (!derived.annual_net_income || !derived.tax_parts || !derived.taxable_income) return 0;
  const forfait = derived.annual_net_income * 0.1;
  const difference = depenses_annuelles - forfait;
  if (difference <= 0) return 0;
  const bracket = estimateTaxBracket(derived.taxable_income, derived.tax_parts);
  return Math.round(difference * (bracket / 100));
}

// Plafond PER déductible (10% des revenus pro, max 35 193€ en 2025)
export function estimatePERPlafond(profile: RawProfile): number | null {
  const { derived } = deriveProfile(profile);
  if (!derived.annual_net_income) return null;
  return Math.min(Math.round(derived.annual_net_income * 0.1), 35193);
}

export function isWorthRecommending(estimated_gain_euros: number | null | undefined): boolean {
  return typeof estimated_gain_euros === 'number' && estimated_gain_euros > 100;
}
