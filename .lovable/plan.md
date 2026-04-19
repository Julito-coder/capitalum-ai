

# Plan : F5 — Hub Simulateurs de vie (PACS, Freelance, Immo)

## Contexte

Le simulateur immobilier (`/simulator`) et le simulateur d'épargne (`/savings-simulator`) existent déjà avec des moteurs matures (`simulationEngine.ts` 643L, `statusCalculations.ts` 436L). Il manque :
1. Un **hub unifié** `/simulateurs` qui regroupe les simulateurs de vie
2. Un simulateur **PACS/Mariage** (n'existe pas)
3. Un simulateur **Passage freelance** (le moteur `statusCalculations.ts` existe mais aucune UI dédiée — uniquement `Simulator.tsx` qui est un mini-comparateur d'optimisation)

V1 = ces 3 simulateurs. Reste du backlog (succession, expatriation, retraite…) → V2.

## Architecture

```text
/simulateurs                    → Hub avec 3 cards
  ├─ /simulateurs/pacs          → PACS / Mariage (nouveau)
  ├─ /simulateurs/freelance     → CDI vs Freelance (nouveau, consomme statusCalculations)
  └─ /simulator                 → Immobilier (existant, juste relié)
```

## Fichiers à créer / modifier

### 1. Moteur PACS — `src/lib/pacsCalculations.ts` (nouveau)
Fonctions pures :
- `calculateIR(income, parts)` — barème 2025 progressif
- `calculateParts(status, children, parentIsole)` — quotient familial
- `applyDecote(ir, status)` — décote 2025
- `applyQFCeiling(irBefore, irAfter, parts)` — plafonnement QF
- `compareSeparateVsJoint(input)` → `{ separateIR, jointIR, savings, recommendation }`

Inputs : `revenuA`, `revenuB`, `enfants`, `parentIsoleAvant`, `pensionVersee`, `pensionRecue`.

### 2. Page PACS — `src/pages/simulators/PacsSimulator.tsx` (nouveau)
Form mobile-first 1 colonne :
- 2 sliders revenus (A et B), nombre enfants, toggle parent isolé, pensions
- Card résultat : IR séparé / IR commun / **économie en €** (gros chiffre vert)
- Recommandation textuelle ("Le PACS te ferait gagner 1 240€/an")
- Note année N (option déclaration séparée la 1re année)
- Disclaimer

### 3. Page Freelance — `src/pages/simulators/FreelanceSimulator.tsx` (nouveau)
Consomme `calculateAllStatuses` existant. UI :
- Inputs : CA prévisionnel, type activité (BIC vente/service/BNC), charges, TMI, ACRE, situation famille
- Toggle "Comparer avec mon CDI actuel" → input salaire brut → calcul net après IR via barème
- Tableau comparatif : **CDI / Micro / EURL-IR / SASU** avec net après impôts, charges sociales, points forts/faibles
- Alerte coûts cachés (comptable, CFE, RC pro, perte ARE)
- CTA "Voir le détail" par statut → expand card

### 4. Hub — `src/pages/Simulateurs.tsx` (nouveau)
3 cards (PACS, Freelance, Immo) avec icône, baseline, gain potentiel type, CTA.

### 5. Routing & nav
- `src/App.tsx` : ajouter `/simulateurs`, `/simulateurs/pacs`, `/simulateurs/freelance`
- `src/pages/Outils.tsx` : remplacer la card "Simulateur immobilier" par une card unique "Simulateurs de vie" → `/simulateurs`

## Détails techniques

- **Réutilisation** : `calculateAllStatuses` (statusCalculations.ts), `formatCurrency` (mockData)
- **Barème IR 2025** : tranches 0 / 11 294 / 28 797 / 82 341 / 177 106 (déjà dans `coachService` et `statusCalculations`, on extrait dans `pacsCalculations`)
- **Pas de DB** : simulateurs stateless, pas de persistance V1 (résultats live)
- **Design system strict** : Sora, couleurs Élio, cards radius 12, p-4
- **Mobile-first** : sliders tactiles, résultat sticky en bas sur mobile
- **Disclaimer** obligatoire en bas de chaque page
- **Tutoiement** systématique
- **Vocabulaire grand public** : "ta tranche d'imposition" pas "TMI", "tes cotisations" pas "charges TNS"

## Hors scope (V2)

Succession/donation, expatriation, retraite/rachat trimestres, stock-options/BSPCE, démembrement, dispositifs Pinel/Malraux. Le simulateur immo n'est PAS modifié — juste relié au hub.

