

# Plan : Transactions par compte, Export PDF fonctionnel, et Tiroir des formulaires sauvegardees

## Contexte

Trois problemes identifies :

1. **Les transactions ne sont pas liees aux comptes** : actuellement `TxDraft` n'a pas de champ `accountId`, donc impossible de savoir de quel compte vient chaque transaction.
2. **L'export PDF est un placeholder** (TODO dans `CryptoExports.tsx`) : le bouton affiche un toast mais ne genere rien.
3. **Pas de tiroir "Mes formulaires"** dans la page Formulaires : l'utilisateur ne peut pas retrouver ses brouillons 2086 sauvegardes.

---

## 1. Transactions repertoriees par compte

### Modifications

**`src/pages/crypto/CryptoWizard.tsx`** :
- Ajouter un champ `accountId` a l'interface `TxDraft`
- Passer `accounts` en prop a `WizardTransactionsStep`

**`src/components/crypto/wizard/WizardTransactionsStep.tsx`** :
- Recevoir `accounts` en prop
- Ajouter un champ Select "Compte" dans chaque carte de transaction, listant les comptes crees a l'etape 1
- Grouper visuellement les transactions par compte (sections avec en-tete du nom du compte)
- Permettre d'ajouter une transaction directement sous un compte

**`src/components/crypto/wizard/WizardCalculStep.tsx`** :
- Adapter pour ignorer le nouveau champ `accountId` (pas d'impact sur le calcul PMPA)

### Etapes detaillees par compte

Dans `WizardTransactionsStep` :
- Si des comptes existent, afficher les transactions groupees par `accountId`
- Un groupe "Sans compte" pour les transactions sans `accountId`
- Bouton "Ajouter une transaction" sous chaque groupe de compte
- Le Select "Compte" prefixe automatiquement quand on clique sur "Ajouter" sous un compte specifique

---

## 2. Export PDF fonctionnel

### Nouveau fichier : `src/lib/cryptoPdfExport.ts`

Fonction `exportCrypto2086Pdf` qui genere un dossier PDF complet :
- **Page 1** : En-tete "Dossier 2086 - Synthese", annee fiscale, date de generation
- **Section Comptes** : Liste des comptes (nom, type, pays, etranger oui/non)
- **Section Cessions taxables** : Tableau avec date, actif, prix de cession, fraction cedee, PV/MV
- **Section Totaux** : Case 3AN, Case 3BN, regime fiscal, estimation impot
- **Section Hypotheses** : parametres utilises (prix total acquisition, valeur globale portefeuille)

Pour le journal d'audit :
- Fonction `exportCryptoAuditPdf` : detail formule par formule, inputs/outputs

### Regles PDF (conformes aux standards du projet)
- jsPDF avec Helvetica, normalisation des accents francais
- Separateurs de milliers manuels avec espace + suffixe "EUR"
- Objectif taille < 2 Mo

### Modifications dans `CryptoExports.tsx`
- Importer les fonctions d'export
- Recuperer les donnees depuis la DB (tables `crypto_accounts`, `crypto_transactions`, `crypto_tax_computations`, `tax_form_2086_drafts`)
- Appeler la generation PDF reelle au clic

---

## 3. Tiroir "Mes formulaires" dans la page Formulaires

### Modifications dans `src/pages/Formulaires.tsx`

Ajouter une section **au-dessus** de la liste des formulaires disponibles :

- **Section "Mes brouillons"** avec un Collapsible/Accordion
- Requete Supabase sur `tax_form_2086_drafts` pour l'utilisateur connecte
- Affichage de chaque brouillon sous forme de carte :
  - Annee fiscale
  - Statut (brouillon, en revue, pret, reporte)
  - Date de derniere modification
  - Bouton "Reprendre" qui navigue vers `/crypto/2086`
  - Bouton "Supprimer"
- Si aucun brouillon, afficher un message discret "Aucun formulaire en cours"
- Visuellement separe des formulaires proposes par un Separator

---

## Ordre d'implementation

1. Modifier `TxDraft` et passer `accounts` au step transactions (liaison compte-transaction)
2. Mettre a jour `WizardTransactionsStep` avec le groupement par compte
3. Creer `src/lib/cryptoPdfExport.ts` avec les deux fonctions d'export
4. Mettre a jour `CryptoExports.tsx` pour appeler les vrais exports
5. Ajouter la section "Mes brouillons" dans `Formulaires.tsx`

