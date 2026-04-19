// Tool: detect_aids — analyse l'éligibilité de l'utilisateur aux 10 aides nationales V1.

import { AIDS_RULES, type AidCheckResult } from '../knowledge/aids-rules.ts';

interface AidResult extends AidCheckResult {
  id: string;
  name: string;
  category: string;
  source_url: string;
}

export async function detectAids(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{
  view_type: 'aids_eligibility';
  eligible: AidResult[];
  needs_info: AidResult[];
  uncertain: AidResult[];
  not_eligible: AidResult[];
  total_estimated_monthly?: string;
}> {
  // Fetch profil via REST (évite la dépendance au client SDK ici)
  const resp = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=*`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const rows = resp.ok ? await resp.json() : [];
  const profile = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

  const results: AidResult[] = AIDS_RULES.map((rule) => {
    const out = rule.check(profile);
    return {
      id: rule.id,
      name: rule.name,
      category: rule.category,
      source_url: rule.source_url,
      ...out,
    };
  });

  return {
    view_type: 'aids_eligibility',
    eligible: results.filter((r) => r.status === 'eligible'),
    needs_info: results.filter((r) => r.status === 'needs_info'),
    uncertain: results.filter((r) => r.status === 'uncertain'),
    not_eligible: results.filter((r) => r.status === 'not_eligible'),
  };
}
