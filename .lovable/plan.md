

# Plan : Onboarding public avant authentification

## Objectif

Le quiz onboarding devient la landing page (`/`). Tous les visiteurs passent le diagnostic **sans être connectés**. A la fin du quiz (ecran Score), deux options :
- "Creer mon compte" → redirige vers `/auth` avec les donnees du quiz en memoire
- "J'ai deja un compte" → lien discret en bas qui mene vers `/auth`

Apres inscription/connexion, les resultats du quiz sont automatiquement sauvegardes dans le profil.

## Architecture

```text
Visiteur → / (quiz public, pas d'auth requise)
         → Score affiché
         → "Créer mon compte" → /auth (signup)
         → Après auth → sauvegarde quiz data → /dashboard
         
Visiteur → / (quiz)
         → "J'ai déjà un compte" → /auth (login)
         → Après auth → sauvegarde quiz data si présente → /dashboard
```

## Modifications

### 1. Stockage temporaire des resultats quiz

Les donnees du quiz sont stockees dans `localStorage` sous la cle `elio_quiz_data` (JSON serialise de `ModernOnboardingData` + `ElioScoreResult`). Cela permet de survivre a la navigation vers `/auth` et au reload apres confirmation email.

### 2. Refonte du routing (`App.tsx`)

- `/` → affiche le quiz public (`ModernOnboardingWizard`) si l'utilisateur n'est **pas** connecte, sinon redirige vers `/dashboard`
- `/dashboard` → nouvelle route protegee (remplace l'ancien `/` protege) pour la `HomePage`
- `/onboarding` → supprime (plus necessaire, le quiz est sur `/`)
- `/auth` → reste public
- Toutes les autres routes restent protegees avec `ProtectedRoute`

### 3. Refonte du `ModernOnboardingWizard`

- Supprimer la dependance a `useAuth()` — le wizard fonctionne sans utilisateur connecte
- Au lieu de `handleComplete` qui sauvegarde en DB, le wizard :
  1. Stocke les donnees + score dans `localStorage`
  2. Navigue vers `/auth`
- Le bouton principal sur l'ecran Score devient "Creer mon compte gratuitement"
- Ajouter un lien "J'ai deja un compte" en bas de l'ecran Score

### 4. Refonte du `ScoreResultStep`

- Props : `onCreateAccount` (au lieu de `onComplete`) + `onLogin` (au lieu de `onSkip`)
- Bouton primaire : "Creer mon compte" → stocke dans localStorage puis navigue vers `/auth?tab=signup`
- Lien secondaire : "J'ai deja un compte" → navigue vers `/auth?tab=login`
- Garder le bouton "Partager mon score"

### 5. Sauvegarde automatique apres auth (`ProtectedRoute` ou `Auth.tsx`)

Apres connexion/inscription reussie :
1. Verifier si `localStorage` contient `elio_quiz_data`
2. Si oui, appeler `saveModernOnboarding(user.id, quizData, false)` 
3. Supprimer `elio_quiz_data` du localStorage
4. Rediriger vers `/dashboard`

Cette logique sera placee dans un nouveau hook `usePostAuthQuizSync` appele dans `ProtectedRoute`.

### 6. Adaptation du `ProtectedRoute`

- Ne plus rediriger vers `/onboarding` si onboarding non complete (le quiz est maintenant public)
- Apres login, si quiz data en localStorage → sauvegarder puis rediriger vers `/dashboard`
- Si pas de quiz data et onboarding non complete → laisser passer (l'utilisateur a pu creer un compte sans faire le quiz, on ne bloque pas)

### 7. Page `Auth.tsx`

- Lire le query param `?tab=signup|login` pour pre-selectionner l'onglet
- Apres auth reussie, rediriger vers `/dashboard` (plus vers `/`)

## Fichiers touches

| Fichier | Action |
|---------|--------|
| `src/App.tsx` | Nouveau routing : `/` public, `/dashboard` protege |
| `src/components/onboarding/modern/ModernOnboardingWizard.tsx` | Supprimer dependance auth, stocker en localStorage |
| `src/components/onboarding/modern/ScoreResultStep.tsx` | Nouveaux boutons "Creer compte" + "J'ai un compte" |
| `src/components/auth/ProtectedRoute.tsx` | Supprimer logique onboarding, ajouter sync quiz post-auth |
| `src/pages/Auth.tsx` | Lire `?tab`, rediriger vers `/dashboard` |
| `src/pages/Onboarding.tsx` | Supprime (ou redirige vers `/`) |
| `src/hooks/usePostAuthQuizSync.ts` | Nouveau hook : sync localStorage → Supabase apres login |

## Securite

- Les donnees du quiz en localStorage sont non sensibles (statut pro, tranche revenus, etc.)
- La sauvegarde en DB ne se fait qu'apres authentification reelle
- RLS sur `profiles` reste inchange (user ne peut modifier que son propre profil)

