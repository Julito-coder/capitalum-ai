# Bulletin Élio

Surface quotidienne unique, rafraîchie une fois par jour, qui devient la home de l'app.

## Architecture

- **bulletinEngine.ts** : moteur déterministe de priorisation. Appelle `dashboardService`, `deadlinesData` et `taxOptimizationEngine` sans les réécrire. Sélectionne l'action du jour selon 4 règles de priorité (échéance critique → alerte → meilleur ratio gain/effort → découverte).
- **bulletinService.ts** : couche Supabase CRUD pour `daily_bulletins` et `user_streaks`.
- **useDailyBulletin.ts** : hook React qui charge/génère paresseusement le bulletin au premier accès quotidien.

## Tables Supabase

- `daily_bulletins` : un bulletin par utilisateur par jour (action, news, échéance, gains).
- `user_streaks` : streak de connexion consécutive.

## Composants UI

- `BulletinHeader` : greeting contextualisé + streak
- `GainCumule` : chiffre héros animé (CountUp)
- `ActionDuJour` : action unique avec CTA, report, skip
- `ProchaineEcheance` : prochaine date importante
- `NewsPersonnalisee` : news contextuelle (LLM, étape ultérieure)
- `BulletinFooter` : raccourcis calendrier, scanner, agent

## Règles

- Un seul bulletin par 24h, pas de refresh manuel.
- Le LLM ne calcule rien — tout vient des moteurs déterministes.
- Feed vertical, mobile-first, une seule colonne.
