import { FieldTooltipData } from '../FieldTooltip';

export const TAX_TOOLTIPS: Record<string, FieldTooltipData> = {
  taxMode: {
    shortTip: "Mode de calcul fiscal",
    definition: "Choisissez comment calculer l'impôt : simple (TMI + prélèvements), régime paramétré, ou saisie manuelle.",
    impact: "Le mode détermine la précision du calcul fiscal et les options disponibles.",
    typicalValue: "Simple pour une estimation rapide, Régime pour plus de précision.",
    source: "Votre situation fiscale et vos besoins de simulation.",
  },

  tmi: {
    shortTip: "Tranche Marginale d'Imposition",
    definition: "La TMI est le taux d'imposition appliqué à la dernière tranche de vos revenus. C'est le taux qui s'applique à vos revenus fonciers supplémentaires.",
    impact: "Plus votre TMI est élevée, plus les revenus fonciers seront taxés. Le choix du régime fiscal devient crucial.",
    typicalValue: "0%, 11%, 30%, 41% ou 45% selon vos revenus.",
    source: "Votre dernier avis d'imposition, page 2.",
    example: "Revenus de 40 000€ → TMI à 30%."
  },

  socialRate: {
    shortTip: "Prélèvements sociaux sur revenus fonciers",
    definition: "Les prélèvements sociaux (CSG, CRDS, prélèvement de solidarité) s'ajoutent à l'impôt sur le revenu foncier.",
    impact: "S'appliquent sur le revenu foncier net, en plus de l'IR. Taux fixe pour tous.",
    typicalValue: "17.2% actuellement (peut évoluer avec la législation).",
    source: "Code de la sécurité sociale, taux en vigueur.",
  },

  regimeKey: {
    shortTip: "Régime fiscal applicable",
    definition: "Le régime fiscal détermine les règles de calcul de l'impôt : abattement forfaitaire (micro) ou déduction des charges réelles.",
    impact: "Le choix du régime peut faire varier l'impôt de plusieurs milliers d'euros.",
    typicalValue: "Micro si revenus < 15 000€/an, Réel si charges > 30% des loyers.",
    source: "Simulation comparative entre régimes, expert-comptable.",
    example: "Loyers 10 000€ avec 4 000€ de charges → Réel plus avantageux."
  },

  microFoncier: {
    shortTip: "Abattement forfaitaire de 30%",
    definition: "Le régime micro-foncier applique un abattement de 30% sur les loyers bruts, censé couvrir forfaitairement toutes les charges.",
    impact: "Simple mais rarement optimal si vous avez des charges réelles importantes ou un crédit.",
    typicalValue: "Limité à 15 000€ de revenus fonciers annuels.",
    source: "Article 32 du CGI.",
  },

  microBic: {
    shortTip: "Abattement forfaitaire de 50%",
    definition: "Le régime micro-BIC (meublé) applique un abattement de 50% sur les loyers bruts (71% pour le classé tourisme).",
    impact: "Plus avantageux que le micro-foncier, mais le réel peut l'être encore plus avec l'amortissement.",
    typicalValue: "Limité à 77 700€ de recettes annuelles (188 700€ classé).",
    source: "Article 50-0 du CGI.",
  },

  reelFoncier: {
    shortTip: "Déduction des charges réelles",
    definition: "Le régime réel permet de déduire toutes les charges réelles : intérêts, travaux, assurance, gestion, taxe foncière...",
    impact: "Optimal si charges > 30% des loyers ou si vous avez un crédit avec beaucoup d'intérêts.",
    typicalValue: "Obligatoire au-delà de 15 000€ de revenus fonciers.",
    source: "Articles 28 à 31 du CGI.",
  },

  lmnpReel: {
    shortTip: "LMNP au réel avec amortissement",
    definition: "Le LMNP réel permet de déduire les charges ET d'amortir le bien (bâti, mobilier, travaux), créant souvent un déficit fiscal.",
    impact: "Régime le plus optimisé fiscalement pour le meublé. Peut générer 0€ d'impôt pendant des années.",
    typicalValue: "Revenus BIC < 77 700€/an, moins de 23 000€ ou 50% des revenus du foyer.",
    source: "Expert-comptable LMNP, articles 39 C et 39 G du CGI.",
  },

  sciIs: {
    shortTip: "SCI à l'Impôt sur les Sociétés",
    definition: "La SCI à l'IS est imposée comme une société : 15% jusqu'à 42 500€ de bénéfice, 25% au-delà.",
    impact: "Permet l'amortissement et la capitalisation, mais imposition à la revente et dividendes taxés.",
    typicalValue: "Intéressant pour patrimoines importants et stratégie de capitalisation.",
    source: "Expert-comptable, fiscaliste spécialisé.",
  },

  interestDeductible: {
    shortTip: "Déduction des intérêts d'emprunt",
    definition: "Au régime réel, les intérêts d'emprunt sont déductibles du revenu foncier ou BIC.",
    impact: "Réduit significativement l'impôt, surtout en début de prêt quand les intérêts sont élevés.",
    typicalValue: "Déduction totale des intérêts versés dans l'année.",
    source: "Tableau d'amortissement de votre banque.",
  },

  costsDeductible: {
    shortTip: "Déduction des charges d'exploitation",
    definition: "Au régime réel, les charges d'exploitation sont déductibles : taxe foncière, assurance, gestion, entretien...",
    impact: "Réduit la base imposable, donc l'impôt.",
    typicalValue: "Toutes les charges justifiées et liées à l'activité locative.",
    source: "Factures et justificatifs de paiement.",
  },

  amortization: {
    shortTip: "Déduction comptable de la valeur du bien",
    definition: "L'amortissement permet de déduire fiscalement la perte de valeur théorique du bien (bâti, mobilier, travaux) de vos revenus.",
    impact: "Réduit fortement l'imposition en LMNP réel ou SCI IS. Peut créer un déficit reportable.",
    typicalValue: "Bâti sur 30-50 ans, mobilier sur 5-10 ans, travaux sur 10-15 ans.",
    source: "Comptable spécialisé LMNP ou expert-comptable.",
  },

  amortizationComponents: {
    shortTip: "Ventilation de l'amortissement par composant",
    definition: "L'amortissement se ventile entre les différents composants du bien : structure, toiture, installations, mobilier, travaux.",
    impact: "Une ventilation optimisée accélère la déduction fiscale sur les composants à durée courte.",
    typicalValue: "Structure 50-60%, toiture 5-10%, installations 10-15%, mobilier 10-15%.",
    source: "Expert-comptable, barèmes fiscaux.",
  },

  deficit: {
    shortTip: "Report du déficit foncier",
    definition: "Le déficit foncier (charges > revenus) est reportable sur les revenus fonciers des 10 années suivantes, et jusqu'à 10 700€/an sur le revenu global.",
    impact: "Permet de lisser l'imposition dans le temps et d'optimiser les années à forte charge.",
    typicalValue: "Report sur 10 ans pour le déficit foncier.",
    source: "Article 156 du CGI.",
    example: "Déficit de 5 000€ en N → reporté sur les loyers de N+1 à N+10."
  },

  exploitationStartDate: {
    shortTip: "Date de début d'exploitation",
    definition: "La date à laquelle le bien commence à générer des revenus locatifs. Détermine le prorata de la première année.",
    impact: "Impact sur le calcul de l'amortissement et des charges de la première année.",
    typicalValue: "Date de signature du premier bail ou de mise en location.",
    source: "Premier bail signé, annonce de mise en location.",
  },

  annualTaxOverride: {
    shortTip: "Montant d'impôt saisi manuellement",
    definition: "Permet de saisir directement le montant d'impôt annuel si vous avez une estimation précise de votre comptable.",
    impact: "Remplace tous les calculs automatiques par votre propre estimation.",
    typicalValue: "Demandez à votre expert-comptable une simulation fiscale.",
    source: "Simulation fiscale de votre comptable.",
  },

  capitalGainMode: {
    shortTip: "Mode de calcul des plus-values",
    definition: "Choisissez entre un calcul simple (taux global) ou avancé (abattements pour durée de détention).",
    impact: "Le mode avancé est plus précis mais nécessite plus d'informations.",
    typicalValue: "Simple pour une estimation rapide, Avancé pour une simulation de revente.",
    source: "Articles 150 U et suivants du CGI.",
  },

  capitalGainRate: {
    shortTip: "Taux global sur plus-values immobilières",
    definition: "Le taux d'imposition sur la plus-value immobilière, incluant IR (19%) et prélèvements sociaux (17.2%).",
    impact: "Des abattements s'appliquent selon la durée de détention (exonération totale après 22/30 ans).",
    typicalValue: "36.2% sans abattement, dégressif avec le temps.",
    source: "Service des impôts, notaire lors de la vente.",
  },
};

