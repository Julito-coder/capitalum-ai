

# Filtres cliquables + Formulaires fiscaux in-app avec assistant AI

## Vue d'ensemble

Deux ajouts majeurs au Cockpit Patrimonial :
1. Les compteurs de statut (Optimisees, En cours, A faire, Ignorees) deviennent des filtres cliquables
2. Les formulaires officiels (2086 crypto, 3916-bis comptes etrangers) s'ouvrent in-app avec un assistant AI contextuel en sidebar

---

## Partie 1 : Filtres cliquables sur les compteurs

### OptimizationScoreBar.tsx
- Les 4 blocs de stats deviennent des `<button>` avec effet visuel (ring + scale) quand actifs
- Nouvelles props : `activeFilter: DeadlineStatus | null` et `onFilterByStatus: (status: DeadlineStatus | null) => void`
- Un clic sur un statut deja actif desactive le filtre (toggle)

### Calendar.tsx
- Ajout d'un state `statusFilter: DeadlineStatus | null`
- Passage des props au `OptimizationScoreBar`
- Integration dans le `useMemo` de `filteredDeadlines` : si `statusFilter` est actif, filtrer par `tracking?.status`

---

## Partie 2 : Formulaires fiscaux in-app

### Concept
Les formulaires officiels publies en PDF (2086, 3916-bis) ne peuvent pas etre affiches en iframe (impots.gouv.fr bloque). A la place, l'application propose des formulaires internes reproduisant les champs officiels, pre-remplis avec les donnees du profil utilisateur, avec un assistant AI contextuel en sidebar.

### Architecture des composants

```text
Calendar.tsx
  +-- DeadlineActionPanel
        +-- InAppFormViewer (plein ecran, z-50)
              +-- [Colonne gauche] Crypto2086Form / ForeignAccounts3916Form
              +-- [Colonne droite / drawer mobile] FormAssistantPanel
```

### Nouveaux fichiers

**src/components/calendar/InAppFormViewer.tsx**
- Layout plein ecran (fixed inset-0 z-50)
- Desktop : 2 colonnes (formulaire 65% / assistant 35%)
- Mobile : formulaire plein ecran + drawer pour l'assistant (bouton flottant)
- En-tete : nom du formulaire + lien vers le PDF officiel + bouton sauvegarder + bouton fermer
- Selectionne le bon formulaire selon `formType`

**src/components/calendar/FormAssistantPanel.tsx**
- Reutilise le hook `useGlossaryAI` existant
- Contexte enrichi envoye au edge function `glossary-ai` :
  - Type de formulaire (ex: "2086 - Crypto-actifs")
  - Donnees du profil (TMI, PnL crypto, comptes etrangers...)
  - Champ en cours de remplissage (optionnel)
- Message d'accueil contextuel : "Tu remplis le formulaire 2086. D'apres ton profil, ta plus-value crypto est de X EUR..."
- Suggestions proactives pre-configurees selon le formulaire
- Meme UX que l'AIHelpWidget (messages, streaming, suggestions cliquables)

**src/components/calendar/forms/Crypto2086Form.tsx**
- Reproduit les champs cles du formulaire officiel 2086 :
  - Liste dynamique de cessions (ajouter/supprimer) : date, actif cede, prix de cession, prix total d'acquisition du portefeuille, fraction de portefeuille cedee
  - Calcul automatique de la plus/moins-value par cession (methode PMPA)
  - Total des plus-values (case 3AN) et moins-values (case 3BN) calcule automatiquement
  - Pre-remplissage du PnL crypto depuis le profil (`crypto_pnl_2025`)
- Reutilise les types `CryptoTransaction` de `taxFormTypes.ts`
- Sauvegarde dans `user_deadline_tracking.guide_progress.form_data` (JSONB existant)
- Bouton "Telecharger le recap PDF" (utilise jsPDF)

**src/components/calendar/forms/ForeignAccounts3916Form.tsx**
- Reproduit les champs du 3916-bis :
  - Liste dynamique de comptes : nom de la plateforme, pays, numero de compte, date d'ouverture, date de fermeture (optionnel), usage (trading, staking, epargne)
  - Pre-remplissage si `crypto_wallet_address` existe dans le profil
- Sauvegarde identique (guide_progress.form_data)
- Export PDF du recap

### Fichiers modifies

**src/lib/deadlinesTypes.ts**
- Ajout de `formType?: TaxFormType` sur l'interface `FiscalDeadline`
- Ajout de `hasInAppForm?: boolean` pour signaler la disponibilite d'un formulaire interne
- Ajout du type d'action `'inapp-form'` dans `DeadlineAction.type`

**src/lib/deadlinesData.ts**
- Echeance `crypto-2086-*` : ajout `formType: '2086'`, `hasInAppForm: true`
- Echeance `crypto-3916bis-*` : ajout `formType: '3916-bis'`, `hasInAppForm: true`
- Remplacement de l'action `type: 'external'` par `type: 'inapp-form'` pour ces deux echeances (le lien externe reste accessible dans le header du viewer)

**src/components/calendar/DeadlineActionPanel.tsx**
- Ajout d'un state `showInAppForm: boolean`
- Dans `handleAction`, pour les actions de type `'inapp-form'` : afficher `InAppFormViewer` au lieu d'ouvrir un lien externe
- Le `InAppFormViewer` recoit la deadline, le profil, et un callback `onClose`

---

## Details techniques

### Sauvegarde des donnees de formulaire
- Stockage dans le champ JSONB existant `user_deadline_tracking.guide_progress` sous la cle `form_data`
- Structure : `{ form_data: { formType: '2086', entries: [...], totals: {...}, savedAt: '...' } }`
- Pas de nouvelle table necessaire

### Contexte AI pour l'assistant
- Le `FormAssistantPanel` appelle `useGlossaryAI.streamChat()` avec un topic specifique : `"Formulaire 2086 - Declaration crypto-actifs"`
- Le userContext est enrichi avec les donnees crypto du profil
- Suggestions contextuelles par formulaire :
  - 2086 : "Comment calculer le PMPA ?", "Dois-je declarer les echanges crypto-crypto ?", "Qu'est-ce que la case 3AN ?"
  - 3916-bis : "Quelles plateformes declarer ?", "Binance est-elle etrangere ?", "Wallet MetaMask = compte etranger ?"

### Formulaires supportes en V1

| Formulaire | In-app | Raison |
|---|---|---|
| 2086 (crypto cessions) | Oui | Champs structures, donnees profil dispo |
| 3916-bis (comptes crypto) | Oui | Simple liste de comptes |
| Autres (IR, IFI, 2044...) | Non (lien externe) | Trop complexes |

### Fichiers impactes (resume)

| Fichier | Action |
|---|---|
| `src/components/calendar/OptimizationScoreBar.tsx` | Modifier (boutons cliquables) |
| `src/pages/Calendar.tsx` | Modifier (state filtre) |
| `src/lib/deadlinesTypes.ts` | Modifier (formType, hasInAppForm, action type) |
| `src/lib/deadlinesData.ts` | Modifier (formType sur crypto deadlines) |
| `src/components/calendar/DeadlineActionPanel.tsx` | Modifier (ouverture formulaire in-app) |
| `src/components/calendar/InAppFormViewer.tsx` | Creer |
| `src/components/calendar/FormAssistantPanel.tsx` | Creer |
| `src/components/calendar/forms/Crypto2086Form.tsx` | Creer |
| `src/components/calendar/forms/ForeignAccounts3916Form.tsx` | Creer |

