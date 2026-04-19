// Récupère les recommandations actives de l'utilisateur depuis user_recommendations + profile

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export interface RecommendationItem {
  key: string;
  title: string;
  estimated_gain: number;
  status: string;
  reason?: string;
}

export interface GetRecommendationsResult {
  recommendations: RecommendationItem[];
  total_potential_gain: number;
  count: number;
}

const RECO_LABELS: Record<string, string> = {
  open_per: 'Ouvrir un PER pour réduire ton impôt',
  declare_real_expenses: 'Déclarer tes frais réels (télétravail, transport)',
  open_pea: 'Ouvrir un PEA pour défiscaliser tes plus-values',
  optimize_lmnp: 'Passer en LMNP réel pour amortir ton bien locatif',
  donate_charity: 'Faire un don aux œuvres avant le 31/12',
  check_aps: 'Vérifier ton éligibilité aux APL',
  prime_activite: 'Demander la prime d\'activité',
  cmg: 'Optimiser le complément de mode de garde (CMG)',
};

export async function getRecommendations(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<GetRecommendationsResult> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('user_recommendations')
    .select('recommendation_key, estimated_gain, status, dismissed_reason')
    .eq('user_id', userId)
    .in('status', ['pending', 'accepted'])
    .order('estimated_gain', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[getRecommendations] error:', error);
    return { recommendations: [], total_potential_gain: 0, count: 0 };
  }

  const recommendations: RecommendationItem[] = (data || []).map(r => ({
    key: r.recommendation_key,
    title: RECO_LABELS[r.recommendation_key] || r.recommendation_key,
    estimated_gain: Number(r.estimated_gain) || 0,
    status: r.status,
    reason: r.dismissed_reason || undefined,
  }));

  const total = recommendations.reduce((sum, r) => sum + r.estimated_gain, 0);

  return { recommendations, total_potential_gain: total, count: recommendations.length };
}
