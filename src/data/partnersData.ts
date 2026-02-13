export type PartnerCategory = 
  | 'per' 
  | 'pea' 
  | 'assurance_vie' 
  | 'neobanque' 
  | 'credit' 
  | 'optimisation_fiscale'
  | 'epargne_salariale'
  | 'comptabilite'
  | 'tresorerie';

export interface Partner {
  id: string;
  name: string;
  url: string;
  cta: string;
  performance?: string;
  description: string;
  features: string[];
  audience: string[];
  fees?: string;
  minInvestment?: number;
  monthlyFee?: string;
  logoUrl?: string;
  category: PartnerCategory;
}

export const PARTNERS: Record<PartnerCategory, Partner[]> = {
  per: [
    {
      id: 'carac-per',
      name: 'Carac',
      url: 'https://www.carac.fr/per',
      cta: 'Ouvrir un PER Carac',
      performance: '4.0%',
      description: 'Meilleur rendement fonds euros 2025, adapté aux TNS',
      features: ['Fonds euros performant', 'ETF', 'SCPI', 'Adapté TNS'],
       audience: ['Salariés', 'Indépendants', 'Professions libérales'],
       fees: '0.60%',
       minInvestment: 0,
       logoUrl: '/logos/carac.svg',
       category: 'per',
    },
    {
      id: 'suravenir-per',
      name: 'Suravenir (Fortuneo)',
      url: 'https://www.fortuneo.fr/per',
      cta: 'Découvrir le PER Suravenir',
      performance: '10.95%',
      description: 'Performance exceptionnelle, accès via banque en ligne',
      features: ['Fonds euros', 'ETF', 'Gestion pilotée', 'Banque en ligne'],
       audience: ['Tous profils'],
       fees: '0.75%',
       minInvestment: 500,
       logoUrl: '/logos/fortuneo.svg',
       category: 'per',
    },
    {
      id: 'nalo-per',
      name: 'Nalo',
      url: 'https://www.nalo.fr/per',
      cta: 'Explorer Nalo',
      performance: undefined,
      description: 'Gestion pilotée automatisée, idéal pour les débutants',
      features: ['Gestion pilotée', 'Allocation automatique', 'Frais réduits'],
       audience: ['Débutants', 'Jeunes actifs'],
       fees: '1.60% tout compris',
       minInvestment: 1000,
       logoUrl: '/logos/nalo.svg',
       category: 'per',
    },
  ],

  pea: [
    {
      id: 'trade-republic-pea',
      name: 'Trade Republic',
      url: 'https://www.traderepublic.com/fr-fr',
      cta: 'Ouvrir un PEA Trade Republic',
      performance: undefined,
      description: 'Interface simple, 1€/ordre, idéal pour débuter',
      features: ['1€ par ordre', 'Interface moderne', 'Plans d\'investissement'],
       audience: ['Débutants', 'Jeunes actifs'],
       fees: '1€/ordre',
       minInvestment: 0,
       logoUrl: '/logos/trade-republic.svg',
       category: 'pea',
    },
    {
      id: 'boursorama-pea',
      name: 'Boursorama',
      url: 'https://www.boursorama.com/bourse/pea/',
      cta: 'Ouvrir un PEA Boursorama',
      performance: undefined,
      description: '0€ de frais de garde, gamme large d\'ETF',
      features: ['0€ frais de garde', 'Large gamme ETF', 'Banque complète'],
       audience: ['Investisseurs actifs', 'Patrimoine moyen-élevé'],
       fees: '0€ garde, 1.99€/ordre',
       minInvestment: 0,
       logoUrl: '/logos/boursorama.svg',
       category: 'pea',
    },
    {
      id: 'fortuneo-pea',
      name: 'Fortuneo',
      url: 'https://www.fortuneo.fr/bourse/pea',
      cta: 'Ouvrir un PEA Fortuneo',
      performance: undefined,
      description: 'Bon compromis frais/gamme, interface moderne',
      features: ['Frais compétitifs', 'Interface intuitive', 'Banque en ligne'],
       audience: ['Tous profils'],
       fees: '0€ garde, 1.95€/ordre',
       minInvestment: 0,
       logoUrl: '/logos/fortuneo.svg',
       category: 'pea',
    },
  ],

  assurance_vie: [
    {
      id: 'linxea-av',
      name: 'Linxea',
      url: 'https://www.linxea.com/',
      cta: 'Découvrir Linxea',
      performance: '3.5%',
      description: 'Courtier en ligne, large choix de supports, frais bas',
      features: ['Large gamme UC', 'Fonds euros performants', 'Frais réduits'],
       audience: ['Épargnants avertis', 'Patrimoine moyen'],
       fees: '0.50%',
       minInvestment: 1000,
       logoUrl: '/logos/linxea.svg',
       category: 'assurance_vie',
    },
    {
      id: 'boursorama-av',
      name: 'Boursorama Vie',
      url: 'https://www.boursorama.com/patrimoine/assurance-vie/',
      cta: 'Ouvrir Boursorama Vie',
      performance: '3.1%',
      description: 'Assurance vie intégrée à la banque, simplicité',
      features: ['Gestion libre/pilotée', 'Intégrée banque', '0€ frais versement'],
       audience: ['Tous profils'],
       fees: '0.75%',
       minInvestment: 300,
       logoUrl: '/logos/boursorama.svg',
       category: 'assurance_vie',
    },
    {
      id: 'yomoni-av',
      name: 'Yomoni',
      url: 'https://www.yomoni.fr/',
      cta: 'Explorer Yomoni',
      performance: undefined,
      description: 'Gestion pilotée 100% en ligne, ETF uniquement',
      features: ['Gestion pilotée', 'ETF diversifiés', 'Robo-advisor'],
       audience: ['Débutants', 'Investisseurs passifs'],
       fees: '1.60% tout compris',
       minInvestment: 1000,
       logoUrl: '/logos/yomoni.svg',
       category: 'assurance_vie',
    },
  ],

  neobanque: [
    {
      id: 'n26',
      name: 'N26',
      url: 'https://www.n26.com/fr-fr',
      cta: 'Ouvrir un compte N26',
      performance: '4.0%',
      description: 'Compte rémunéré jusqu\'à 4%, zéro frais à l\'étranger',
      features: ['Rémunération 4%', 'Zéro frais étranger', 'Assurances incluses'],
       audience: ['Jeunes actifs', 'Voyageurs'],
       fees: undefined,
       monthlyFee: '0€-16.90€',
       minInvestment: 0,
       logoUrl: '/logos/n26.svg',
       category: 'neobanque',
    },
    {
      id: 'revolut',
      name: 'Revolut',
      url: 'https://www.revolut.com/fr-FR',
      cta: 'Ouvrir un compte Revolut',
      performance: '3.5%',
      description: 'Multi-devises, zéro frais, crypto intégrée',
      features: ['Multi-devises', 'Zéro frais change', 'Crypto', 'Trading'],
       audience: ['Voyageurs', 'Internationaux'],
       fees: undefined,
       monthlyFee: '0€-13.99€',
       minInvestment: 0,
       logoUrl: '/logos/revolut.svg',
       category: 'neobanque',
    },
    {
      id: 'bunq',
      name: 'Bunq',
      url: 'https://www.bunq.com/fr',
      cta: 'Ouvrir un compte Bunq',
      performance: '2.51%',
      description: 'Banque éco-responsable, plante des arbres',
      features: ['Éco-responsable', 'Multi-comptes', 'Budgeting'],
       audience: ['Éco-responsables', 'Digitaux'],
       fees: undefined,
       monthlyFee: '0€-17.99€',
       minInvestment: 0,
       logoUrl: '/logos/bunq.svg',
       category: 'neobanque',
    },
  ],

  credit: [
    {
      id: 'fortuneo-credit',
      name: 'Fortuneo',
      url: 'https://www.fortuneo.fr/credit-immobilier',
      cta: 'Simuler mon crédit',
      performance: undefined,
      description: 'Taux compétitifs, 100% en ligne',
      features: ['Taux compétitifs', '100% en ligne', 'Pas de frais de dossier'],
      audience: ['Primo-accédants', 'Investisseurs immobiliers'],
      fees: '0€ frais dossier',
      category: 'credit',
    },
    {
      id: 'boursorama-credit',
      name: 'Boursorama',
      url: 'https://www.boursorama.com/credit-immobilier/',
      cta: 'Simuler chez Boursorama',
      performance: undefined,
      description: 'Crédit immobilier banque en ligne, taux négociés',
      features: ['Taux négociés', 'Banque complète', 'Simulation rapide'],
      audience: ['Tous profils'],
      fees: undefined,
      category: 'credit',
    },
  ],

  optimisation_fiscale: [
    {
      id: 'impots-gouv',
       name: 'Impots.gouv.fr',
       url: 'https://www.impots.gouv.fr/simulateurs',
       cta: 'Accéder aux simulateurs',
       description: 'Simulateurs officiels de l\'administration fiscale',
       features: ['Simulateur IR', 'Barème kilométrique', 'Plus-values'],
       audience: ['Tous contribuables'],
       logoUrl: '/logos/impots.svg',
       category: 'optimisation_fiscale',
    },
  ],

  epargne_salariale: [
    {
      id: 'amundi-ee',
      name: 'Amundi Épargne Entreprise',
      url: 'https://www.amundi-ee.com/',
      cta: 'Accéder à Amundi EE',
      description: 'Plateforme d\'épargne salariale leader en France',
      features: ['PEE', 'PERCO', 'PER Collectif', 'Gestion en ligne'],
       audience: ['Salariés'],
       logoUrl: '/logos/amundi.svg',
       category: 'epargne_salariale',
    },
    {
      id: 'natixis-interepargne',
      name: 'Natixis Interépargne',
      url: 'https://www.interepargne.natixis.com/',
      cta: 'Accéder à Interépargne',
      description: '1er gestionnaire d\'épargne salariale en France',
      features: ['PEE', 'PERCO', 'Intéressement', 'Participation'],
       audience: ['Salariés'],
       logoUrl: '/logos/natixis.svg',
       category: 'epargne_salariale',
    },
  ],

  comptabilite: [
    {
      id: 'indy',
      name: 'Indy',
      url: 'https://www.indy.fr/',
      cta: 'Essayer Indy',
      description: 'Comptabilité automatisée pour indépendants',
      features: ['Comptabilité auto', 'Déclarations', 'Bilan annuel'],
       audience: ['Indépendants', 'Professions libérales'],
       monthlyFee: '0€-22€',
       logoUrl: '/logos/indy.svg',
       category: 'comptabilite',
    },
    {
      id: 'pennylane',
      name: 'Pennylane',
      url: 'https://www.pennylane.com/',
      cta: 'Découvrir Pennylane',
      description: 'Plateforme comptable collaborative avec expert-comptable',
      features: ['Pilotage financier', 'Expert-comptable intégré', 'Facturation'],
       audience: ['PME', 'Startups', 'Indépendants'],
       logoUrl: '/logos/pennylane.svg',
       category: 'comptabilite',
    },
  ],

  tresorerie: [
    {
      id: 'qonto',
      name: 'Qonto',
      url: 'https://www.qonto.com/fr',
      cta: 'Ouvrir un compte Qonto',
      description: 'Compte pro avec outils de gestion de trésorerie',
      features: ['Compte à terme', 'Gestion trésorerie', 'Multi-utilisateurs'],
       audience: ['PME', 'Startups', 'Indépendants'],
       monthlyFee: '9€-249€',
       logoUrl: '/logos/qonto.svg',
       category: 'tresorerie',
    },
    {
      id: 'shine',
      name: 'Shine',
      url: 'https://www.shine.fr/',
      cta: 'Ouvrir un compte Shine',
      description: 'Compte pro pour indépendants avec comptabilité intégrée',
      features: ['Compte pro', 'Comptabilité', 'Assurances pro'],
       audience: ['Indépendants', 'Freelances'],
       monthlyFee: '7.90€-24.90€',
       logoUrl: '/logos/shine.svg',
       category: 'tresorerie',
    },
  ],
};

export const getPartnersByCategory = (category: PartnerCategory): Partner[] => {
  return PARTNERS[category] || [];
};
