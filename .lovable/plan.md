

# Afficher les formulaires officiels PDF in-app avec assistant

## Objectif

Remplacer les formulaires Capitalum personnalises (Crypto2086Form, ForeignAccounts3916Form) par l'affichage direct du **PDF officiel** d'impots.gouv.fr dans la colonne gauche du viewer, tout en conservant l'assistant AI contextuel dans la colonne droite.

## Approche technique

Les PDFs officiels sont publiquement accessibles sur impots.gouv.fr. Le viewer utilisera :

1. **Priorite 1** : `<iframe>` natif du navigateur (tous les navigateurs modernes ont un lecteur PDF integre)
2. **Fallback** : Google Docs Viewer (`https://docs.google.com/gview?url=...&embedded=true`) si le site bloque l'iframe direct
3. **Fallback ultime** : lien d'ouverture dans un nouvel onglet + message explicatif

L'assistant AI, le `FormAssistantPanel`, reste identique et fonctionnel a cote du PDF.

## Fichiers impactes

### `src/components/calendar/InAppFormViewer.tsx` (modifier)

- Supprimer les imports de `Crypto2086Form` et `ForeignAccounts3916Form`
- Remplacer `renderForm()` par un composant `OfficialPdfViewer` qui affiche l'iframe du PDF officiel
- Ajouter un state pour gerer le chargement et les erreurs d'iframe
- Conserver le layout split (PDF 65% / Assistant 35%)
- Conserver le bouton "PDF officiel" dans le header comme lien de secours

Structure du nouveau rendu :

```text
InAppFormViewer
  +-- Header (titre + lien externe secours + bouton assistant mobile + fermer)
  +-- [Colonne gauche 65%] iframe vers le PDF officiel
  |     +-- Loading spinner pendant le chargement
  |     +-- Message fallback si iframe bloque (avec lien direct)
  +-- [Colonne droite 35%] FormAssistantPanel (inchange)
```

### `src/lib/deadlinesData.ts` (modifier)

- S'assurer que les `externalUrl` pointent bien vers les PDFs telechargeables (pas les pages HTML)
  - 2086 : URL directe du PDF officiel
  - 3916-bis : URL directe du PDF officiel
- Les champs `formType` et `hasInAppForm` restent en place

### Fichiers NON supprimes (mais non utilises)

- `src/components/calendar/forms/Crypto2086Form.tsx` — conserve pour usage futur (mode "saisie assistee")
- `src/components/calendar/forms/ForeignAccounts3916Form.tsx` — idem
- `src/components/calendar/FormAssistantPanel.tsx` — **inchange**, continue de fonctionner tel quel

## Details techniques

### Gestion de l'iframe PDF

L'iframe pointera directement vers l'URL du PDF officiel. Le navigateur affiche nativement le PDF avec ses outils (zoom, telechargement, impression, remplissage des champs).

```text
<iframe src="https://www.impots.gouv.fr/formulaire/2086/..." />
```

Si impots.gouv.fr bloque via `X-Frame-Options` ou CSP :
- Detecter l'echec via `onError` ou un timeout
- Basculer automatiquement sur Google Docs Viewer
- Afficher un bouton "Ouvrir dans un nouvel onglet" comme dernier recours

### Mobile

- Le PDF est affiche en plein ecran
- L'assistant est accessible via un bouton flottant (drawer, comme actuellement)
- Le PDF reste scrollable et zoomable via les gestes natifs du navigateur

### Pas de nouvelle dependance

Aucune librairie supplementaire (react-pdf, pdf.js) n'est necessaire : l'iframe native du navigateur gere le rendu PDF, y compris les formulaires remplissables.

## Resume des changements

| Fichier | Action |
|---|---|
| `src/components/calendar/InAppFormViewer.tsx` | Modifier : remplacer formulaires custom par iframe PDF officiel |
| `src/lib/deadlinesData.ts` | Verifier/corriger les URLs des PDFs officiels |
| `FormAssistantPanel.tsx` | Aucun changement |
| `Crypto2086Form.tsx` | Conserve mais plus importe dans le viewer |
| `ForeignAccounts3916Form.tsx` | Conserve mais plus importe dans le viewer |

