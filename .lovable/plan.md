# Landing page publique `/welcome`

Page marketing de souscription, inspirée de Lovable et Emergent, qui présente Élio et redirige vers l'inscription dans l'app.

## Routing

- Nouvelle route publique `/welcome` (alias `/lp` en redirect).
- Si l'utilisateur est déjà connecté : redirection automatique vers `/bulletin`.
- `/` reste sur le quiz de diagnostic actuel (inchangé).
- Tous les CTA pointent vers `/auth?mode=signup&from=welcome` (sauf "Voir une démo" qui scrolle vers la section démo).

## Structure de la page (sections, dans l'ordre)

1. **Nav top sticky transparente**
   - Logo Élio à gauche.
   - Liens ancres : Fonctionnalités · Tarifs · FAQ.
   - À droite : "Se connecter" (lien `/auth`) + bouton primaire "Commencer gratuitement" (`/auth?mode=signup`).
   - Sur mobile : burger → drawer.

2. **Hero (style Lovable/Emergent)**
   - Badge accent doré : "Nouveau · Diagnostic gratuit en 90 secondes".
   - Headline XXL Sora bold : "Ne perds plus un euro par manque d'information."
   - Sous-titre : "Élio est ton copilote administratif et financier. Aides oubliées, erreurs fiscales, contrats sous-optimisés — on récupère en moyenne 2 000 € par an pour toi."
   - Double CTA : "Créer mon compte gratuit" (primary) · "Voir comment ça marche" (ghost, scroll vers démo).
   - Mention discrète sous CTA : "Sans CB · Diagnostic offert · 2 min".
   - Visuel à droite (desktop) / dessous (mobile) : mockup du bulletin Élio dans un cadre device, ombre douce, halo dégradé bleu/doré en arrière-plan.

3. **Bandeau preuve sociale**
   - Ligne de chiffres clés en grille 3 colonnes :
     - "10 Md€" · aides non réclamées chaque année en France
     - "2 000 €" · récupérables en moyenne par foyer
     - "90 s" · pour ton premier diagnostic
   - Logos presse / mentions ("Vu dans…") en niveaux de gris si on en a, sinon placeholder désactivable.

4. **"Comment ça marche" — 3 étapes**
   - Carte 1 : "Réponds au quiz" — 5 à 7 questions, swipe.
   - Carte 2 : "Reçois ton Score Élio" — montant € récupérable + top 3 actions.
   - Carte 3 : "Agis chaque matin" — bulletin quotidien en 60 s.

5. **Features (6 cartes en grille 2x3 / 1 col mobile)**
   - Bulletin quotidien — l'habitude qui rapporte.
   - Scanner fiscal IA — détecte erreurs et optimisations.
   - Détecteur d'aides — APL, prime d'activité, MaPrimeRénov'…
   - Calendrier prédictif — toutes tes échéances sur 12 mois.
   - Simulateurs — immo, PACS, freelance, épargne.
   - Agent IA Élio — réponses chiffrées avec les vrais barèmes.
   - Chaque carte : icône Lucide, titre, 1 phrase, micro-CTA "En savoir plus" (ancre).

6. **Section démo visuelle**
   - Capture/mockup d'un bulletin réel (placeholder image stylisée).
   - Texte à côté : "Chaque matin, un seul écran. Une action. Un gain en euros."

7. **Pricing (2 plans)**
   - Carte **Gratuit** : diagnostic, top 3 actions, calendrier sans montants, 1 scan/mois, agent limité.
   - Carte **Premium** (mise en avant, badge doré "Le plus choisi") : tout illimité, calendrier avec montants, coach proactif, simulateurs PDF, coffre 5 Go. Prix affiché : "9,99 €/mois" ou "99 €/an" (à confirmer — placeholder).
   - CTA sous chaque plan : "Commencer gratuitement".
   - Note : pas de checkout en V1 — le CTA mène à l'inscription.

8. **Testimonials (3 cartes)**
   - Citations courtes attribuées aux personas (Léa étudiante, Thomas dev, Sarah & Karim) — marquées comme exemples.

9. **FAQ (accordion shadcn)**
   - "Est-ce que c'est vraiment gratuit ?"
   - "Élio remplace-t-il mon comptable ?"
   - "Mes données sont-elles en sécurité ?"
   - "Puis-je l'utiliser sur mobile ?"
   - "Quand passer en Premium ?"

10. **CTA final pleine largeur**
    - Fond dégradé bleu profond → doré subtil.
    - "Commence à récupérer ton argent dès aujourd'hui." + bouton blanc "Créer mon compte gratuit".

11. **Footer**
    - 4 colonnes : Produit · Ressources · Légal (CGU, Confidentialité, Mentions) · Contact.
    - Disclaimer : "Élio fournit des estimations à titre indicatif…".
    - Logo + © 2026 Élio.

## Détails techniques

- Fichiers à créer :
  - `src/pages/Welcome.tsx` (page principale).
  - `src/components/landing/` : `LandingNav.tsx`, `Hero.tsx`, `SocialProof.tsx`, `HowItWorks.tsx`, `FeaturesGrid.tsx`, `DemoSection.tsx`, `Pricing.tsx`, `Testimonials.tsx`, `FAQ.tsx`, `FinalCTA.tsx`, `LandingFooter.tsx`.
- Modifier `src/App.tsx` : ajouter `<Route path="/welcome" element={<Welcome />} />` et `<Route path="/lp" element={<Navigate to="/welcome" replace />} />` (publiques).
- Modifier `src/pages/Auth.tsx` (si nécessaire) pour lire `?mode=signup` et pré-sélectionner l'onglet inscription + tracker `from=welcome`.
- Design system strict : couleurs `#1B3A5C` / `#C8943E` / `#FAFAF7`, font Sora, cards radius 12px, shadow-sm, composants shadcn existants (Button, Card, Accordion).
- Animations Framer Motion : fade-up au scroll sur chaque section (déjà installé), parallax léger sur le mockup hero.
- Mobile-first : hero stack vertical < 640px, grilles features/pricing en 1 colonne, nav burger.
- SEO : `<title>Élio — Ne perds plus un euro</title>`, meta description, Open Graph (image hero), `lang="fr"`. Mise à jour de `index.html` ou via `react-helmet-async` si déjà présent (sinon on met juste les balises dans le composant via `useEffect` document.title).
- Aucun appel Supabase nécessaire (page 100% statique côté client). Conformité RGPD : pas de tracker custom ajouté.
- Disclaimer fiscal présent dans le footer.

## Hors scope (à faire dans un prompt suivant)

- Checkout payant Stripe/Paddle (pas activé sur le projet).
- A/B testing, analytics avancées.
- Génération du mockup hero en image (on utilise un placeholder stylisé en HTML/CSS dans une frame `device`).
- Pages légales détaillées (CGU/Confidentialité) — liens présents mais pages dédiées non créées ici.

## Ce qui n'est PAS touché

- `/`, quiz onboarding, `/bulletin`, `/auth` (sauf petite lecture du param `mode`).
- Layout app, navigation 4 tabs, AuthContext, Supabase client, moteurs de calcul.