// Tool: get_user_profile
// Récupère des champs précis du profil fiscal de l'utilisateur (table public.profiles)
// avec calculs dérivés (annual_net_income, has_crypto…).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export type ProfileField =
  | 'annual_net_income'
  | 'reference_tax_income'
  | 'main_pension'
  | 'pea_balance'
  | 'life_insurance_balance'
  | 'has_real_expenses'
  | 'real_expenses_amount'
  | 'housing_status'
  | 'monthly_rent'
  | 'housing_zone'
  | 'siret'
  | 'company_name'
  | 'monthly_revenue_freelance'
  | 'primary_objective'
  | 'birth_year'
  | 'all';

const ALL_FIELDS: Exclude<ProfileField, 'all'>[] = [
  'annual_net_income',
  'reference_tax_income',
  'main_pension',
  'pea_balance',
  'life_insurance_balance',
  'has_real_expenses',
  'real_expenses_amount',
  'housing_status',
  'monthly_rent',
  'housing_zone',
  'siret',
  'company_name',
  'monthly_revenue_freelance',
  'primary_objective',
  'birth_year',
];

function deriveField(field: Exclude<ProfileField, 'all'>, p: any): unknown {
  switch (field) {
    case 'annual_net_income': {
      const monthly = Number(p.net_monthly_salary) || 0;
      const bonus = Number(p.annual_bonus) || 0;
      const thirteenth = Number(p.thirteenth_month) || 0;
      const overtime = Number(p.overtime_annual) || 0;
      const supp = Number(p.supplementary_income) || 0;
      const total = monthly * 12 + bonus + thirteenth + overtime + supp;
      return total > 0 ? Math.round(total) : null;
    }
    case 'reference_tax_income':
      // Pas de champ dédié → l'agent doit demander à l'utilisateur (avis d'imposition)
      return null;
    case 'main_pension':
      return p.main_pension_annual ?? null;
    case 'pea_balance':
      return p.pea_balance ?? null;
    case 'life_insurance_balance':
      return p.life_insurance_balance ?? null;
    case 'has_real_expenses':
      return p.has_real_expenses ?? null;
    case 'real_expenses_amount':
      return p.real_expenses_amount ?? null;
    case 'housing_status':
      return p.is_homeowner === true ? 'proprietaire' : p.is_homeowner === false ? 'locataire' : null;
    case 'monthly_rent':
      // Pas de colonne dédiée
      return null;
    case 'housing_zone':
      return p.address_postal_code ?? p.address_city ?? null;
    case 'siret':
      return p.siret ?? null;
    case 'company_name':
      return p.company_name ?? null;
    case 'monthly_revenue_freelance': {
      const annual = Number(p.annual_revenue_ht) || 0;
      return annual > 0 ? Math.round(annual / 12) : null;
    }
    case 'primary_objective':
      return p.primary_objective ?? null;
    case 'birth_year':
      return p.birth_year ?? null;
  }
}

export async function getUserProfile(
  args: { fields: ProfileField[] },
  userId: string,
  supabaseUrl: string,
  serviceKey: string,
) {
  const fields = Array.isArray(args?.fields) && args.fields.length ? args.fields : ['all' as ProfileField];
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { error: 'Impossible de charger le profil', details: error.message };
  }
  if (!profile) {
    return { profile_exists: false, message: "Le profil n'est pas encore créé." };
  }

  const targets: Exclude<ProfileField, 'all'>[] = fields.includes('all')
    ? ALL_FIELDS
    : (fields.filter((f) => f !== 'all') as Exclude<ProfileField, 'all'>[]);

  const result: Record<string, { value: unknown; status: 'filled' | 'not_filled' }> = {};
  for (const f of targets) {
    const value = deriveField(f, profile);
    result[f] = {
      value,
      status: value === null || value === undefined || value === '' ? 'not_filled' : 'filled',
    };
  }

  return {
    profile_exists: true,
    fetched_at: new Date().toISOString(),
    profile_updated_at: profile.updated_at,
    fields: result,
  };
}