// Tax regimes configuration
export const TAX_REGIMES_CONFIG = [
  { 
    key: 'micro_foncier', 
    label: 'Micro-foncier', 
    description: 'Abattement 30%, max 15 000€/an',
    locationType: ['nu'],
    abattement: 30,
    plafond: 15000,
  },
  { 
    key: 'reel_foncier', 
    label: 'Réel foncier', 
    description: 'Déduction charges réelles',
    locationType: ['nu'],
    abattement: 0,
    plafond: null,
  },
  { 
    key: 'micro_bic', 
    label: 'Micro-BIC', 
    description: 'Abattement 50%, max 77 700€/an',
    locationType: ['meuble', 'coloc', 'saisonnier'],
    abattement: 50,
    plafond: 77700,
  },
  { 
    key: 'micro_bic_classe', 
    label: 'Micro-BIC Classé', 
    description: 'Abattement 71%, max 188 700€/an',
    locationType: ['saisonnier'],
    abattement: 71,
    plafond: 188700,
  },
  { 
    key: 'lmnp_reel', 
    label: 'LMNP Réel', 
    description: 'Charges + amortissement',
    locationType: ['meuble', 'coloc', 'saisonnier'],
    abattement: 0,
    plafond: null,
  },
  { 
    key: 'lmp_reel', 
    label: 'LMP Réel', 
    description: 'Professionnel, charges + amortissement',
    locationType: ['meuble', 'coloc', 'saisonnier'],
    abattement: 0,
    plafond: null,
  },
  { 
    key: 'sci_ir', 
    label: 'SCI à l\'IR', 
    description: 'Transparence fiscale',
    locationType: ['nu', 'meuble'],
    abattement: 0,
    plafond: null,
  },
  { 
    key: 'sci_is', 
    label: 'SCI à l\'IS', 
    description: '15%/25% + amortissement',
    locationType: ['nu', 'meuble'],
    abattement: 0,
    plafond: null,
  },
];

// TMI brackets for reference
export const TMI_BRACKETS = [
  { rate: 0, label: '0%', range: 'Jusqu\'à 11 294€' },
  { rate: 11, label: '11%', range: '11 294€ - 28 797€' },
  { rate: 30, label: '30%', range: '28 797€ - 82 341€' },
  { rate: 41, label: '41%', range: '82 341€ - 177 106€' },
  { rate: 45, label: '45%', range: 'Au-delà de 177 106€' },
];
