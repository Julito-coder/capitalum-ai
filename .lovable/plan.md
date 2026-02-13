
# Fix: Boucle infinie de l'onboarding

## Probleme identifie

L'analyse des logs reseau montre que :
1. La sauvegarde fonctionne (HTTP 204 a 14:06:59)
2. Les requetes suivantes retournent bien `onboarding_completed: true`
3. **Mais** le `ProtectedRoute` ne redirige jamais DEPUIS `/onboarding` vers `/` quand l'onboarding est deja termine
4. Une condition de course fait que le nouveau composant `ProtectedRoute` sur `/` peut brievement voir un etat `null` avant la requete DB, causant un rebond vers `/onboarding`

## Solution (2 fichiers)

### 1. ProtectedRoute - Redirection bidirectionnelle + support du state de navigation

**Fichier** : `src/components/auth/ProtectedRoute.tsx`

Modifications :
- Ajouter une redirection DEPUIS `/onboarding` vers `/` quand `onboarding_completed === true` (redirection inverse manquante)
- Accepter un flag `onboardingJustCompleted` dans le state de navigation pour court-circuiter la verification DB (evite la condition de course)
- Si le state de navigation indique "onboarding just completed", considerer l'onboarding comme termine immediatement sans attendre la requete DB

```text
Logique actuelle :
  Si !onboardingCompleted ET pathname !== '/onboarding' → rediriger vers /onboarding

Logique corrigee :
  Si onboardingCompleted ET pathname === '/onboarding' → rediriger vers /
  Si navigation state contient onboardingJustCompleted → ne pas verifier la DB
  Si !onboardingCompleted ET pathname !== '/onboarding' → rediriger vers /onboarding
```

### 2. ModernOnboardingWizard - Passer le flag via navigation state

**Fichier** : `src/components/onboarding/modern/ModernOnboardingWizard.tsx`

Modifications :
- Dans `handleComplete` : `navigate('/', { state: { onboardingJustCompleted: true } })`
- Dans `handleSkip` : meme chose
- Cela permet au ProtectedRoute de savoir immediatement que l'onboarding vient d'etre termine, sans attendre la requete DB

## Details techniques

Le flux apres correction :

1. L'utilisateur clique sur "Acceder a mon tableau de bord personnalise"
2. `saveModernOnboarding` sauvegarde avec `onboarding_completed: true` (attend la reponse 204)
3. `navigate('/', { state: { onboardingJustCompleted: true } })` est appele
4. Le `ProtectedRoute` sur `/` detecte le flag dans le state -> affiche le Dashboard immediatement
5. Le useEffect en arriere-plan confirme avec la DB (securite supplementaire)
6. Si un utilisateur arrive sur `/onboarding` avec `onboarding_completed: true` (via URL directe), il est redirige vers `/`

## Impact
- Zero risque de boucle infinie
- Le bouton "Passer" continue de fonctionner (utilise le meme mecanisme)
- Performance : le dashboard s'affiche immediatement sans attente de requete DB
- Retrocompatibilite : les anciens liens fonctionnent toujours
