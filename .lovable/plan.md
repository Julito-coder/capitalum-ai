
# Plan : Corriger le calcul PMPA pour qu'il soit veridique et automatique

## Diagnostic

Trois bugs identifies dans le flux actuel :

### Bug 1 : Le calcul est bloque quand il n'y a pas d'acquisitions
Ligne 114 de `WizardCalculStep.tsx` :
```
canCompute = taxableTxs.length > 0 && totalAcqNum > 0 && portfolioNum > 0
```
Si l'utilisateur n'a pas renseigne de transactions d'achat, `totalAcqNum = 0` et `portfolioNum = 0`, donc le calcul ne se lance jamais. Pourtant, fiscalement, si le prix d'acquisition est inconnu ou nul, la plus-value est egale au prix de cession complet (pire cas pour le contribuable). Le systeme devrait calculer et **avertir** l'utilisateur.

### Bug 2 : `draftsToTaxableTransactions` filtre trop strictement
Ligne 32 : le filtre exige `d.qtyFrom` (quantite vendue). Si l'utilisateur n'a pas rempli ce champ mais a renseigne la valeur EUR, la transaction est exclue du calcul. Sur l'ecran, le total cessions affiche 0,00 EUR alors que le recap par compte montre bien 50 000 EUR.

### Bug 3 : `computeCessionLine` retourne PV = 0 quand la valeur portefeuille est 0
Ligne 47-59 : si `valeurGlobalePortefeuille <= 0`, le moteur renvoie `plusValue: 0`. C'est mathematiquement faux : si le cout d'acquisition du portefeuille est 0 et qu'on cede pour 50 000 EUR, la PV devrait etre 50 000 EUR.

---

## Corrections prevues

### 1. `src/domain/crypto/calculations.ts` - Moteur de calcul

- Modifier `computeCessionLine` : quand `valeurGlobalePortefeuille <= 0`, utiliser le prix de cession comme valeur du portefeuille (fractionCedee = 1.0), ce qui donne PV = prixCession - prixAcquisitionFraction - frais. Si acquisition = 0, PV = prixCession - frais (correct fiscalement).
- Cela garantit qu'une cession sans acquisition documentee = gain complet.

### 2. `src/components/crypto/wizard/WizardCalculStep.tsx` - Logique UI

**Assouplir `draftsToTaxableTransactions`** :
- Supprimer le filtre obligatoire sur `d.qtyFrom`. Seuls `d.date`, `d.assetFrom`, `isCessionTx(d)` et `d.fiatValueEur > 0` sont necessaires pour le calcul fiscal.

**Corriger `canCompute`** :
- Condition : `taxableTxs.length > 0` et `portfolioNum > 0`. Supprimer l'exigence `totalAcqNum > 0` car un prix d'acquisition de 0 est un cas valide (gain total).

**Corriger `autoPortfolioValue`** :
- Quand il n'y a pas d'acquisitions, la valeur du portefeuille ne peut pas etre 0. Utiliser au minimum le total des cessions comme valeur plancher (conservateur : on suppose que le portefeuille vaut au moins ce qui est vendu).

**Ajouter un avertissement visuel** :
- Si `autoTotalAcquisitions === 0` et qu'il y a des cessions, afficher un bandeau orange : "Aucune acquisition detectee. Le calcul considere un prix d'acquisition de 0 EUR, ce qui maximise la plus-value imposable. Renseignez vos achats pour un calcul plus precis."

**Corriger le total cessions dans le recap** :
- Utiliser les transactions brutes (pas `taxableTxs`) pour calculer le total des cessions affiche dans le recap par compte, assurant la coherence avec les lignes par compte.

### 3. Resultat attendu

Avec une cession de 50 000 EUR de BTC et 0 EUR d'acquisitions :
- Prix total acquisition = 0 EUR
- Valeur globale portefeuille = 50 000 EUR (plancher = cessions)
- Fraction cedee = 50 000 / 50 000 = 100%
- PV = 50 000 - (0 x 100%) - 0 frais = **50 000 EUR de plus-value**
- Impot PFU (30%) = **15 000 EUR**
- Un bandeau orange alerte l'utilisateur pour qu'il renseigne ses achats

---

## Fichiers modifies

1. `src/domain/crypto/calculations.ts` — Corriger le cas `valeurGlobalePortefeuille <= 0`
2. `src/components/crypto/wizard/WizardCalculStep.tsx` — Assouplir les filtres, corriger `canCompute`, ajouter l'avertissement
