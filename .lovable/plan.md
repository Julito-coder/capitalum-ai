# Plan — Module Crypto 2086

## Phase 1 : Fondation ✅
- [x] Migration DB (5 tables avec RLS)
- [x] Types TypeScript du domaine (`src/domain/crypto/types.ts`)
- [x] Moteur de calcul PV (méthode FR 150 VH bis) avec audit trail (`src/domain/crypto/calculations.ts`)
- [x] Routes + pages (Dashboard, Wizard, Controls, Report, Exports)
- [x] Navigation sidebar "Crypto 2086"

## Phase 2 : Wizard de préparation (Page B)
- [x] Étape 1 : Sources & comptes (UI)
- [x] Étape 2 : Transactions (saisie manuelle + placeholder CSV)
- [x] Étape 3 : Valorisation EUR (info)
- [x] Étape 4 : Qualification fiscale (règles)
- [x] Étape 5 : Calcul + formule (info)
- [x] Étape 6 : Checklist préparation
- [ ] Connecter wizard aux DB (CRUD Supabase)
- [ ] Import CSV réel avec mapping colonnes

## Phase 3 : Contrôles qualité (Page C)
- [x] UI alertes bloquantes / non bloquantes
- [x] Badge fiabilité
- [ ] Connecter aux vraies données

## Phase 4 : Pack de report (Page D)
- [x] Champs copier/coller avec clipboard API
- [x] Checklist "reporté"
- [ ] Estimation impôt dynamique (PFU/Barème)

## Phase 5 : Exports & Archivage (Page E-F)
- [x] UI exports (synthèse + audit)
- [ ] Génération PDF jsPDF
- [ ] Archivage automatique en DB
- [ ] Bibliothèque documents

## Phase 6 : Polish
- [ ] Tests unitaires calcul
- [ ] Assistant contextuel intégré par étape
- [ ] Glossaire crypto enrichi
- [ ] Détection transferts internes
- [ ] Détection doublons
