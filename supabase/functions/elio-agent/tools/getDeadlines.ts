// Échéances fiscales France 2025-2026 — version condensée pour l'agent

interface Deadline {
  key: string;
  title: string;
  date: string; // ISO
  category: string;
  description: string;
}

const DEADLINES_2025_2026: Deadline[] = [
  { key: 'declaration_2025', title: 'Déclaration de revenus 2024', date: '2025-05-22', category: 'declaration', description: 'Déclaration en ligne (zone 1). Dates échelonnées par département.' },
  { key: 'avis_imposition_2025', title: 'Réception avis d\'imposition', date: '2025-08-31', category: 'reception', description: 'Avis disponibles sur impots.gouv.fr.' },
  { key: 'taxe_fonciere_2025', title: 'Paiement taxe foncière', date: '2025-10-15', category: 'paiement', description: 'Date limite de paiement (20 octobre si en ligne).' },
  { key: 'taxe_habitation_rs_2025', title: 'Taxe d\'habitation résidence secondaire', date: '2025-12-15', category: 'paiement', description: 'Si tu as une résidence secondaire.' },
  { key: 'per_versement_2025', title: 'Dernier versement PER déductible 2025', date: '2025-12-31', category: 'optimisation', description: 'Pour réduire ton impôt 2025. Plafond ~10% des revenus pro.' },
  { key: 'don_oeuvres_2025', title: 'Dons aux œuvres déductibles', date: '2025-12-31', category: 'optimisation', description: 'Réduction de 66% à 75% du don.' },
  { key: 'declaration_2026', title: 'Déclaration de revenus 2025', date: '2026-05-21', category: 'declaration', description: 'Déclaration en ligne. Dates échelonnées par département.' },
  { key: 'urssaf_q4_2025', title: 'Acompte URSSAF Q4', date: '2026-01-31', category: 'urssaf', description: 'Pour les indépendants (micro-entrepreneurs et autres).' },
];

export interface GetDeadlinesInput {
  months_ahead?: number;
}

export interface GetDeadlinesResult {
  deadlines: Array<Deadline & { days_until: number }>;
  count: number;
}

export function getDeadlines(input: GetDeadlinesInput): GetDeadlinesResult {
  const monthsAhead = input.months_ahead ?? 3;
  const today = new Date();
  const limit = new Date(today);
  limit.setMonth(limit.getMonth() + monthsAhead);

  const upcoming = DEADLINES_2025_2026
    .map(d => ({
      ...d,
      days_until: Math.ceil((new Date(d.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter(d => d.days_until >= 0 && new Date(d.date) <= limit)
    .sort((a, b) => a.days_until - b.days_until);

  return { deadlines: upcoming, count: upcoming.length };
}
