

# Plan : Quiz fullscreen "Tinder-style" + questions enrichies

## Objectif

3 changements majeurs :
1. **"J'ai deja un compte"** visible des le WelcomeStep (pas seulement sur le score)
2. **Format Tinder** : chaque question = plein ecran avec 4 grosses cartes qui occupent tout l'espace. Un tap = on passe a la suivante
3. **Plus de questions** pour un scoring plus precis et viable

## Nouvelles questions (10 ecrans au lieu de 8)

| # | Ecran | Question | Format | Valeur |
|---|-------|----------|--------|--------|
| 0 | Welcome | Intro + CTA + lien "J'ai deja un compte" | - | - |
| 1 | Age | Tu as quel age ? | 4 cartes 2x2 | `ageRange` |
| 2 | Situation pro | Quelle est ta situation ? | 4 cartes 2x2 (on fusionne student+job_seeker en "sans emploi") | `professionalStatus` |
| 3 | Famille | Ta situation familiale ? | 4 cartes 2x2 | `familyStatus` |
| 4 | Enfants | Tu as des enfants a charge ? | 4 cartes 2x2 (aucun / 1 / 2 / 3+) | `childrenCount` |
| 5 | Logement | Tu es… | 4 cartes 2x2 (locataire / proprio accedant / proprio sans credit / heberge) | `housingStatus` |
| 6 | Revenus | Tes revenus nets mensuels ? | 4 cartes 2x2 (< 1500 / 1500-2500 / 2500-4000 / 4000+) | `incomeRange` |
| 7 | Epargne | Tu as de l'epargne placee ? | 4 cartes 2x2 (non / < 10k / 10k-50k / 50k+) | `savingsRange` (NEW) |
| 8 | Impots | Tu declares tes impots… | 4 cartes 2x2 (seul en ligne / avec un comptable / je ne declare pas encore / je ne sais pas) | `taxDeclarationMode` (NEW) |
| 9 | Score | Resultat anime | - | - |

## Modifications techniques

### 1. Types (`modernOnboardingTypes.ts`)
- Changer `ChildrenRange` → valeurs `'none' | '1' | '2' | '3_or_more'` (4 options au lieu de 3)
- Changer `IncomeRange` → 4 tranches au lieu de 5 : `'less_1500' | '1500_2500' | '2500_4000' | 'more_4000'`
- Ajouter `SavingsRange = 'none' | 'less_10k' | '10k_50k' | 'more_50k'`
- Ajouter `TaxDeclarationMode = 'online_self' | 'accountant' | 'not_yet' | 'unknown'`
- Ajouter `savingsRange` et `taxDeclarationMode` au `ModernOnboardingData`
- Changer `HousingStatus` → `'tenant' | 'owner_mortgage' | 'owner_paid' | 'hosted'`

### 2. UI Tinder-style (tous les step components)
Chaque ecran de question :
- Plein ecran (`min-h-[calc(100vh-80px)]` pour laisser la progress bar)
- Titre en haut
- **4 cartes en grille 2x2** qui occupent tout l'espace disponible (`flex-1`)
- Chaque carte : icone/emoji + label, hauteur egale, `aspect-square` ou `flex-1`
- Tap = selection + auto-advance 300ms
- Pas de scroll, tout visible d'un coup

### 3. WelcomeStep
- Ajouter lien "J'ai deja un compte" en bas de l'ecran, style discret (text-sm text-muted-foreground)

### 4. Scoring engine enrichi (`scoreElioEngine.ts`)
- Integrer `savingsRange` : pas d'epargne = +400 contrats, < 10k sans PEA = +300 fiscal
- Integrer `taxDeclarationMode` : "je ne sais pas" ou "not_yet" = +600 fiscal, "online_self" sans comptable et revenus > 2500 = +420
- Ajuster `childrenCount` avec les 4 valeurs
- Ajuster `housingStatus` : proprio avec credit = taxe fonciere + interets deductibles potentiels (+400), proprio sans credit = taxe fonciere seule (+300)
- Ajuster `incomeRange` pour les 4 nouvelles tranches
- Augmenter `maxLoss` a 10000 pour refleter les nouvelles dimensions

### 5. ModernOnboardingWizard
- 10 etapes (welcome + 8 questions + score)
- Nouveaux steps : `SavingsStep`, `TaxDeclarationStep`
- Passer `onLogin` au `WelcomeStep`

### 6. Sauvegarde (`modernOnboardingService.ts`)
- Mapper les nouveaux champs vers le profil Supabase (columns existantes : `patrimony_range` pour savings, ajouter `tax_declaration_mode` si necessaire ou stocker en metadata)

## Fichiers touches

| Fichier | Action |
|---------|--------|
| `src/data/modernOnboardingTypes.ts` | Nouveaux types + champs |
| `src/lib/scoreElioEngine.ts` | Scoring enrichi avec savings + tax mode |
| `src/components/onboarding/modern/WelcomeStep.tsx` | Ajouter lien "J'ai deja un compte" |
| `src/components/onboarding/modern/ProfileStep.tsx` | Format 2x2 fullscreen |
| `src/components/onboarding/modern/ProfessionalStep.tsx` | 4 options en 2x2 fullscreen |
| `src/components/onboarding/modern/FamilyHousingStep.tsx` | 2x2 fullscreen |
| `src/components/onboarding/modern/ChildrenStep.tsx` | 4 options en 2x2 fullscreen |
| `src/components/onboarding/modern/HousingStep.tsx` | 4 options en 2x2 fullscreen |
| `src/components/onboarding/modern/RevenueStep.tsx` | 4 tranches en 2x2 fullscreen |
| `src/components/onboarding/modern/SavingsStep.tsx` | Nouveau — epargne placee |
| `src/components/onboarding/modern/TaxDeclarationStep.tsx` | Nouveau — mode de declaration |
| `src/components/onboarding/modern/ModernOnboardingWizard.tsx` | 10 etapes, passer onLogin au welcome |
| `src/lib/modernOnboardingService.ts` | Mapper nouveaux champs |

