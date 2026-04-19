
## Plan : ajouter 2 tools à l'agent Élio (`detect_aids` + `get_fiscal_concept`)

### Contexte
- L'agent Élio actuel a 4 tools dans `supabase/functions/elio-agent/tools/` : calculateTax, getDeadlines, getRecommendations, simulateRealEstate.
- Le RichViewRenderer route déjà des `view_type` vers des composants. Il faut ajouter 2 nouveaux types : `aids_eligibility` et `fiscal_concept`.
- L'espace agent vit dans `src/pages/Agent.tsx` (pas `ElioAgent.tsx` — la mémoire confirme la nav 4 tabs avec Agent en 2e). Je vérifierai le nom exact avant édit.

### Changements (≤3 logiques)

**1. Backend — knowledge + tools + déclaration + system prompt**
- `supabase/functions/elio-agent/knowledge/aids-rules.ts` : 10 aides (APL, Prime activité, CSS, ARS, Chèque énergie, Bourse CROUS, MaPrimeRénov', RSA, AAH, AF) avec `check(profile)` retournant `{status, reason, estimated_amount?, missing_fields?}`. Seuils 2025 simplifiés, biais "uncertain" plutôt que faux positif.
- `supabase/functions/elio-agent/knowledge/fiscal-concepts.ts` : 20 concepts avec structure `{id, title, elio_explanation, key_numbers_2025[], who_it_fits[], watch_out_for[], source_url}`.
- `supabase/functions/elio-agent/tools/detectAids.ts` : fetch profile depuis `profiles`, mappe vers les inputs des règles, exécute toutes les `check()`, regroupe par status. Renvoie aussi `view_type: 'aids_eligibility'`.
- `supabase/functions/elio-agent/tools/getFiscalConcept.ts` : lookup dans le dict, renvoie `{concept, view_type: 'fiscal_concept'}` ou erreur si id inconnu.
- `supabase/functions/elio-agent/index.ts` : importer + ajouter les 2 tools dans la liste des tool definitions OpenAI, brancher dans le switch d'exécution, mettre à jour la règle CRITIQUE du system prompt selon le format demandé.

**2. Frontend — 2 rich views**
- `src/components/elio-agent/rich-views/AidsEligibility.tsx` : 4 sections verticales (vert / orange / jaune / gris dépliable), cartes avec nom + montant + reason + lien source. Sora, palette Élio.
- `src/components/elio-agent/rich-views/FiscalConcept.tsx` : carte avec titre + 4 sous-sections (En gros, Chiffres 2025, Pour qui, Attention à) + lien source.
- `src/components/elio-agent/RichViewRenderer.tsx` : ajouter les 2 cases.

**3. Suggestions L1 dans la page Agent**
- Ouvrir `src/pages/Agent.tsx` (ou `ElioAgent.tsx` selon ce qui existe), vérifier que "Vérifie si j'ai droit à des aides" est présent, ajouter "Explique-moi ma tranche d'imposition" si absent.

### Notes techniques
- Les `check()` lisent les champs disponibles dans `profiles` (income_range, family_status, children_count, is_homeowner, professional_status, age_range, etc.). Quand un champ critique manque → status `needs_info` + `missing_fields`.
- Pas de nouvelle table, pas de migration.
- Lovable AI gateway déjà configuré, on n'y touche pas.
- Disclaimer présent dans les rich views (estimations indicatives).
