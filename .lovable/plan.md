

# Plan : Quiz onboarding swipeable avec Score Elio

## Contexte

L'onboarding existant a deja 7 etapes (welcome, profile, objectives, patrimony, risk, fiscal, summary). Il faut le transformer en un quiz rapide et viral qui calcule un Score Elio et un montant de perte annuelle, avec partage natif.

## Corrections prealables

Les erreurs de build viennent du fait que `Layout` est exporte depuis `Layout.tsx` comme alias mais certains fichiers ne l'importent pas. Verification faite : les fichiers utilisent deja `AppLayout` correctement. Il faut simplement s'assurer que le fichier `Layout.tsx` re-exporte bien. Si les erreurs persistent, on ajoutera un import explicite.

## Modifications

### 1. Refonte des types onboarding

Fichier `src/data/modernOnboardingTypes.ts` :
- Ajouter un champ `housingStatus: 'proprietaire' | 'locataire' | null` (cadrage : logement est une question cle pour le calcul des aides APL/taxe fonciere)
- Supprimer `riskTolerance` (pas pertinent pour le diagnostic, c'est un concept investissement)
- Les emojis restent autorises dans l'onboarding (exception explicite dans la charte)

### 2. Refonte des etapes (6 ecrans au lieu de 7)

| Ecran | Contenu | Question |
|-------|---------|----------|
| 1. Welcome | Logo Elio + "Decouvre combien tu perds chaque annee" + CTA | - |
| 2. Situation | Statut pro + tranche d'age | Qui es-tu ? |
| 3. Famille | Situation familiale + logement (proprio/locataire) | Ta situation |
| 4. Revenus | Revenus mensuels nets + patrimoine | Tes finances |
| 5. Fiscal | Declares en France + tranche d'imposition | Tes impots |
| 6. Score | Score Elio anime + montant perdu + breakdown + bouton partage | Resultat |

On supprime l'etape Objectifs et Risk (pas necessaires pour le diagnostic initial). On les deplace dans le profil fiscal detaille.

### 3. Algorithme de calcul du Score Elio

Nouveau fichier `src/lib/scoreElioEngine.ts` :
- Entree : les donnees onboarding
- Calcul deterministe base sur les baremes reels :
  - **Aides non reclamees** : selon revenus, famille, logement (APL ~250EUR/mois si locataire + revenus < 3000EUR, prime d'activite ~147EUR/mois si salarie + revenus 1500-3000EUR, CSS si < 1500EUR, cheque energie ~150EUR/an)
  - **Erreurs fiscales potentielles** : selon statut pro (frais reels pour salaries, regime reel vs micro pour independants)
  - **Optimisations manquees** : PER non ouvert, pas de PEA, assurance vie non optimisee
- Score = 100 - (penalites par categorie)
- Sortie : `{ score: number, totalLoss: number, breakdown: { label: string, amount: number }[] }`

### 4. Ecran Score (remplacement du SummaryStep)

Nouveau composant `src/components/onboarding/modern/ScoreResultStep.tsx` :
- Cercle anime Score Elio (reutilise `ScoreElio.tsx`)
- Montant en gros : "Tu perds environ X EUR/an"
- Breakdown en 2-3 lignes (aides, fiscal, contrats)
- Bouton "Partager mon score" (Web Share API avec fallback clipboard)
- Bouton primaire "Decouvrir mes actions"
- Disclaimer en footer

### 5. Refonte du Wizard

`ModernOnboardingWizard.tsx` :
- 6 etapes au lieu de 7
- Navigation swipe avec `framer-motion` (drag horizontal, seuil 50px)
- Transitions x: 100 -> 0 -> -100 pour le swipe feel
- Progress bar animee
- Auto-advance quand toutes les selections d'un ecran sont faites (optionnel, delay 400ms)

### 6. Fix build errors

Verifier et corriger tout import `Layout` residuel dans Calendar, FiscalProfile, Scanner, Settings en s'assurant que `AppLayout` est bien importe.

## Fichiers touches

- `src/data/modernOnboardingTypes.ts` — ajout housingStatus, suppression risk
- `src/lib/scoreElioEngine.ts` — nouveau, algorithme de scoring
- `src/components/onboarding/modern/ModernOnboardingWizard.tsx` — refonte 6 etapes + swipe
- `src/components/onboarding/modern/WelcomeStep.tsx` — nouveau CTA "Decouvre combien tu perds"
- `src/components/onboarding/modern/ProfileStep.tsx` — simplifie (situation + age uniquement)
- `src/components/onboarding/modern/FamilyHousingStep.tsx` — nouveau (famille + logement)
- `src/components/onboarding/modern/RevenueStep.tsx` — nouveau (revenus + patrimoine, ex PatrimonyStep)
- `src/components/onboarding/modern/FiscalStep.tsx` — conserve tel quel
- `src/components/onboarding/modern/ScoreResultStep.tsx` — nouveau (score + partage)
- Suppression de `ObjectivesStep.tsx`, `RiskStep.tsx`, `SummaryStep.tsx`
- `src/pages/Calendar.tsx`, `FiscalProfile.tsx`, `Scanner.tsx`, `Settings.tsx` — fix imports si necessaire

