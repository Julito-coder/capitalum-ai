// Tool: propose_profile_update
// NE TOUCHE PAS la base. Retourne juste une rich_view que le frontend
// affichera sous forme de carte de confirmation avec boutons.
// La persistance réelle se fait côté front après clic utilisateur.

export interface ProposalItem {
  field: string;
  value: unknown;
  human_label: string;
  unit?: string;
  reason: string;
}

const ALLOWED_FIELDS = new Set([
  'first_name',
  'net_monthly_salary',
  'annual_bonus',
  'thirteenth_month',
  'monthly_revenue_freelance',
  'annual_revenue_ht',
  'has_real_expenses',
  'real_expenses_amount',
  'family_status',
  'children_count',
  'professional_status',
  'pea_balance',
  'life_insurance_balance',
  'main_pension_annual',
  'housing_status',
  'is_homeowner',
  'monthly_rent',
  'housing_zone',
  'has_rental_income',
  'has_investments',
  'birth_year',
  'primary_objective',
  'reference_tax_income',
]);

export function proposeProfileUpdate(args: { proposals: ProposalItem[] }): {
  view_type: 'profile_update_proposal';
  proposal_id: string;
  proposals: ProposalItem[];
  rejected: ProposalItem[];
  message: string;
} {
  const proposals: ProposalItem[] = Array.isArray(args?.proposals) ? args.proposals : [];

  const accepted: ProposalItem[] = [];
  const rejected: ProposalItem[] = [];

  for (const p of proposals) {
    if (!p || typeof p.field !== 'string') {
      rejected.push(p);
      continue;
    }
    if (!ALLOWED_FIELDS.has(p.field)) {
      rejected.push(p);
      continue;
    }
    accepted.push({
      field: p.field,
      value: p.value,
      human_label: p.human_label || p.field,
      unit: p.unit,
      reason: p.reason || '',
    });
  }

  return {
    view_type: 'profile_update_proposal',
    proposal_id: crypto.randomUUID(),
    proposals: accepted,
    rejected,
    message:
      accepted.length > 0
        ? "Proposition affichée à l'utilisateur. Attends sa confirmation via l'UI."
        : 'Aucune proposition valide à enregistrer.',
  };
}
