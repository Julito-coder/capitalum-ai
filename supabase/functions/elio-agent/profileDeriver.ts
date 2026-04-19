// Profile Deriver — centralise la logique de dérivation des champs
// "calculés" depuis les champs atomiques de public.profiles.
// Utilisé par l'edge function elio-agent (system prompt + tools).

export interface RawProfile {
  user_id?: string;
  // Identité
  first_name?: string | null;
  full_name?: string | null;
  birth_year?: number | null;
  primary_objective?: string | null;
  // Famille
  family_status?: string | null;
  children_count?: number | null;
  // Pro
  professional_status?: string | null;
  is_employee?: boolean | null;
  is_self_employed?: boolean | null;
  is_retired?: boolean | null;
  is_investor?: boolean | null;
  // Salaire
  net_monthly_salary?: number | null;
  annual_bonus?: number | null;
  thirteenth_month?: number | null;
  overtime_annual?: number | null;
  supplementary_income?: number | null;
  has_real_expenses?: boolean | null;
  real_expenses_amount?: number | null;
  // Freelance
  monthly_revenue_freelance?: number | null;
  annual_revenue_ht?: number | null;
  siret?: string | null;
  company_name?: string | null;
  // Patrimoine
  pea_balance?: number | null;
  life_insurance_balance?: number | null;
  // Logement
  housing_status?: string | null;
  is_homeowner?: boolean | null;
  monthly_rent?: number | null;
  housing_zone?: string | null;
  address_postal_code?: string | null;
  // Fiscalité
  reference_tax_income?: number | null;
  // Méta
  has_rental_income?: boolean | null;
  has_investments?: boolean | null;
  crypto_pnl_2025?: number | null;
  crypto_wallet_address?: string | null;
  main_pension_annual?: number | null;
  onboarding_completed?: boolean | null;
  updated_at?: string | null;
}

export interface DerivedValues {
  annual_net_income: number | null;
  taxable_income: number | null;
  tax_parts: number | null;
  has_crypto: boolean;
  is_profile_sufficient_for_tax: boolean;
  missing_for_tax: string[];
}

export function deriveProfile(profile: RawProfile | null | undefined): {
  raw: RawProfile;
  derived: DerivedValues;
} {
  const p = profile || {};

  // 1. Revenu net annuel — somme des composantes
  const monthly = Number(p.net_monthly_salary) || 0;
  const bonus = Number(p.annual_bonus) || 0;
  const thirteenth = Number(p.thirteenth_month) || 0;
  const overtime = Number(p.overtime_annual) || 0;
  const supp = Number(p.supplementary_income) || 0;
  const fromSalary = monthly * 12 + bonus + thirteenth + overtime + supp;

  // Si freelance et pas de salaire, utiliser le CA mensuel * 12
  const monthlyFreelance = Number(p.monthly_revenue_freelance) || 0;
  const annualFreelance = Number(p.annual_revenue_ht) || 0;
  const fromFreelance = monthlyFreelance > 0 ? monthlyFreelance * 12 : annualFreelance;

  let annual_net_income: number | null = null;
  if (fromSalary > 0 && fromFreelance > 0) {
    annual_net_income = Math.round(fromSalary + fromFreelance);
  } else if (fromSalary > 0) {
    annual_net_income = Math.round(fromSalary);
  } else if (fromFreelance > 0) {
    annual_net_income = Math.round(fromFreelance);
  }

  // 2. Revenu imposable (abattement 10% ou frais réels)
  let taxable_income: number | null = null;
  if (annual_net_income != null) {
    if (p.has_real_expenses && Number(p.real_expenses_amount) > 0) {
      taxable_income = Math.round(annual_net_income - Number(p.real_expenses_amount));
    } else {
      taxable_income = Math.round(annual_net_income * 0.9);
    }
  }

  // 3. Quotient familial
  const tax_parts = computeTaxParts(p.family_status, p.children_count);

  // 4. A-t-on de la crypto ?
  const has_crypto = !!(Number(p.crypto_pnl_2025) || (p.crypto_wallet_address && p.crypto_wallet_address.length));

  // 5. Champs manquants pour un calcul d'impôt
  const missing_for_tax: string[] = [];
  if (taxable_income == null) missing_for_tax.push('revenus (salaire ou CA freelance)');
  if (!p.family_status) missing_for_tax.push('situation familiale');
  if (p.children_count == null) missing_for_tax.push("nombre d'enfants");

  return {
    raw: p,
    derived: {
      annual_net_income,
      taxable_income,
      tax_parts,
      has_crypto,
      is_profile_sufficient_for_tax: missing_for_tax.length === 0,
      missing_for_tax,
    },
  };
}

function computeTaxParts(
  familyStatus: string | null | undefined,
  childrenCount: number | null | undefined,
): number | null {
  if (!familyStatus) return null;
  const isCouple = familyStatus === 'married' || familyStatus === 'pacs';
  const base = isCouple ? 2 : 1;
  const children = Number(childrenCount) || 0;
  // Règle française : 0.5 part par enfant pour les 2 premiers, 1 part à partir du 3e
  const childrenParts = children <= 2 ? children * 0.5 : 1 + (children - 2);
  return base + childrenParts;
}

// ===== Helpers d'affichage pour le system prompt =====

export function formatEuro(v: number | null | undefined): string {
  if (v == null || isNaN(Number(v))) return 'Non renseigné';
  return `${Number(v).toLocaleString('fr-FR')}€`;
}

export function translateFamilyStatus(s?: string | null): string {
  const map: Record<string, string> = {
    single: 'Célibataire',
    married: 'Marié(e)',
    pacs: 'Pacsé(e)',
    divorced: 'Divorcé(e)',
    widowed: 'Veuf/veuve',
  };
  return s ? map[s] ?? s : 'Non renseigné';
}

export function translateProfessionalStatus(p: RawProfile): string {
  const labels: string[] = [];
  if (p.is_employee) labels.push('Salarié');
  if (p.is_self_employed) labels.push('Indépendant');
  if (p.is_retired) labels.push('Retraité');
  if (p.is_investor) labels.push('Investisseur');
  if (labels.length) return labels.join(', ');
  if (p.professional_status) {
    const map: Record<string, string> = {
      employee: 'Salarié',
      freelance: 'Freelance / Indépendant',
      entrepreneur: 'Entrepreneur',
      civil_servant: 'Fonctionnaire',
      retired: 'Retraité',
      student: 'Étudiant',
      unemployed: 'Sans emploi',
    };
    return map[p.professional_status] ?? p.professional_status;
  }
  return 'Non renseigné';
}

export function translateHousing(p: RawProfile): string {
  if (p.housing_status) {
    const map: Record<string, string> = {
      owner: 'Propriétaire',
      tenant: 'Locataire',
      housed_free: 'Logé à titre gratuit',
    };
    return map[p.housing_status] ?? p.housing_status;
  }
  if (p.is_homeowner === true) return 'Propriétaire';
  if (p.is_homeowner === false) return 'Locataire';
  return 'Non renseigné';
}

export function getFirstName(p: RawProfile): string {
  if (p.first_name) return p.first_name;
  if (p.full_name) return p.full_name.split(' ')[0];
  return "l'utilisateur";
}
