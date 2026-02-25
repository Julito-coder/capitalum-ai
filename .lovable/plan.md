

# Plan : Hub central des formulaires avec stockage et suivi des brouillons

## Objectif

Transformer la page Formulaires en hub central ou tous les brouillons et formulaires finalises sont visibles, avec progression detaillee, quel que soit leur point d'origine (calendrier, dashboard, acces direct).

## Constat actuel

- La page Formulaires charge deja les brouillons depuis `tax_form_2086_drafts`, donc les formulaires demarres depuis le calendrier apparaissent deja (meme table).
- Mais les informations affichees sont minimales : juste l'annee, le statut et la date de modification.
- Pas de progression (etape en cours, nombre de transactions, comptes).
- Pas de separation entre brouillons en cours et formulaires finalises/reportes.
- Le bouton "Reprendre" pointe vers `/crypto/2086` (le dashboard) au lieu du wizard directement.

## Modifications prevues

### A. Enrichir les donnees chargees dans Formulaires.tsx

Charger en plus pour chaque brouillon :
- `current_step` et `form_data` (pour la progression et le snapshot de calcul)
- Le nombre de transactions (`crypto_transactions` count par user + tax_year)
- Le nombre de comptes (`crypto_accounts` count par user + tax_year)

### B. Separer les brouillons en deux sections

1. **En cours** : status = `draft` ou `review` — avec bouton "Reprendre" qui pointe vers `/crypto/2086/wizard`
2. **Finalises** : status = `ready`, `reported`, `archived` — avec boutons "Voir" et "Exporter PDF"

### C. Carte de brouillon enrichie

Chaque carte de brouillon affichera :
- Titre : "2086 — Crypto {annee}"
- Badge de statut (Brouillon, En revue, Pret, Reporte, Archive)
- Barre de progression (etape X/6)
- Compteurs : X comptes, Y transactions
- Resultat fiscal si disponible (case 3AN / 3BN depuis `form_data.calcSnapshot`)
- Date de derniere modification
- Actions : Reprendre (brouillons) / Voir + Exporter (finalises) / Supprimer

### D. Bouton "Reprendre" corrige

Pointer vers `/crypto/2086/wizard` au lieu de `/crypto/2086` pour atterrir directement dans le wizard a l'etape en cours.

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/Formulaires.tsx` | Refonte complete de la section brouillons : enrichissement des donnees, separation en cours/finalises, cartes detaillees avec progression, compteurs et resultat fiscal |

## Detail technique

### Requete enrichie

```text
// Charger les drafts avec current_step et form_data
.select('id, tax_year, status, updated_at, regime, notes, current_step, form_data')

// + compter transactions et comptes par tax_year
const txCounts = await supabase
  .from('crypto_transactions')
  .select('tax_year', { count: 'exact', head: true })
  .eq('user_id', user.id)

const accCounts = await supabase
  .from('crypto_accounts')
  .select('tax_year', { count: 'exact', head: true })
  .eq('user_id', user.id)
```

### Separation des sections

```text
const inProgressDrafts = drafts.filter(d => ['draft', 'review'].includes(d.status))
const completedDrafts = drafts.filter(d => ['ready', 'reported', 'archived'].includes(d.status))
```

### Carte enrichie

Chaque carte affiche :
- Barre `Progress` basee sur `(current_step + 1) / 6 * 100`
- Compteurs de transactions/comptes
- Si `form_data.calcSnapshot` existe : afficher case3AN et case3BN
- Bouton principal : "Reprendre l'etape X" pour les brouillons, "Voir le resume" pour les finalises

### Export depuis la page Formulaires

Pour les formulaires finalises, un bouton "Exporter PDF" declenchera le meme code que `CryptoExports.tsx` (appel a `exportCrypto2086Pdf`) directement depuis cette page, sans avoir a naviguer dans le wizard.

## Impact

- Tous les formulaires (peu importe leur origine) sont centralises et visibles
- L'utilisateur voit clairement ou il en est dans chaque brouillon
- Les formulaires termines sont archives et re-exportables
- Navigation directe vers le wizard pour reprendre le travail
