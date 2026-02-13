
# Plan : Onboarding automatique + Section "Mon profil fiscal" + Pop-up de rappel

## Contexte

Actuellement, le wizard d'onboarding moderne (7 etapes) existe deja dans `src/components/onboarding/modern/`, mais :
- Il n'est pas obligatoire (le dashboard s'affiche meme sans onboarding)
- La section "Mon profil fiscal" detaillee (ancien wizard complet avec identite, famille, salaire, investissements...) a ete remplacee par le wizard simplifie
- La pop-up de rappel ne cible que l'onboarding simplifie, pas le profil fiscal complet

## Ce qui va changer

### 1. Onboarding obligatoire avant le dashboard

**Fichier modifie : `src/components/auth/ProtectedRoute.tsx`**
- Ajouter une verification du statut `onboarding_completed` depuis la table `profiles`
- Si `onboarding_completed === false`, rediriger automatiquement vers `/onboarding` (sauf si on est deja sur `/onboarding`)
- Cela garantit qu'aucun utilisateur ne voit le dashboard sans avoir complete le wizard

**Fichier modifie : `src/components/onboarding/modern/ModernOnboardingWizard.tsx`**
- Retirer le bouton "Passer" sur les etapes essentielles (profil, objectifs, patrimoine)
- Garder le bouton "Passer" uniquement sur l'ecran fiscal (etape 6) et le summary
- S'assurer que `onboarding_completed = true` est bien enregistre a la fin

### 2. Nouvelle page "Mon profil fiscal" (version complete et detaillee)

