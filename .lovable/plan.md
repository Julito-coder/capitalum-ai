
# Plan : Sauvegarde automatique des conversations IA avec retention 30 jours

## Vue d'ensemble

Creer un systeme complet qui :
- Sauvegarde automatiquement chaque conversation avec l'assistant IA dans une table dediee
- Affiche l'historique dans une nouvelle section du glossaire
- Purge automatiquement les conversations de plus de 30 jours
- Permet de marquer une conversation comme "sauvegardee definitivement"
- Offre recherche, filtres et export

---

## 1. Table de base de donnees

### Nouvelle table `ai_conversations`

```text
id              uuid        PK, gen_random_uuid()
user_id         uuid        NOT NULL (ref auth.users)
topic           text        sujet/page au moment de la conversation
summary         text        resume auto (premiere question ou titre)
messages        jsonb       tableau complet [{role, content, timestamp}]
tags            text[]      mots-cles fiscaux extraits
is_pinned       boolean     false (sauvegarde definitive)
expires_at      timestamptz created_at + 30 jours (NULL si pinned)
created_at      timestamptz now()
updated_at      timestamptz now()
```

Politiques RLS :
- SELECT, INSERT, UPDATE, DELETE : `auth.uid() = user_id`

Index :
- `user_id, created_at DESC` pour les listes
- `expires_at` pour la purge

---

## 2. Sauvegarde automatique des conversations

### Modifier `src/hooks/useGlossaryAI.ts`

Ajouter une fonction `saveConversation` qui :
- S'execute automatiquement quand l'utilisateur ferme le widget ou demarre une nouvelle conversation
- Extrait le resume (premiere question utilisateur)
- Detecte les tags fiscaux automatiquement (TMI, PER, URSSAF, etc.) en cherchant dans le contenu
- Calcule `expires_at = now() + 30 jours`
- Insere dans `ai_conversations`
- Ne sauvegarde pas les conversations vides (uniquement le welcome message)

### Modifier `src/components/ai/AIHelpWidget.tsx`

- Appeler `saveConversation` dans `handleClose` et `handleNewChat` avant de vider les messages
- Passer le `topic` actuel a la sauvegarde

---

## 3. Extraction automatique des tags

Creer un utilitaire `src/lib/conversationTagExtractor.ts` :

- Dictionnaire de mots-cles fiscaux : TMI, IR, PER, PEA, URSSAF, micro-entreprise, TVA, CFE, SCPI, assurance-vie, deficit foncier, plus-value, crypto, 2042, 2044, 2086, etc.
- Scanner le contenu des messages pour detecter ces termes
- Retourner un tableau de tags uniques
- Lier aux IDs du glossaire existant quand possible (mapping tag -> glossaryTermId)

---

## 4. Purge automatique (CRON)

### Creer une edge function `supabase/functions/purge-expired-conversations/index.ts`

- Supprime les lignes ou `expires_at < now()` et `is_pinned = false`
- Retourne le nombre de lignes supprimees

### Planifier via pg_cron

- Execution quotidienne a 3h du matin
- Appel HTTP vers l'edge function

---

## 5. Interface dans le Glossaire

### Modifier `src/pages/Glossary.tsx`

Ajouter un onglet/section "Historique conversations" avec :

**En-tete** :
- Compteur de conversations archivees
- Barre de recherche dediee (filtre par mot-cle dans messages et tags)
- Filtre par date (semaine / mois)
- Filtre par categorie fiscale (basee sur les tags)

**Liste des conversations** :
- Carte par conversation avec :
  - Resume (premiere question)
  - Date relative ("il y a 3 jours")
  - Tags fiscaux sous forme de badges
  - Indicateur de temps restant avant expiration (barre de progression orange)
  - Bouton epingle (toggle `is_pinned`) avec icone cadenas
  - Bouton supprimer
- Conversations epinglees en premier, puis chronologique decroissant

**Vue detail** :
- Au clic sur une conversation, afficher le fil complet (question/reponse)
- Bouton "Exporter en texte" (copie dans le presse-papier)
- Bouton "Relancer cette conversation" (ouvre le widget avec les messages pre-charges)
- Liens vers les termes du glossaire detectes dans la conversation

### Nouveau composant `src/components/glossary/ConversationHistory.tsx`

Composant dedie qui encapsule toute la logique d'historique :
- Hook `useConversationHistory` pour fetch/delete/pin
- Gestion de la pagination (20 conversations par page)
- Etats de chargement et vide

---

## 6. Hooks et services

### `src/hooks/useConversationHistory.ts`

- `conversations` : liste paginee
- `isLoading` : etat de chargement
- `searchConversations(query)` : recherche full-text
- `pinConversation(id)` : toggle is_pinned + set/unset expires_at
- `deleteConversation(id)` : suppression manuelle
- `loadMore()` : pagination

### `src/lib/conversationService.ts`

- `saveConversation(userId, messages, topic, tags)` : insertion
- `extractTags(messages)` : detection de mots-cles
- `generateSummary(messages)` : premiere question user comme resume

---

## 7. Export de conversation

Dans le composant `ConversationHistory`, bouton "Exporter" qui :
- Formate la conversation en texte lisible (horodatage + role + contenu)
- Copie dans le presse-papier avec `navigator.clipboard.writeText()`
- Toast de confirmation

---

## 8. Securite et performance

- RLS stricte : chaque utilisateur ne voit que ses conversations
- Les messages complets sont stockes en JSONB (pas de PII dans les logs)
- Pas de stockage des donnees du profil utilisateur dans la conversation (deja dans `profiles`)
- Pagination serveur pour eviter de charger des centaines de conversations
- La sauvegarde est asynchrone (fire-and-forget) pour ne pas bloquer l'UX du widget

---

## Fichiers a creer/modifier

1. **Migration SQL** : table `ai_conversations` avec RLS
2. **`src/lib/conversationService.ts`** (nouveau) : logique de sauvegarde et tags
3. **`src/hooks/useConversationHistory.ts`** (nouveau) : hook de lecture/gestion
4. **`src/hooks/useGlossaryAI.ts`** : ajouter saveConversation
5. **`src/components/ai/AIHelpWidget.tsx`** : appeler save au close/new chat
6. **`src/components/glossary/ConversationHistory.tsx`** (nouveau) : UI historique
7. **`src/pages/Glossary.tsx`** : integrer l'onglet historique
8. **`supabase/functions/purge-expired-conversations/index.ts`** (nouveau) : edge function de purge
9. **SQL CRON** : planification de la purge quotidienne

## Ordre d'implementation

1. Migration DB (table + RLS + index)
2. Service de sauvegarde + extracteur de tags
3. Integration dans le hook et widget AI
4. Hook d'historique
5. Composant ConversationHistory
6. Integration dans Glossary.tsx
7. Edge function de purge + CRON
