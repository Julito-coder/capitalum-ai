// Tool: get_fiscal_concept — renvoie une fiche pédagogique structurée sur un concept fiscal.

import { FISCAL_CONCEPTS, FISCAL_CONCEPT_IDS, type FiscalConcept } from '../knowledge/fiscal-concepts.ts';

export function getFiscalConcept(args: { concept_id: string }): {
  view_type: 'fiscal_concept';
  concept: FiscalConcept;
} | { error: string; available_ids: string[] } {
  const id = String(args?.concept_id || '').trim();
  const concept = FISCAL_CONCEPTS[id];
  if (!concept) {
    return {
      error: `Concept inconnu : "${id}". Choisis parmi la liste disponible.`,
      available_ids: FISCAL_CONCEPT_IDS,
    };
  }
  return {
    view_type: 'fiscal_concept',
    concept,
  };
}
