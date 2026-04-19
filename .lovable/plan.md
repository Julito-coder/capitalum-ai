

# Plan : Coach fiscal — Feed proactif de recommandations (F11)

## Objectif

Creer une page `/coach` (et un onglet/section dans Home) qui affiche un **feed vertical de recommandations fiscales personnalisees**, chacune avec un gain estime en euros, un effort, une deadline, et un CTA vers une action concrete. Persistance du statut (acceptee, ignoree, faite) en DB pour mesurer la valeur recuperee dans le temps — c'est le hook qui justifie le premium ("Elio m'a fait gagner 800€/an").

## Architecture

```text
┌─────────────────────────────────────────┐
│ Coach fiscal                            │
│ "Elio te fait gagner 1 240€/an"         │← compteur viral
├─────────────────────────────────────────┤
│ [Tab: A faire] [Faites] [Ignorees]      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🔥 PER avant 31/12  +420€/an        │ │
│ │ Verse 2 000€ avant fin d'annee...   │ │
│ │ [Voir le guide] [Plus tard] [✕]     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 💼 Frais reels  +180€/an            │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Fichiers a creer/modifier

### 1. Migration DB — `user_recommendations`
Nouvelle table pour persister le statut de chaque reco par utilisateur :
- `id`, `user_id`, `recommendation_key` (string stable, ex: `pee-perco`)
- `status` : `pending | accepted | dismissed | completed`
- `estimated_gain` (numeric), `accepted_at`, `completed_at`, `dismissed_reason`
- RLS : user owns rows. Realtime active.

### 2. `src/lib/coachService.ts` — Moteur du coach
- Reutilise `calculateDashboardMetrics` pour generer les recos.
- **Etend** la liste de recos (plus exhaustive que les 3 actuelles) :
  - PER avant 31/12 (basee sur TMI estimee)
  - Frais reels vs 10%
  - PEE/PERCO abondement
  - Transfert CTO → PEA
  - Declaration crypto 2086
  - Passage micro → reel
  - Quotient familial PACS/mariage si couple non declare
  - Garde d'enfants (CMG / credit impot 50%)
  - Don deductible (66%)
  - Investissement PME/FCPI (reduction IR)
- Croise chaque reco avec la table `user_recommendations` pour determiner le statut.
- `getCoachFeed(userId)` retourne `{ totalAnnualGain, pending[], completed[], dismissed[] }`.
- `acceptRecommendation`, `dismissRecommendation`, `markCompleted`.

### 3. `src/pages/Coach.tsx` — Page feed
- Header : "Elio te fait gagner X €/an" (somme des recos `pending` + `accepted`)
- 3 tabs : **A faire** (pending+accepted) / **Faites** / **Ignorees**
- Liste verticale de `RecommendationCard` (composant existant, deja tres bien)
- Empty state : "Profil complet, aucune optimisation detectee. Reviens dans 1 mois."
- Banner si profil incomplet → CTA `/profil/fiscal`

### 4. `src/components/coach/CoachRecoCard.tsx` — Carte enrichie
- Reutilise le visuel de `RecommendationCard` existant, ajoute :
  - Bouton `Voir le guide` → ouvre le `ActionGuideModal` existant si guide dispo, sinon lien externe
  - Bouton `Plus tard` (snooze 30j)
  - Bouton `✕` Ignorer (avec micro-form raison optionnelle)
  - Badge urgence si deadline < 30j (rouge) ou < 90j (orange)
  - Badge "Premium" sur les recos > €500/an si user gratuit (via `PremiumGate`)

### 5. Integration Home (`src/pages/Home.tsx`)
- Remplacer la section `actions` par un teaser : 3 premieres recos + CTA "Voir le coach (12 actions)".

### 6. Navigation
- `src/App.tsx` : ajouter route `/coach`
- `src/pages/Outils.tsx` : ajouter carte "Coach fiscal" avec icone `Sparkles`
- Optionnel : badge sur le tab Outils (BottomNav) avec le nombre de recos pending

### 7. Notifications (lien feature persistante existante)
- A chaque generation de recos, syncroniser via `syncDashboardAlerts` deja existant pour les recos urgentes (deadline < 30j).
- Les notifications pointent vers `/coach`.

## Details techniques

- **Pas de mock** : tout vient du profil reel + `user_recommendations` table.
- **Mobile-first** : feed vertical 1 colonne, cards `p-4`, Sora, design system Elio.
- **Disclaimer obligatoire** en bas de page.
- **Realtime** : sub Supabase sur `profiles` + `user_recommendations` pour rafraichir le feed.
- **Tracking gain recupere** : la somme des recos `completed` sera affichee plus tard sur le dashboard ("Tu as recupere 640€ avec Elio").
- **Pas de reecriture** des moteurs `dashboardService.ts`, `taxOptimizationEngine.ts` — on les consomme.

