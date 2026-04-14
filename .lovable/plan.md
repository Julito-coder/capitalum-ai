

# Plan : Ajouter les échéances étudiantes au calendrier prédictif

## Modifications

### 1. `src/lib/deadlinesTypes.ts` — Ajouter le flag étudiant
Ajouter `isStudent: boolean` dans l'interface `DeadlineUserProfile`.

### 2. `src/lib/deadlinesService.ts` — Mapper le flag
Dans `toDeadlineProfile`, mapper `isStudent` depuis le profil utilisateur (via `fiscalStatus === 'student'` ou équivalent du profil).

### 3. `src/lib/dashboardService.ts` — Ajouter `isStudent` au UserProfile
Ajouter la propriété au type et au chargement du profil.

### 4. `src/lib/deadlinesData.ts` — Ajouter 5 échéances étudiantes

| Échéance | Date | Catégorie | Condition |
|---|---|---|---|
| **Bourse CROUS — Dépôt DSE** | 15 mai | administratif | `isStudent` |
| **Bourse CROUS — Versement rentrée** | 5 sept | administratif | `isStudent` |
| **APL étudiant — Demande CAF** | 1er sept | administratif | `isStudent` |
| **CVEC — Paiement** | 1er sept | administratif | `isStudent` |
| **Parcoursup — Confirmation vœux** | 2 avril | administratif | `isStudent \|\| childrenCount > 0` |

Chaque échéance inclut :
- `computePersonalImpact` avec montants réalistes (bourse ~500€/mois, APL ~200€/mois, CVEC 103€)
- Liens externes vers les plateformes officielles (messervices.etudiant.gouv.fr, caf.fr, cvec.etudiant.gouv.fr, parcoursup.fr)
- Actions : guide, lien externe, navigation vers le profil

### Pas de migration DB nécessaire
Le flag `isStudent` est dérivé du `fiscalStatus` déjà stocké dans le profil. Pas de nouvelle colonne.

