// Bibliothèque de 20 concepts fiscaux clés expliqués façon Élio.
// Sources : service-public.fr, impots.gouv.fr, BOFiP (barèmes 2025).

export interface FiscalConcept {
  id: string;
  title: string;
  elio_explanation: string;
  key_numbers_2025: string[];
  who_it_fits: string[];
  watch_out_for: string[];
  source_url: string;
}

export const FISCAL_CONCEPTS: Record<string, FiscalConcept> = {
  tranches_ir: {
    id: 'tranches_ir',
    title: 'Les tranches d\'imposition (barème 2025)',
    elio_explanation: 'En France, ton impôt n\'est pas calculé d\'un bloc : chaque part de revenu est taxée à un taux différent selon une tranche. Plus tu gagnes, plus la dernière tranche est élevée — mais seul ce qui dépasse chaque seuil est taxé au taux supérieur.',
    key_numbers_2025: [
      '0% jusqu\'à 11 497€',
      '11% de 11 498€ à 29 315€',
      '30% de 29 316€ à 83 823€',
      '41% de 83 824€ à 180 294€',
      '45% au-delà de 180 294€',
    ],
    who_it_fits: ['Tout contribuable français', 'Comprendre l\'impact d\'un PER ou d\'un don déductible'],
    watch_out_for: ['Un revenu en plus ne fait jamais perdre d\'argent net', 'Le quotient familial change ces seuils selon ton foyer'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F1419',
  },

  frais_reels_vs_forfait_10: {
    id: 'frais_reels_vs_forfait_10',
    title: 'Frais réels vs abattement de 10%',
    elio_explanation: 'Par défaut, l\'administration applique un abattement automatique de 10% sur ton salaire pour couvrir tes frais pro. Mais si tes vrais frais (trajet, télétravail, repas) dépassent ce forfait, tu peux opter pour les frais réels et déduire le vrai montant.',
    key_numbers_2025: [
      'Abattement 10% : min 504€, max 14 426€',
      'Indemnité kilométrique : ~0,529€/km (5 CV, 5 000 km)',
      'Forfait télétravail : 2,70€/jour (max 626,4€)',
    ],
    who_it_fits: ['Tu fais beaucoup de km pour bosser', 'Tu télétravailles régulièrement', 'Tu paies des repas hors de chez toi'],
    watch_out_for: ['Tu dois conserver tous les justificatifs 3 ans', 'À calculer chaque année, l\'option n\'est pas définitive'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F1989',
  },

  per: {
    id: 'per',
    title: 'PER (Plan d\'épargne retraite)',
    elio_explanation: 'Ton PER te permet de déduire tes versements de tes revenus imposables. Si tu es à 30% de tranche, 1 000€ versés te font économiser 300€ d\'impôt. L\'argent est bloqué jusqu\'à la retraite (sauf cas exceptionnels).',
    key_numbers_2025: [
      'Plafond de déduction : 10% des revenus pro (max 35 193€)',
      'Plafond plancher (sans revenu pro) : 4 399€',
      'Sortie : capital ou rente à la retraite',
    ],
    who_it_fits: ['Tu paies plus de 30% d\'impôts', 'Tu as un horizon retraite > 10 ans', 'Tu veux baisser ton impôt cette année'],
    watch_out_for: ['Argent bloqué sauf achat RP, invalidité, décès, surendettement', 'À la sortie, le capital versé est taxé au barème (les plus-values au PFU)'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F10260',
  },

  pea: {
    id: 'pea',
    title: 'PEA (Plan d\'épargne en actions)',
    elio_explanation: 'Le PEA est une enveloppe pour investir en actions européennes avec une fiscalité ultra avantageuse : après 5 ans, tes plus-values ne sont taxées qu\'aux prélèvements sociaux (17,2%), au lieu de 30% sur un compte-titres ordinaire.',
    key_numbers_2025: [
      'Plafond de versement : 150 000€ (PEA classique)',
      'Plafond PEA-PME : 75 000€ (cumulable jusqu\'à 225 000€)',
      'Avant 5 ans : 30% (PFU) ; après : 17,2% seulement',
    ],
    who_it_fits: ['Tu veux investir long terme en actions européennes', 'Tu es OK pour bloquer l\'argent au moins 5 ans'],
    watch_out_for: ['Tout retrait avant 5 ans clôture le PEA', 'Pas d\'actions hors UE/EEE (sauf ETF synthétiques)'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F2385',
  },

  assurance_vie: {
    id: 'assurance_vie',
    title: 'Assurance-vie',
    elio_explanation: 'L\'assurance-vie est l\'enveloppe préférée des Français : flexible, transmissible, et avec une fiscalité douce après 8 ans. Tu peux y mettre fonds euros (sécurisé) ou unités de compte (potentiel de rendement plus élevé).',
    key_numbers_2025: [
      'Après 8 ans : abattement 4 600€ (seul) / 9 200€ (couple) sur les gains',
      'Au décès : abattement 152 500€ par bénéficiaire (versements avant 70 ans)',
      'PFU 30% sur les gains avant 8 ans',
    ],
    who_it_fits: ['Tu veux préparer ta succession', 'Tu cherches un placement souple long terme', 'Tu veux compléter ta retraite'],
    watch_out_for: ['Frais d\'entrée et de gestion variables selon contrat', 'L\'argent reste accessible mais une sortie avant 8 ans est moins fiscalement avantageuse'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F15275',
  },

  micro_entrepreneur: {
    id: 'micro_entrepreneur',
    title: 'Micro-entrepreneur (auto-entrepreneur)',
    elio_explanation: 'Le régime le plus simple pour démarrer en indépendant : pas de comptabilité lourde, cotisations calculées sur ton chiffre d\'affaires. En contrepartie, tu ne peux pas déduire tes frais réels.',
    key_numbers_2025: [
      'Plafond CA services (BIC) : 77 700€ ; ventes : 188 700€',
      'Cotisations : 21,2% (services) ou 12,3% (ventes)',
      'Abattement forfaitaire IR : 50% (services) ou 71% (ventes)',
    ],
    who_it_fits: ['Tu démarres une activité', 'Tu as peu de frais pro', 'Tes revenus restent sous les plafonds'],
    watch_out_for: ['Pas de récupération de TVA sous le seuil de franchise', 'Au-dessus du plafond 2 années de suite : tu bascules en réel'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F23267',
  },

  sasu: {
    id: 'sasu',
    title: 'SASU (Société par actions simplifiée unipersonnelle)',
    elio_explanation: 'La SASU te rend assimilé-salarié : protection sociale du régime général (mais pas le chômage), et tu peux te verser dividendes ou salaire selon ce qui t\'optimise. Plus de paperasse qu\'en micro, mais plus de flexibilité.',
    key_numbers_2025: [
      'Cotisations sur salaire : ~80% du net',
      'Dividendes taxés à 30% (PFU)',
      'IS : 15% jusqu\'à 42 500€ de bénéfice, 25% au-delà',
    ],
    who_it_fits: ['Tu factures > 80k€/an', 'Tu veux séparer ton patrimoine perso et pro', 'Tu vises de gros dividendes'],
    watch_out_for: ['Comptabilité obligatoire (expert-comptable conseillé)', 'Pas de droits chômage en cas d\'arrêt'],
    source_url: 'https://entreprendre.service-public.fr/vosdroits/F31195',
  },

  eurl: {
    id: 'eurl',
    title: 'EURL (Entreprise unipersonnelle à responsabilité limitée)',
    elio_explanation: 'L\'EURL te place sous le régime des Travailleurs Non Salariés (TNS) : cotisations moins lourdes qu\'en SASU mais protection sociale plus faible. Par défaut à l\'IR, tu peux opter pour l\'IS.',
    key_numbers_2025: [
      'Cotisations TNS : ~45% du revenu net',
      'IS optionnel : 15% jusqu\'à 42 500€, 25% au-delà',
      'Capital social : 1€ minimum',
    ],
    who_it_fits: ['Tu veux protéger ton patrimoine perso', 'Tu cherches à payer moins de cotisations qu\'en SASU'],
    watch_out_for: ['Protection sociale TNS plus faible (indemnités journalières limitées)', 'Comptabilité obligatoire'],
    source_url: 'https://entreprendre.service-public.fr/vosdroits/F32887',
  },

  pfu_flat_tax: {
    id: 'pfu_flat_tax',
    title: 'Impôt sur les revenus du capital (30%)',
    elio_explanation: 'Tes intérêts, dividendes et plus-values sont taxés par défaut à 30% : 12,8% d\'impôt + 17,2% de prélèvements sociaux. Tu peux opter pour le barème de l\'IR si c\'est plus avantageux (souvent le cas si tu es non imposable).',
    key_numbers_2025: [
      'Taux global : 30% (12,8% IR + 17,2% PS)',
      'Option barème : possible chaque année (case 2OP)',
      'Abattement 40% sur dividendes si option barème',
    ],
    who_it_fits: ['Tu as des revenus de capital (dividendes, plus-values, intérêts)', 'Tu es dans une tranche IR ≥ 30%'],
    watch_out_for: ['L\'option barème s\'applique à TOUS tes revenus du capital de l\'année', 'À recalculer chaque année'],
    source_url: 'https://www.impots.gouv.fr/particulier/le-prelevement-forfaitaire-unique-pfu',
  },

  lmnp: {
    id: 'lmnp',
    title: 'LMNP (Location meublée non professionnelle)',
    elio_explanation: 'Si tu loues un bien meublé sans dépasser 23 000€/an de loyers (ou < 50% de tes revenus), tu es LMNP. Le régime réel te permet d\'amortir le bien et de neutraliser fiscalement les loyers pendant des années.',
    key_numbers_2025: [
      'Micro-BIC : abattement 50% (meublé classique) ou 30% (meublé tourisme non classé)',
      'Réel : déduction frais + amortissement bien (~2-3%/an)',
      'Plafond micro-BIC : 77 700€ (15 000€ pour meublé tourisme non classé depuis 2025)',
    ],
    who_it_fits: ['Tu loues un appartement ou une maison meublée', 'Tu veux des loyers peu fiscalisés long terme'],
    watch_out_for: ['Loi anti-Airbnb 2025 : seuils micro-BIC réduits pour meublé tourisme', 'Comptabilité complexe en réel : expert-comptable conseillé'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F32805',
  },

  scpi: {
    id: 'scpi',
    title: 'SCPI (Société civile de placement immobilier)',
    elio_explanation: 'Tu achètes des parts de SCPI et tu touches des loyers proportionnels, sans gérer le moindre locataire. Les rendements moyens 2024 tournent autour de 4,5%. Fiscalité : revenus fonciers (barème + 17,2%).',
    key_numbers_2025: [
      'Rendement moyen 2024 : ~4,5% brut',
      'Frais d\'entrée : 8 à 12% du prix de la part',
      'Fiscalité : revenus fonciers (TMI + 17,2% PS)',
    ],
    who_it_fits: ['Tu veux du rendement immobilier sans gestion', 'Tu peux placer pour 8-10 ans minimum'],
    watch_out_for: ['Fiscalité lourde si tranche élevée (préférer SCPI européennes ou en démembrement)', 'Pas de garantie en capital'],
    source_url: 'https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/produits-financiers/scpi',
  },

  deficit_foncier: {
    id: 'deficit_foncier',
    title: 'Déficit foncier',
    elio_explanation: 'Si tu fais des travaux dans un bien locatif nu et que tes charges dépassent tes loyers, tu génères un déficit foncier déductible de tes revenus globaux jusqu\'à 10 700€/an. Le surplus se reporte 10 ans.',
    key_numbers_2025: [
      'Déduction du revenu global : jusqu\'à 10 700€/an',
      'Doublé à 21 400€ pour travaux de rénovation énergétique (2024-2025)',
      'Report du déficit : 10 ans sur revenus fonciers',
    ],
    who_it_fits: ['Tu as un locatif nu au régime réel', 'Tu prévois de gros travaux (toiture, isolation, électricité)'],
    watch_out_for: ['Les travaux d\'agrandissement / construction ne comptent pas', 'Tu dois louer le bien au moins 3 ans après la déduction'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F2402',
  },

  quotient_familial: {
    id: 'quotient_familial',
    title: 'Quotient familial',
    elio_explanation: 'Plus ton foyer est grand, plus ton revenu imposable est divisé par un nombre de "parts" élevé : ça baisse mécaniquement ton impôt. Un célibataire = 1 part, marié/pacsé = 2 parts, +0,5 par enfant (1 part dès le 3e).',
    key_numbers_2025: [
      'Plafonnement : 1 791€/demi-part (cas général)',
      '1 enfant = +0,5 part ; 3e enfant = +1 part',
      'Parent isolé (case T) : +0,5 part supplémentaire',
    ],
    who_it_fits: ['Tu as un ou plusieurs enfants', 'Tu es marié/pacsé', 'Tu es parent isolé'],
    watch_out_for: ['L\'avantage est plafonné, donc moins d\'effet pour les très hauts revenus', 'Garde alternée : demi-part partagée entre les deux parents'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F2705',
  },

  reduction_pinel: {
    id: 'reduction_pinel',
    title: 'Pinel (en extinction)',
    elio_explanation: 'Le dispositif Pinel s\'éteint au 31 décembre 2024 — il n\'est plus accessible pour 2025. Si tu en as un en cours, ta réduction d\'impôt continue selon ton engagement (6, 9 ou 12 ans).',
    key_numbers_2025: [
      'Plus de nouveaux Pinel depuis le 1er janvier 2025',
      'Engagements en cours : 9% (6 ans), 12% (9 ans), 14% (12 ans) du prix',
      'Plafond investissement : 300 000€/an, 5 500€/m²',
    ],
    who_it_fits: ['Tu as déjà un Pinel en cours (la réduction continue)'],
    watch_out_for: ['Pinel = bien souvent surcoté, vérifier la rentabilité hors avantage fiscal', 'Loc\'Avantages reste une alternative'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F31151',
  },

  credit_impot_emploi_domicile: {
    id: 'credit_impot_emploi_domicile',
    title: 'Crédit d\'impôt emploi à domicile',
    elio_explanation: 'Si tu emploies une aide à domicile (ménage, garde d\'enfants, jardinage, soutien scolaire), tu récupères 50% des sommes versées sous forme de crédit d\'impôt. Même si tu n\'es pas imposable, l\'État te rembourse.',
    key_numbers_2025: [
      'Crédit : 50% des dépenses',
      'Plafond annuel : 12 000€ (15 000€ la 1re année, +1 500€ par enfant à charge, max 20 000€)',
      'Avance immédiate possible via CESU',
    ],
    who_it_fits: ['Tu emploies une femme de ménage, nounou, jardinier...', 'Tu utilises le CESU'],
    watch_out_for: ['Conserve les justificatifs (URSSAF, CESU)', 'Activités éligibles strictement listées'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F12',
  },

  '2086_crypto': {
    id: '2086_crypto',
    title: 'Déclaration crypto (formulaire 2086)',
    elio_explanation: 'Quand tu vends de la crypto contre des euros (ou que tu l\'utilises pour acheter un bien), tu dois déclarer la plus-value sur le formulaire 2086. Les échanges crypto-crypto ne sont PAS imposables. PFU 30% par défaut.',
    key_numbers_2025: [
      'Seuil non imposable : 305€/an de cessions totales',
      'Taux par défaut : 30% (PFU)',
      'Option barème IR possible (case 3CN)',
      'Comptes étrangers : formulaire 3916-bis obligatoire',
    ],
    who_it_fits: ['Tu as vendu de la crypto en 2024', 'Tu détiens un compte sur Binance, Kraken, Coinbase...'],
    watch_out_for: ['Méthode de calcul = prix moyen pondéré du portefeuille global (pas FIFO)', 'Oubli compte étranger = 1 500€ d\'amende par compte'],
    source_url: 'https://www.impots.gouv.fr/particulier/cessions-dactifs-numeriques',
  },

  declaration_2042: {
    id: 'declaration_2042',
    title: 'Déclaration de revenus 2042',
    elio_explanation: 'Le formulaire 2042 est ta déclaration principale chaque printemps. Même si elle est pré-remplie, vérifie tout : salaires, frais, charges déductibles (PER, dons), réductions (emploi à domicile, garde d\'enfants).',
    key_numbers_2025: [
      'Déclaration en ligne obligatoire',
      'Dates 2025 : zone 1 ~22 mai, zone 2 ~28 mai, zone 3 ~5 juin',
      'Avis d\'imposition reçu fin juillet',
    ],
    who_it_fits: ['Tout foyer fiscal français'],
    watch_out_for: ['Pas de déclaration = 10% de majoration', 'Profite de la fenêtre de correction (août à décembre) si tu repères une erreur'],
    source_url: 'https://www.impots.gouv.fr/particulier/questions/quelles-sont-les-dates-limites-de-depot-de-la-declaration-de-revenus',
  },

  urssaf_cotisations: {
    id: 'urssaf_cotisations',
    title: 'Cotisations URSSAF',
    elio_explanation: 'Tes cotisations sociales financent ta protection sociale (santé, retraite, allocations). En micro, c\'est un % fixe du CA (12,3% à 21,2%). En réel, c\'est calculé sur ton bénéfice avec un système d\'appels provisionnels + régularisation N+1.',
    key_numbers_2025: [
      'Micro services BNC/BIC : 21,2%',
      'Micro ventes : 12,3%',
      'TNS réel : ~45% du revenu net',
      'Versement libératoire IR : +1,7% à 2,2% (option)',
    ],
    who_it_fits: ['Tous les indépendants (micro, EI, EURL, gérants majoritaires)'],
    watch_out_for: ['En réel, prévoir la régularisation N+1 (parfois lourde)', 'L\'ACRE (1re année) divise les cotisations par 2'],
    source_url: 'https://www.urssaf.fr/accueil/independant/quelles-cotisations.html',
  },

  tva_franchise: {
    id: 'tva_franchise',
    title: 'Franchise en base de TVA',
    elio_explanation: 'En dessous de certains seuils de CA, tu n\'as pas à facturer ni reverser la TVA. Tu mets "TVA non applicable, art. 293 B du CGI" sur tes factures. Au-dessus, tu deviens redevable et dois facturer 20% (ou 10%, 5,5%).',
    key_numbers_2025: [
      'Seuil services : 37 500€',
      'Seuil ventes : 85 000€',
      'Tolérance majoré : 41 250€ (services) / 93 500€ (ventes)',
      'Loi de finances 2025 : seuil unique 25 000€ envisagé (suspendu)',
    ],
    who_it_fits: ['Micro-entrepreneurs en début d\'activité', 'Petits indépendants avec clients particuliers'],
    watch_out_for: ['Pas de récupération de la TVA sur tes achats pro', 'Si tes clients sont des entreprises, l\'assujettissement n\'est pas un frein'],
    source_url: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F21746',
  },

  ifi: {
    id: 'ifi',
    title: 'IFI (Impôt sur la fortune immobilière)',
    elio_explanation: 'L\'IFI taxe ton patrimoine immobilier net (hors RP partielle) au-delà de 1,3 M€. Seul l\'immobilier compte (pas les actions ni l\'épargne). Barème progressif de 0,5% à 1,5%.',
    key_numbers_2025: [
      'Seuil de déclenchement : 1 300 000€',
      'Abattement résidence principale : 30%',
      'Barème : 0,5% (800k-1,3M) à 1,5% (>10M)',
    ],
    who_it_fits: ['Tu as un patrimoine immobilier net > 1,3 M€'],
    watch_out_for: ['Les SCI/SCPI sont incluses', 'Les dettes immobilières sont déductibles (sous conditions)'],
    source_url: 'https://www.service-public.fr/particuliers/vosdroits/F563',
  },
};

export const FISCAL_CONCEPT_IDS = Object.keys(FISCAL_CONCEPTS);
