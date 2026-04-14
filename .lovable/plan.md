

# Plan : Detecteur d'aides non reclamees — Vue Kanban

## Objectif

Creer une page dediee `/outils/aides` qui affiche toutes les aides sociales et fiscales francaises sous forme de **tableau Kanban** avec 3 colonnes : "Eligible", "A verifier", "Non concerne". Les aides sont filtrees automatiquement en fonction du profil fiscal de l'utilisateur. Chaque carte d'aide affiche le montant estimable, les conditions d'eligibilite, et un CTA pour demarrer les demarches.

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│  Detecteur d'aides        [Profil incomplet? Banner]│
├──────────────┬──────────────┬───────────────────────┤
│  Eligible    │  A verifier  │  Non concerne         │
│  (vert)      │  (orange)    │  (gris, collapsed)    │
├──────────────┼──────────────┼───────────────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐          │
│ │ APL      │ │ │ CSS      │ │ │ RSA      │          │
│ │ ~3600€/an│ │ │ Verifier │ │ │ Non elig.│          │
│ │ [Faire]  │ │ │ [Profil] │ │ └──────────┘          │
│ └──────────┘ │ └──────────┘ │                       │
└──────────────┴──────────────┴───────────────────────┘
```

## Fichiers a creer/modifier

### 1. `src/lib/aidesData.ts` — Catalogue des aides
Liste exhaustive des aides nationales avec pour chaque aide :
- `key`, `title`, `description`, `category` (logement, famille, emploi, sante, energie, education, investissement)
- `estimateAmount(profile)` — calcul du montant estime
- `eligibilityCheck(profile)` — retourne `'eligible' | 'to_verify' | 'not_eligible'`
- `conditions` — texte lisible des criteres
- `applicationUrl` — lien officiel (caf.fr, ameli.fr, etc.)
- `applicationSteps` — etapes pour s'inscrire

Aides codees (basees sur le diagnosticEngine existant + extensions) :
- **Logement** : APL, aide demenagement
- **Famille** : Allocations familiales, ARS, CMG (garde enfants), prime naissance
- **Emploi** : Prime d'activite, RSA, aide retour emploi
- **Sante** : CSS (Complementaire sante solidaire)
- **Energie** : Cheque energie, MaPrimeRenov'
- **Education** : Bourse CROUS, aide au permis
- **Investissement** : PER deduction, credit impot emploi domicile

### 2. `src/lib/aidesService.ts` — Moteur de detection
- `loadAidesForUser(userId)` — charge le profil depuis Supabase, croise avec le catalogue, retourne les aides classees en 3 colonnes
- Reutilise `loadUserProfile` de `dashboardService.ts` + les champs du profil fiscal
- Gere le cas profil incomplet (champs manquants → colonne "A verifier")

### 3. `src/pages/AidesDetector.tsx` — Page Kanban
- 3 colonnes responsive (mobile : tabs horizontaux, desktop : 3 colonnes cote a cote)
- Chaque carte d'aide : titre, montant estime, badge categorie, conditions resumees, CTA principal
- Banner en haut si profil incomplet avec lien vers `/profil/fiscal`
- Total des aides eligibles affiche en gros en haut (hook viral)
- Animation Framer Motion sur les cartes

### 4. `src/components/aides/AideCard.tsx` — Composant carte
- Affiche : icone categorie, titre, montant, conditions, statut
- CTA : "Faire ma demande" (lien externe) ou "Completer mon profil" (navigation interne)
- Design system strict : couleurs Elio, border-radius 12px, shadow-sm

### 5. Modifications existantes
- `src/App.tsx` : ajouter route `/outils/aides`
- `src/pages/Outils.tsx` : ajouter la carte "Detecteur d'aides" avec icone `HandCoins`

## Details techniques

- **Pas de nouvelle table DB** : les aides sont calculees a la volee depuis le profil existant. Le profil est deja dans `profiles`.
- **Mobile-first** : sur mobile, les 3 colonnes deviennent des tabs swipables (Eligible / A verifier / Non concerne)
- **Lien coffre-fort** : si un document dans le coffre-fort mentionne une aide (ex: attestation CAF), on peut afficher un badge "Document trouve"
- **Reactif au profil** : comme le calendrier, la page se rafraichit si le profil change (realtime Supabase deja configure)

## Aides a coder en V1 (10 aides nationales)

| Aide | Critere principal | Montant type |
|---|---|---|
| APL | Locataire + revenu < seuil | 200-400€/mois |
| Prime d'activite | Salarie/independant + revenu 1000-1800€/mois | 100-250€/mois |
| CSS | Revenu < 12000€ (seul) | ~600€/an |
| ARS | Enfants 6-18 ans + revenu < seuil | 400-450€/enfant |
| Cheque energie | Revenu < 11000€ (seul) | 48-277€/an |
| Allocations familiales | 2+ enfants | 141-322€/mois |
| Bourse CROUS | Etudiant + revenu < seuil | 100-500€/mois |
| MaPrimeRenov' | Proprietaire | 2000-10000€ |
| RSA | Sans emploi + revenu < 7000€ | ~600€/mois |
| Credit impot emploi domicile | Revenu > 26000€ | 50% depenses |

