

# Plan : Quiz immersif fullscreen avec cartes animées et auto-advance

## Probleme actuel

Le quiz affiche des options sous forme de liste classique avec un bouton "Continuer" en bas. C'est un formulaire standard, pas une experience immersive. Il faut transformer chaque question en un ecran plein avec des **cartes visuelles animees** qui occupent tout l'espace, et ou un **tap auto-avance** sans bouton.

## Vision UX

Chaque ecran de question = fullscreen. Les options sont des **grosses cartes** avec icone Lucide + label, disposees en grille adaptive :
- **4 options ou moins** → grille 2x2, chaque carte prend ~45% de l'espace disponible
- **5-6 options** → grille 2x3
- **7 options** → grille compacte 2x4 ou liste de cartes larges
- **Multi-select** → cartes larges empilees avec toggle visuel, bouton "Continuer" en bas

**Auto-advance** : sur les questions single-select, un tap sur une carte declenche une micro-animation (scale-up + border primary + check), puis slide vers la question suivante apres 400ms. Pas de bouton "Continuer" sur les single-select.

**Animations** :
- Entree de chaque carte en stagger (50ms entre chaque), fade-in + scale(0.9→1)
- Carte selectionnee : spring scale(1.03) + border glow subtil primary/20 + check icon apparait
- Transition entre questions : slide horizontal fluide 350ms
- Progress bar : animation spring douce

## Fichiers modifies

| Fichier | Action |
|---------|--------|
| `src/components/onboarding/OnboardingQuiz.tsx` | Refonte complete : layout fullscreen, auto-advance sur single-select, bouton "Continuer" uniquement sur multi-select et dernier ecran |
| `src/components/onboarding/QuizOption.tsx` | Refonte complete : cartes fullscreen avec icone Lucide, grid layout, animation stagger, etats visuels riches |
| `src/components/onboarding/QuizStep.tsx` | Ameliorer transitions (spring, drag gesture optionnel) |
| `src/components/onboarding/QuizProgress.tsx` | Animation spring + segment dots |

## Details techniques

### OnboardingQuiz.tsx
- Supprimer le bouton "Continuer" pour les questions single-select et grid
- Ajouter auto-advance : apres selection single, timeout 400ms puis `next()`
- Garder le bouton "Continuer" uniquement pour les questions multi-select
- Le dernier ecran multi-select affiche "Voir mon resultat"
- Layout question : `min-h-screen flex flex-col`, titre en haut (20% ecran), grille d'options au centre (flex-1), padding genereux
- Chaque option dans QUESTIONS recoit un champ `icon` (composant Lucide) en plus du label

### QuizOption.tsx — Nouveau design carte
- **Carte fullscreen** : `rounded-2xl border bg-card p-5 flex flex-col items-center justify-center gap-3`
- Icone Lucide `h-8 w-8` centree au-dessus du label
- Label `text-base font-semibold text-center`
- Subtitle optionnel `text-xs text-muted-foreground`
- Etat selectionne : `border-2 border-primary bg-primary/5 shadow-sm`, icone Check en overlay coin superieur droit
- Animation entree : `motion.div` avec `initial={{ opacity: 0, scale: 0.9 }}` et stagger index
- Animation selection : `whileTap={{ scale: 0.97 }}` + transition spring sur border/background
- Grille adaptative geree par le parent (grid-cols-2, grid-cols-3)

### Icones par question
Chaque option aura une icone Lucide dediee. Exemples :
- Age : `GraduationCap`, `Briefcase`, `Home`, `Heart`, `Sun`
- Situation pro : `Building2`, `Laptop`, `GraduationCap`, `Search`, `Sun`
- Logement : `Key`, `Home`, `CreditCard`, `Users`
- Enfants : chiffres stylises dans les cartes (grid 2x3)

### QuizStep.tsx
- Transition spring au lieu de ease : `type: 'spring', stiffness: 300, damping: 30`
- Support du swipe horizontal (drag gesture) avec `onDragEnd` pour naviguer prev/next

### Multi-select
Pour les 4 questions multi-select (savings, currentAids, lifeEvents, investments) :
- Cartes larges en liste verticale (pas de grille 2x2)
- Toggle visuel : bordure + check, sans checkbox carree
- Bouton "Continuer" sticky en bas, desactive si rien selectionne
- L'option "Aucun" deselectionne les autres (logique existante conservee)

