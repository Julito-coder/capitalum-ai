
## Plan : Hub Simulateurs de vie enrichi + lien vers Simulateur Immo

### Contexte
- Le hub `/simulateurs` existe déjà avec 3 cards : PACS, Freelance, Immobilier (déjà lié à `/simulator`).
- Le simulateur immo (15k+ lignes, route `/simulator`) est fonctionnel mais peu mis en avant.
- L'utilisateur demande d'élargir l'inventaire des événements de vie couverts dans le hub, sans recoder les moteurs existants.

### Approche : pas de nouveaux moteurs, on enrichit le hub

Je ne vais PAS coder 50 nouveaux simulateurs (hors scope V1, casse la règle "max 3 changements"). Je vais :

1. **Restructurer `/simulateurs`** en 5 catégories visuelles claires (Famille, Pro, Immo, Épargne, Retraite) avec sous-cards
2. **Mettre en avant le simulateur immo existant** comme card hero (premier bloc, badge "Complet")
3. **Marquer chaque sous-thème** : `Disponible` (lien direct), `Via Élio Agent` (ouvre `/agent` avec prompt pré-rempli), `Bientôt`

### Changements (3 max)

**1. `src/pages/Simulateurs.tsx` — refonte du hub**
- Section "Hero" : card immo plein largeur avec CTA "Lancer le simulateur" → `/simulator`
- 5 sections accordéons/grilles :
  - **Famille & Couple** : PACS/Mariage (✓ dispo), Naissance/QF, Garde alternée, Pension, Donation → tous via Agent
  - **Vie professionnelle** : Freelance (✓ dispo), Dividendes vs salaire, Rupture conv., Stock-options → via Agent
  - **Immobilier** : RP vs location, Locatif nu/meublé, SCI, Travaux/déficit foncier → tous routent vers `/simulator`
  - **Épargne** : PER, AV, PEA, SCPI, Crypto 2086 (✓ scanner) → via Agent ou outils dédiés
  - **Retraite** : Rachat trimestres, Départ optimal, Sortie PER → via Agent
- Chaque sous-item = bouton compact qui soit navigue vers une route existante, soit ouvre `/agent` avec `state.initialPrompt`

**2. `src/pages/Outils.tsx` — réactiver/mettre en avant le simulateur immo**
- Vérifier que la card "Simulateur immobilier" pointe bien vers `/simulator` et est visible
- Ajouter un badge "Outil complet" pour le différencier

**3. Vérifier le routing dans `src/App.tsx`**
- Confirmer que `/simulator` (immo) est bien actif et protégé
- S'assurer que `/simulateurs` (hub) coexiste sans conflit

### Pattern technique pour les sous-items "via Agent"

```tsx
<button onClick={() => navigate('/agent', { 
  state: { initialPrompt: "Explique-moi l'impact fiscal d'un PACS dans ma situation" }
})}>
  PACS / Mariage
</button>
```

Le hook `useElioAgent` consomme déjà `location.state.initialPrompt` (mis en place au prompt précédent).

### Design
- Sora, palette stricte (#1B3A5C, #C8943E, #F8F5F0)
- Cards `rounded-xl border border-[#E5E7EB]`, mobile-first 1 colonne → md:2 cols → lg:3 cols
- Badges : `Disponible` (vert sauge #4B8264), `Via Élio` (doré #C8943E), `Bientôt` (gris)
- Disclaimer en bas

### Hors scope
- Pas de nouveaux moteurs de calcul (succession, donation, expatriation, stock-options... → V2)
- Pas de modification du simulateur immo existant
- Pas de nouvelle table DB
