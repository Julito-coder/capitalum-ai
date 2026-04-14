

# Plan : Calendrier prédictif — Vue calendrier sobre

## Objectif

Remplacer la page calendrier actuelle (liste de cards avec vues Chronologique/Strategique/Urgent) par une **vraie vue calendrier mensuel** avec grille de jours, navigation mois par mois sur un an roulant, et affichage des echeances sous forme de pastilles/points sur les jours concernes. Un tap sur un jour avec echeance(s) ouvre le detail en bas.

## UX cible

- **Vue principale** : grille calendrier du mois en cours (lun-dim, 7 colonnes)
- **Navigation** : fleches gauche/droite pour naviguer mois par mois, limite a 12 mois dans le futur a partir d'aujourd'hui
- **Indicateurs sur les jours** : petit dot colore sous le numero du jour (couleur selon urgence : rouge/ambre/bleu/gris)
- **Section basse** : quand on tape un jour, la liste des echeances de ce jour s'affiche en dessous du calendrier. Si aucune echeance selectionnee, afficher les prochaines echeances du mois
- **Header** : titre "Calendrier" + mois/annee en cours, simple et epure
- **Pas de score bar, pas de view selector, pas de gamification** — juste le calendrier + les echeances

## Structure technique

### Fichier modifie : `src/pages/Calendar.tsx`
Refonte complete :
- Header simple : icone Calendar + "Calendrier"
- Navigation mois : bouton ChevronLeft / ChevronRight + label "Avril 2026"
- Grille calendrier custom (pas le DayPicker de shadcn qui est trop petit/datepicker) : 7 colonnes, lignes de semaines, chaque cellule = numero du jour
- Jours avec echeances : dot colore (urgency color) sous le numero
- Tap sur un jour → `selectedDate` state → affiche les echeances de ce jour en dessous
- Vue par defaut : echeances du mois courant listees en bas
- Conservation de la logique existante : `loadData`, `getEnrichedDeadlines`, `fetchUserTracking`, `toDeadlineProfile`
- Conservation du `DeadlineActionPanel` pour le detail d'une echeance
- Limite navigation : mois courant → +12 mois

### Pas de nouveau fichier a creer
Le composant calendrier sera inline dans Calendar.tsx (simple grille Tailwind, pas besoin d'un composant separe complexe).

### Fichiers conserves sans modification
- `src/lib/deadlinesData.ts` — donnees d'echeances
- `src/lib/deadlinesService.ts` — service de chargement
- `src/lib/deadlinesTypes.ts` — types
- `src/components/calendar/DeadlineCard.tsx` — carte d'echeance (reutilisee)
- `src/components/calendar/DeadlineActionPanel.tsx` — panneau d'action (reutilise)

### Fichiers qui ne seront plus importes dans Calendar.tsx
- `CalendarViewSelector` (supprime de l'import)
- `OptimizationScoreBar` (supprime de l'import)

## Design

- Fond `bg-background` (#FAFAF7)
- Grille : cellules de ~48px, numero en `text-sm`, jour actuel = cercle `bg-primary text-white`
- Dots echeances : 6px de diametre, couleur mappee depuis `URGENCY_CONFIG` (destructive/warning/info/muted)
- Jours hors mois : `opacity-30`
- Jour selectionne : `bg-primary/10 border border-primary/30 rounded-lg`
- Labels jours de la semaine : `text-xs text-muted-foreground font-medium`
- Navigation mois : `text-lg font-semibold` pour le label, boutons ChevronLeft/Right en `text-muted-foreground`
- Section echeances du jour : sous le calendrier, liste de `DeadlineCard` avec un titre "Echeances du [date]" ou "Echeances de [mois]"
- Animation : `framer-motion` fade sur le changement de mois

