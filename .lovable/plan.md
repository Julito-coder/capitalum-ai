

# Plan : Calcul PMPA automatique base sur les transactions par compte

## Probleme actuel

Le calcul PMPA dans `WizardCalculStep` recoit les transactions mais pas les comptes. Les parametres (prix total d'acquisition, valeur globale du portefeuille) sont pre-remplis mais sans ventilation par compte, et l'utilisateur doit parfois deviner les bonnes valeurs. Le calcul devrait etre entierement automatique des qu'il y a des transactions suffisantes.

## Modifications prevues

### 1. Passer les `accounts` au step de calcul

**`src/pages/crypto/CryptoWizard.tsx`** :
- Ajouter `accounts` dans les props du composant `WizardCalculStep`

### 2. Refactorer `WizardCalculStep.tsx`

**Recevoir `accounts` en prop** pour afficher une ventilation par compte.

**Ameliorer l'auto-detection des acquisitions** :
- Achats fiat vers crypto : `assetFrom` est EUR/USD/GBP/CHF (deja fait)
- Classifications d'acquisition : income, airdrop, mining, staking, gift (deja fait)
- Ajouter aussi les echanges crypto-to-crypto ou le `fiatValueEur` represente un cout d'acquisition implicite (facultatif, conservateur)

**Afficher un recap par compte** :
- Pour chaque compte, montrer le nombre de transactions, le total d'acquisitions, le total de cessions
- Permettre de voir d'ou viennent les chiffres automatiques

**Supprimer le blocage de calcul** :
- Si `autoTotalAcquisitions > 0` et qu'il y a des cessions taxables, lancer le calcul automatiquement sans attendre de saisie manuelle
- Garder les champs d'override mais les marquer clairement comme "ajustement optionnel"

### 3. Detail technique

Dans `WizardCalculStep` :

```text
+--------------------------------------------------+
| Recap par compte                                  |
|   Binance : 3 achats = 5 000 EUR, 2 ventes       |
|   Coinbase : 1 achat = 2 000 EUR, 1 vente        |
+--------------------------------------------------+
| Total acquisitions (auto) : 7 000 EUR   [editer]  |
| Valeur portefeuille (auto) : 12 000 EUR [editer]  |
+--------------------------------------------------+
| >> Calcul PMPA lance automatiquement <<           |
| Gain net : +1 200 EUR                             |
| Detail par cession...                             |
+--------------------------------------------------+
```

- Le recap par compte utilise `accounts` + `transactions` groupes par `accountId`
- Les champs restent editables (override) mais l'utilisateur n'a plus besoin d'agir pour voir les resultats
- La formule PMPA est toujours appliquee via `computeGlobalPV`

### Fichiers modifies

1. `src/pages/crypto/CryptoWizard.tsx` — passer `accounts` a `WizardCalculStep`
2. `src/components/crypto/wizard/WizardCalculStep.tsx` — recevoir `accounts`, afficher recap par compte, calcul automatique sans blocage