**Nouveau fichier : `src/pages/FiscalProfile.tsx`**
- Page accessible depuis le menu lateral, avec le Layout standard
- Formulaire avance multi-sections, pre-rempli avec les donnees existantes du profil
- Indicateur de completion en pourcentage (jauge visuelle)
- Sauvegarde partielle possible (pas tout obligatoire d'un coup)

**Sections du profil fiscal (reprenant l'ancien `OnboardingWizard` en version formulaire) :**

| Section | Champs |
|---------|--------|
| Identite | Nom, NIF, annee de naissance, telephone, adresse |
| Situation familiale | Statut, nombre d'enfants, details enfants, revenu conjoint |
| Situation professionnelle | Type(s) de profil (salarie/independant/retraite/investisseur) |
| Revenus salaries | Employeur, contrat, salaire brut/net, primes, 13e mois, heures sup, frais reels, mutuelle, tickets resto, PEE/PERCO, stock-options |
| Activite independante | SIRET, date creation, code APE, statut fiscal, CA HT, charges sociales, loyer bureau, frais vehicule, fournitures, clients principaux |
| Retraite | Pension principale, complementaires, date liquidation, revenus complementaires, plus-values, donations |
| Investissements immobiliers | Biens locatifs, regime, travaux, credit restant, IFI |
| Investissements financiers | PEA, CTO, assurance vie, crypto, SCPI, crowdfunding |
| Consentements | RGPD, analyse IA |

**Nouveau fichier : `src/lib/fiscalProfileService.ts`**
- Fonction `loadFiscalProfile(userId)` : charge toutes les donnees detaillees depuis `profiles`
- Fonction `saveFiscalProfile(userId, data)` : sauvegarde partielle des donnees
- Fonction `calculateProfileCompletion(data)` : calcule le % de completion (nombre de champs remplis / total de champs pertinents selon le type de profil)

**Nouveau fichier : `src/components/fiscal-profile/FiscalProfileForm.tsx`**
- Composant principal avec accordeons/tabs pour chaque section
- Chaque section est un sous-composant reutilisable
- Barre de progression de completion en haut
- Bouton "Enregistrer" par section + bouton global

**Nouveaux sous-composants dans `src/components/fiscal-profile/` :**
- `IdentitySection.tsx`
- `FamilySection.tsx`
- `ProfessionalSection.tsx`
- `EmployeeSection.tsx`
- `SelfEmployedSection.tsx`
- `RetiredSection.tsx`
- `InvestmentRealEstateSection.tsx`
- `InvestmentFinancialSection.tsx`
- `ConsentsSection.tsx`
- `CompletionIndicator.tsx`

### 3. Pop-up de rappel pour le profil fiscal

**Fichier modifie : `src/components/onboarding/modern/ProfileCompletionPopup.tsx`**
- Changer la logique : au lieu de verifier `onboarding_completed`, verifier le % de completion du profil fiscal complet
- Afficher la pop-up si `fiscalProfileCompletion < 100%`
- Afficher uniquement sur le dashboard (pas sur chaque page)
- Rediriger vers `/fiscal-profile` au lieu de `/onboarding`
- Frequence : a chaque visite sur le dashboard si < 100%, mais dismissable pour 7 jours

### 4. Routing et navigation

**Fichier modifie : `src/App.tsx`**
- Ajouter la route `/fiscal-profile` vers la nouvelle page

**Fichier modifie : `src/components/layout/Sidebar.tsx`**
- Remplacer le lien "Mon profil fiscal" qui pointe vers `/onboarding` par un lien vers `/fiscal-profile`
- Garder `/onboarding` reserve au wizard de premiere connexion

**Fichier modifie : `src/components/layout/MobileNav.tsx`**
- Meme mise a jour pour la navigation mobile

### 5. Integration dashboard

**Fichier modifie : `src/pages/Dashboard.tsx`**
- Mettre a jour le bouton "Completer mon profil" pour pointer vers `/fiscal-profile`
- Garder la `ProfileCompletionPopup` qui pointe desormais vers le profil fiscal

## Schema de flux utilisateur

```text
Inscription/Connexion
        |
        v
  onboarding_completed ?
   /              \
  Non              Oui
   |                |
   v                v
 Wizard          Dashboard
 Onboarding        |
 (obligatoire)     |
   |               v
   v          Pop-up rappel
 Dashboard    profil fiscal
   |          (si < 100%)
   v               |
 Menu lateral      v
 "Mon profil   /fiscal-profile
  fiscal"      (formulaire complet)
```

## Details techniques

- **Pas de migration DB necessaire** : tous les champs existent deja dans la table `profiles` (identite, famille, salaire, investissements, etc.)
- **Reutilisation** : les types `OnboardingData` de `src/data/onboardingTypes.ts` et le service `onboardingService.ts` seront reutilises pour le chargement/sauvegarde du profil fiscal complet
- **Calcul de completion** : base sur le nombre de champs significatifs remplis par rapport au type de profil selectionne (un salarie n'a pas besoin de remplir les champs retraite)
- **UX** : le profil fiscal utilise des accordeons Radix UI avec sauvegarde par section, style coherent avec le reste de l'app (cartes arrondies, ombres douces)
- **Pas de duplication de donnees** : le wizard d'onboarding et le profil fiscal ecrivent tous les deux dans la meme table `profiles`, le profil fiscal pre-remplit les valeurs deja saisies lors de l'onboarding

## Fichiers concernes (resume)

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/auth/ProtectedRoute.tsx` |
| Modifier | `src/components/onboarding/modern/ModernOnboardingWizard.tsx` |
| Modifier | `src/components/onboarding/modern/ProfileCompletionPopup.tsx` |
| Modifier | `src/App.tsx` |
| Modifier | `src/components/layout/Sidebar.tsx` |
| Modifier | `src/components/layout/MobileNav.tsx` |
| Modifier | `src/pages/Dashboard.tsx` |
| Creer | `src/pages/FiscalProfile.tsx` |
| Creer | `src/lib/fiscalProfileService.ts` |
| Creer | `src/components/fiscal-profile/FiscalProfileForm.tsx` |
| Creer | `src/components/fiscal-profile/IdentitySection.tsx` |
| Creer | `src/components/fiscal-profile/FamilySection.tsx` |
| Creer | `src/components/fiscal-profile/ProfessionalSection.tsx` |
| Creer | `src/components/fiscal-profile/EmployeeSection.tsx` |
| Creer | `src/components/fiscal-profile/SelfEmployedSection.tsx` |
| Creer | `src/components/fiscal-profile/RetiredSection.tsx` |
| Creer | `src/components/fiscal-profile/InvestmentRealEstateSection.tsx` |
| Creer | `src/components/fiscal-profile/InvestmentFinancialSection.tsx` |
| Creer | `src/components/fiscal-profile/ConsentsSection.tsx` |
| Creer | `src/components/fiscal-profile/CompletionIndicator.tsx` |
