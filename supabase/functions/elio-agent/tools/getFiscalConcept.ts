// Tool: get_fiscal_concept — renvoie une fiche pédagogique structurée + un bloc
// `personalization` qui aide le LLM à décider entre structure 3 couches, 2 couches
// ou suppression de la couche 3 (gain < 100€).

import { FISCAL_CONCEPTS, FISCAL_CONCEPT_IDS, type FiscalConcept } from '../knowledge/fiscal-concepts.ts';
import { deriveProfile, type RawProfile } from '../profileDeriver.ts';
import {
  estimateTaxBracket,
  estimateGainPER,
  estimatePERPlafond,
  estimateGainFraisReels,
} from '../gainEstimator.ts';

export interface Personalization {
  applies_to_user: boolean;
  estimated_gain_if_applied: number | null;
  user_specific_values: Record<string, unknown>;
  reason_if_not_applicable?: string;
}

export interface GetFiscalConceptResult {
  view_type: 'fiscal_concept';
  concept: FiscalConcept;
  personalization: Personalization;
}

export interface GetFiscalConceptError {
  error: string;
  available_ids: string[];
}

async function fetchProfile(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<RawProfile | null> {
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=*`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const rows = resp.ok ? await resp.json() : [];
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch (e) {
    console.error('[getFiscalConcept] fetch profile error', e);
    return null;
  }
}

function buildPersonalization(conceptId: string, profile: RawProfile | null): Personalization {
  const fallback: Personalization = {
    applies_to_user: true,
    estimated_gain_if_applied: null,
    user_specific_values: {},
  };
  if (!profile) return fallback;

  const { raw, derived } = deriveProfile(profile);
  const bracket =
    derived.taxable_income && derived.tax_parts
      ? estimateTaxBracket(derived.taxable_income, derived.tax_parts)
      : null;

  switch (conceptId) {
    case 'per': {
      const plafond = estimatePERPlafond(raw);
      // Versement test typique : min(3000, plafond) si plafond connu
      const test_versement = plafond ? Math.min(3000, plafond) : 3000;
      const gain = estimateGainPER(raw, test_versement);
      const applies = bracket !== null && bracket >= 11;
      return {
        applies_to_user: applies,
        estimated_gain_if_applied: gain,
        user_specific_values: {
          taxable_income: derived.taxable_income,
          tax_bracket_percent: bracket,
          plafond_deductible: plafond,
          gain_pour_versement_test: gain,
          versement_test_euros: test_versement,
        },
        reason_if_not_applicable:
          bracket !== null && bracket < 11
            ? "Ta tranche d'imposition est basse (0%), l'économie d'impôt avec un PER serait quasi nulle."
            : bracket === null
            ? 'Revenus non renseignés — impossible de chiffrer le gain.'
            : undefined,
      };
    }

    case 'frais_reels_vs_forfait_10': {
      const forfait = derived.annual_net_income ? Math.round(derived.annual_net_income * 0.1) : null;
      // On suppose un test à forfait + 1500€ de frais supplémentaires pour évaluer l'ordre de grandeur
      const gain_si_1500_supp = forfait ? estimateGainFraisReels(raw, forfait + 1500) : 0;
      return {
        applies_to_user: !!derived.annual_net_income && !raw.is_self_employed,
        estimated_gain_if_applied: gain_si_1500_supp,
        user_specific_values: {
          annual_net_income: derived.annual_net_income,
          forfait_10_pct: forfait,
          tax_bracket_percent: bracket,
          gain_si_1500_euros_de_frais_supp: gain_si_1500_supp,
        },
        reason_if_not_applicable: raw.is_self_employed
          ? 'Tu es indépendant — le forfait 10% ne te concerne pas, tu déduis tes frais directement.'
          : undefined,
      };
    }

    case 'pea': {
      // Le PEA "vaut" surtout si on investit long terme. Gain = écart fiscalité (30% → 17,2%) sur PV éventuelles.
      // On ne peut pas chiffrer sans hypothèse de PV. On flag quand même applies_to_user.
      const has_horizon = !!derived.taxable_income;
      return {
        applies_to_user: has_horizon,
        estimated_gain_if_applied: null,
        user_specific_values: {
          pea_balance: raw.pea_balance,
          tax_bracket_percent: bracket,
        },
      };
    }

    case 'tranches_ir': {
      return {
        applies_to_user: true,
        estimated_gain_if_applied: null,
        user_specific_values: {
          taxable_income: derived.taxable_income,
          tax_parts: derived.tax_parts,
          tax_bracket_percent: bracket,
        },
      };
    }

    case 'sasu':
    case 'eurl':
    case 'micro_entrepreneur': {
      const isFreelanceOrInterested = !!(raw.is_self_employed || raw.monthly_revenue_freelance);
      return {
        applies_to_user: isFreelanceOrInterested,
        estimated_gain_if_applied: null,
        user_specific_values: {
          professional_status: raw.professional_status,
          monthly_revenue_freelance: raw.monthly_revenue_freelance,
        },
        reason_if_not_applicable: isFreelanceOrInterested
          ? undefined
          : "Tant que tu es salarié sans projet de freelance ou de création d'entreprise, ce statut ne te concerne pas directement.",
      };
    }

    case 'lmnp':
    case 'deficit_foncier': {
      const has_rental = !!(raw.has_rental_income || raw.monthly_rent);
      return {
        applies_to_user: has_rental,
        estimated_gain_if_applied: null,
        user_specific_values: {
          has_rental_income: raw.has_rental_income,
        },
        reason_if_not_applicable: has_rental
          ? undefined
          : "Tu n'as pas de revenus fonciers actuellement — ce dispositif ne s'applique pas à ta situation pour l'instant.",
      };
    }

    default:
      return fallback;
  }
}

export async function getFiscalConcept(
  args: { concept_id: string },
  userId: string | null,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<GetFiscalConceptResult | GetFiscalConceptError> {
  const id = String(args?.concept_id || '').trim();
  const concept = FISCAL_CONCEPTS[id];
  if (!concept) {
    return {
      error: `Concept inconnu : "${id}". Choisis parmi la liste disponible.`,
      available_ids: FISCAL_CONCEPT_IDS,
    };
  }

  const profile = userId ? await fetchProfile(userId, supabaseUrl, serviceRoleKey) : null;
  const personalization = buildPersonalization(id, profile);

  return {
    view_type: 'fiscal_concept',
    concept,
    personalization,
  };
}
