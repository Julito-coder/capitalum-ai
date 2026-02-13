

# Systeme de Routing Intelligent vers Partenaires Financiers

## Contexte
Les guides interactifs du dashboard accompagnent l'utilisateur jusqu'a la decision, mais s'arretent avant l'execution concrete. L'utilisateur doit ensuite chercher seul ou ouvrir un PER, quel courtier choisir, etc. Ce systeme comble ce vide en integrant des recommandations de partenaires contextualises directement dans les guides existants.

## Architecture

### 1. Donnees partenaires centralisees
Creation d'un fichier `src/data/partnersData.ts` contenant la base de donnees complete des partenaires, organisee par categorie :
- **PER** : Carac (4% fonds euros), Suravenir/Fortuneo (10.95%), Nalo (gestion pilotee)
- **PEA/Bourse** : Trade Republic, Boursorama, Fortuneo
- **Assurance Vie** : Linxea, Boursorama Vie, Yomoni
- **Neobanques** : N26, Revolut, Bunq
- **Credit/Financement** : Fortuneo, Boursorama
- **Optimisation Fiscale** : liens vers simulateurs

Chaque partenaire aura : nom, URL, CTA, performance/avantage cle, audience cible, frais, investissement minimum.

### 2. Hook de routage intelligent `usePartnerRouter`
Creation de `src/hooks/usePartnerRouter.ts` :
- Entree : type de recommandation + profil utilisateur
- Logique conditionnelle basee sur : age, revenu, statut professionnel, patrimoine, preferences
- Sortie : partenaire principal + alternatives (max 3) + suggestion neobanque si pertinent
- Les URLs incluent automatiquement les UTM params `?utm_source=capitalum&utm_medium=recommendation`

### 3. Composant `PartnerRecommendations`
Creation de `src/components/guides/PartnerRecommendations.tsx` :
- Affiche la meilleure option avec badge "Recommande"
- Liste 2-3 alternatives avec raison de recommandation
- Suggestion neobanque complementaire si applicable
- Score de pertinence visuel (barre de progression)
- Tous les liens s'ouvrent dans un nouvel onglet (`target="_blank"`)
- Tracking des clics (event custom + UTM)

### 4. Integration dans les guides existants
Modification de l'etape "Action" de chaque guide pour integrer le composant `PartnerRecommendations` :
- **PERGuideSteps** : dans la section "Ou ouvrir un PER" (etape 3), remplacer la liste statique par le composant dynamique
- **PEAGuideSteps** : ajouter recommendations courtiers dans l'etape action
- **EpargneSalarialeGuideSteps** : ajouter liens vers plateformes d'epargne salariale
- **Guides Pro** (Remuneration, Tresorerie, Fiscalite IS) : ajouter partenaires pertinents (experts-comptables en ligne, plateformes de placement tresorerie)

### 5. Tracking analytique
Creation de `src/lib/partnerTracking.ts` :
- Fonction `trackPartnerClick(recommendationType, partnerName, position, userSegment)`
- Ajout UTM params aux URLs
- Stockage local des clics pour analytics dashboard

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/data/partnersData.ts` | **Creer** - Base de donnees partenaires |
| `src/hooks/usePartnerRouter.ts` | **Creer** - Logique de routage intelligent |
| `src/components/guides/PartnerRecommendations.tsx` | **Creer** - Composant UI partenaires |
| `src/lib/partnerTracking.ts` | **Creer** - Tracking clics |
| `src/components/guides/steps/PERGuideSteps.tsx` | **Modifier** - Integrer partenaires dans etape 3 |
| `src/components/guides/steps/PEAGuideSteps.tsx` | **Modifier** - Integrer courtiers recommandes |
| `src/components/guides/steps/EpargneSalarialeGuideSteps.tsx` | **Modifier** - Integrer plateformes |
| `src/components/guides/steps/FraisReelsGuideSteps.tsx` | **Modifier** - Liens simulateurs |
| `src/components/guides/steps/RemunerationGuideSteps.tsx` | **Modifier** - Experts-comptables en ligne |
| `src/components/guides/steps/TresorerieGuideSteps.tsx` | **Modifier** - Plateformes placement |
| `src/components/guides/steps/FiscaliteISGuideSteps.tsx` | **Modifier** - Outils fiscaux |

## Details techniques

### Structure de donnees partenaire
```text
Partner {
  id: string
  name: string
  url: string
  cta: string              // "Ouvrir un PER Carac"
  performance?: string     // "4.0%"
  description: string      // Raison courte de recommendation
  features: string[]
  audience: string[]       // ["Salaries", "Freelances"]
  fees?: string
  minInvestment?: number
  monthlyFee?: string
  category: PartnerCategory
}
```

### Logique de routage (exemples)
- PER + age < 30 + revenu < 30k --> Nalo (gestion pilotee, frais bas)
- PER + patrimoine > 500k --> Carac/BNP Cardif (premium)
- PER + independant --> Carac (adapte aux TNS)
- PER + defaut --> Carac (meilleur rendement global)
- PEA + debutant --> Trade Republic (interface simple)
- PEA + avance --> Boursorama (gamme large)
- Neobanque + voyageur --> Revolut (multi-devises)
- Neobanque + eco-responsable --> Bunq/Green-Got

### Composant visuel
```text
+------------------------------------------+
| Recommande pour vous                     |
| [Logo] Carac - PER                       |
| Rendement fonds euros : 4.0%             |
| Frais : 0.60%                            |
| [====Ouvrir un PER Carac ====>]          |
| Pourquoi : Meilleur rendement 2025       |
+------------------------------------------+
| Alternatives                             |
| > Suravenir (Fortuneo) - 10.95%          |
| > Nalo - Gestion pilotee automatisee     |
+------------------------------------------+
| Compte complementaire                    |
| > N26 - Remuneration 4%, zero frais      |
+------------------------------------------+
```

## Ordre d'implementation
1. `partnersData.ts` - base de donnees
2. `partnerTracking.ts` - tracking
3. `usePartnerRouter.ts` - logique routage
4. `PartnerRecommendations.tsx` - composant UI
5. Modification des 7 fichiers de guides existants

