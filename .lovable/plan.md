

# Plan : Correction du calcul fiscal — Prise en compte des cessions taxables (ventes EUR)

## Probleme identifie

Le moteur de calcul (`portfolioEngine.ts`) et l'etape de calcul (`WizardCalculStep.tsx`) ne prennent pas correctement en compte les transactions classifiees "Vente -> EUR" (crypto_to_fiat) pour plusieurs raisons :

1. **Filtrage silencieux** : La fonction `draftsToNormalized` (ligne 33 de WizardCalculStep) filtre les transactions avec `.filter((d) => d.date && d.assetFrom)`. Si l'utilisateur ne remplit pas le champ "De" (assetFrom), la transaction est supprimee sans avertissement.

2. **Classification `fiat_to_crypto` manquante** : Il n'existe aucune classification explicite pour les achats (EUR -> crypto). Les achats doivent etre classifies comme acquisitions pour alimenter le `totalAcquisitionCost` du PMPA. Actuellement le fallback fonctionne uniquement si `assetFrom` est une devise fiat ET `assetTo` n'est pas fiat — mais ce cas n'est pas explicite dans l'UI.

3. **Pas de diagnostic quand des transactions sont filtrees** : Quand des transactions sont exclues du calcul (champs manquants), aucun message n'explique pourquoi elles disparaissent.

4. **Qualification step ne distingue pas achats vs ventes** : La qualification montre les classifications mais ne differencie pas clairement "achat fiat->crypto" comme type distinct.

## Corrections prevues

### A. Ajouter la classification `fiat_to_crypto` (portfolioEngine.ts + UI)

- Ajouter `'fiat_to_crypto'` dans les `ACQUISITION_CLASSIFICATIONS` du moteur
- Ajouter l'option dans le selecteur de la step Transactions et Qualification
- Quand l'utilisateur entre EUR dans "De" et BTC dans "Vers", auto-suggerer `fiat_to_crypto`

### B. Corriger `draftsToNormalized` pour ne plus filtrer silencieusement

- Remplacer le filtre strict par un filtre qui conserve les transactions avec au minimum une date
- Pour les transactions sans `assetFrom`, generer une alerte visible au lieu de les supprimer
- Ajouter des logs dans le diagnostic quand des transactions sont exclues

### C. Ameliorer le diagnostic zero-result

- Compter combien de transactions ont ete filtrees et pourquoi
- Afficher : "X transaction(s) ignoree(s) car champ 'De' vide"
- Afficher : "X cession(s) taxable(s) detectee(s) — assurez-vous que la valeur EUR est renseignee"

### D. Auto-detection du type dans la step Transactions

- Quand `assetFrom` = EUR/USD et `assetTo` = crypto -> auto-classer en `fiat_to_crypto` (acquisition)
- Quand `assetFrom` = crypto et `assetTo` = EUR/USD -> auto-classer en `crypto_to_fiat` (cession taxable)
- Feedback visuel immediat (badge "Taxable" / "Acquisition")

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/domain/crypto/portfolioEngine.ts` | Ajouter `fiat_to_crypto` dans `ACQUISITION_CLASSIFICATIONS`. Ameliorer `classifyTransaction` pour gerer ce cas explicitement. |
| `src/domain/crypto/types.ts` | Ajouter `fiat_to_crypto` au type `TransactionClassification` |
| `src/components/crypto/wizard/WizardCalculStep.tsx` | Corriger `draftsToNormalized` : ne plus filtrer silencieusement, ajouter compteur de transactions exclues dans le diagnostic |
| `src/components/crypto/wizard/WizardTransactionsStep.tsx` | Ajouter `fiat_to_crypto` dans les classifications, auto-detection du type selon les assets remplis |
| `src/components/crypto/wizard/WizardQualificationStep.tsx` | Ajouter `fiat_to_crypto` dans les classifications affichees, marquer comme "Non taxable (acquisition)" |

## Detail technique

### portfolioEngine.ts — classifyTransaction

```text
Avant :
  ACQUISITION_CLASSIFICATIONS = ['income', 'airdrop', 'mining', 'staking', 'gift']
  
Apres :
  ACQUISITION_CLASSIFICATIONS = ['income', 'airdrop', 'mining', 'staking', 'gift', 'fiat_to_crypto']
```

La fonction `classifyTransaction` garde sa logique existante mais la nouvelle classification est traitee explicitement avant le fallback.

### WizardCalculStep.tsx — draftsToNormalized

```text
Avant :
  .filter((d) => d.date && d.assetFrom)
  
Apres :
  .filter((d) => d.date)  // On garde toutes les transactions avec une date
  // + avertissement dans le diagnostic si assetFrom est vide
```

Les transactions sans `assetFrom` seront converties avec `assetFrom = '???'` et une alerte sera generee, au lieu d'etre silencieusement supprimees.

### Auto-classification dans WizardTransactionsStep

Quand l'utilisateur modifie `assetFrom` ou `assetTo`, le systeme detecte automatiquement :
- Si EUR->crypto : classification = `fiat_to_crypto`
- Si crypto->EUR : classification = `crypto_to_fiat`
- Ne pas ecraser si l'utilisateur a manuellement choisi un autre type

## Impact

Cette correction garantit que :
1. Les ventes crypto -> EUR sont systematiquement comptees comme cessions taxables
2. Les achats EUR -> crypto alimentent correctement le prix total d'acquisition
3. Aucune transaction n'est silencieusement ignoree sans explication
4. Le diagnostic explique clairement quand et pourquoi des transactions sont exclues

