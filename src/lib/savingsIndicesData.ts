/**
 * Données détaillées sur les indices et ETF disponibles pour PEA/PER
 * Basé sur les données de marché 2024-2025
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AssetClass = 'actions' | 'obligations' | 'monetaire' | 'immobilier' | 'mixte';

export type GeographicZone = 'monde' | 'europe' | 'usa' | 'emergents' | 'france' | 'asie';

export interface IndexPerformance {
  year: number;
  return: number; // en %
}

export interface IndexComposition {
  sector: string;
  weight: number; // en %
  color: string;
}

export interface TopHolding {
  name: string;
  ticker: string;
  weight: number; // en %
  country: string;
}

export interface IndexData {
  id: string;
  name: string;
  shortName: string;
  isin?: string;
  description: string;
  assetClass: AssetClass;
  geographicZone: GeographicZone;
  riskLevel: RiskLevel; // SRRI 1-7
  eligiblePEA: boolean;
  eligiblePER: boolean;
  
  // Performance (données réelles ou estimées)
  annualizedReturn10Y: number; // Rendement annualisé 10 ans
  annualizedReturn5Y: number;  // Rendement annualisé 5 ans
  annualizedReturn1Y: number;  // Rendement 2024
  volatility: number;          // Volatilité annuelle moyenne
  maxDrawdown: number;         // Perte max historique
  
  // Historique simplifié
  historicalPerformance: IndexPerformance[];
  
  // Composition
  composition: IndexComposition[];
  topHoldings: TopHolding[];
  numberOfHoldings: number;
  
  // Frais typiques
  typicalTER: number; // Total Expense Ratio moyen des ETF
  
  // Risques spécifiques
  risks: string[];
  advantages: string[];
  
  // Pour qui ?
  suitableFor: string[];
  notSuitableFor: string[];
}

export interface RiskProfile {
  id: string;
  name: string;
  description: string;
  riskTolerance: RiskLevel;
  suggestedAllocation: {
    indexId: string;
    weight: number;
  }[];
  expectedReturn: number;
  expectedVolatility: number;
  horizon: string;
}

// ============================================================================
// DONNÉES DES INDICES
// ============================================================================

export const INDICES_DATA: IndexData[] = [
  // -------------------------------------------------------------------------
  // ACTIONS MONDE
  // -------------------------------------------------------------------------
  {
    id: 'msci-world',
    name: 'MSCI World',
    shortName: 'World',
    description: 'Indice regroupant environ 1 500 grandes et moyennes capitalisations de 23 pays développés. C\'est la référence mondiale pour l\'investissement passif en actions.',
    assetClass: 'actions',
    geographicZone: 'monde',
    riskLevel: 5,
    eligiblePEA: true, // Via ETF synthétiques
    eligiblePER: true,
    
    annualizedReturn10Y: 10.8,
    annualizedReturn5Y: 12.4,
    annualizedReturn1Y: 25.2, // 2024
    volatility: 15.2,
    maxDrawdown: -34, // 2008-2009
    
    historicalPerformance: [
      { year: 2024, return: 25.2 },
      { year: 2023, return: 23.8 },
      { year: 2022, return: -18.1 },
      { year: 2021, return: 21.8 },
      { year: 2020, return: 15.9 },
      { year: 2019, return: 27.7 },
      { year: 2018, return: -8.7 },
      { year: 2017, return: 22.4 },
      { year: 2016, return: 7.5 },
      { year: 2015, return: -0.9 },
    ],
    
    composition: [
      { sector: 'Technologies', weight: 24.5, color: '#3b82f6' },
      { sector: 'Finance', weight: 15.2, color: '#10b981' },
      { sector: 'Santé', weight: 11.8, color: '#f59e0b' },
      { sector: 'Consommation', weight: 10.5, color: '#8b5cf6' },
      { sector: 'Industrie', weight: 10.3, color: '#ef4444' },
      { sector: 'Communication', weight: 7.8, color: '#ec4899' },
      { sector: 'Autres', weight: 19.9, color: '#6b7280' },
    ],
    
    topHoldings: [
      { name: 'Apple', ticker: 'AAPL', weight: 4.8, country: 'USA' },
      { name: 'Microsoft', ticker: 'MSFT', weight: 4.2, country: 'USA' },
      { name: 'NVIDIA', ticker: 'NVDA', weight: 3.9, country: 'USA' },
      { name: 'Amazon', ticker: 'AMZN', weight: 2.4, country: 'USA' },
      { name: 'Alphabet', ticker: 'GOOGL', weight: 2.1, country: 'USA' },
      { name: 'Meta', ticker: 'META', weight: 1.6, country: 'USA' },
      { name: 'Tesla', ticker: 'TSLA', weight: 1.2, country: 'USA' },
      { name: 'Broadcom', ticker: 'AVGO', weight: 1.1, country: 'USA' },
      { name: 'JPMorgan', ticker: 'JPM', weight: 0.9, country: 'USA' },
      { name: 'Eli Lilly', ticker: 'LLY', weight: 0.8, country: 'USA' },
    ],
    numberOfHoldings: 1465,
    
    typicalTER: 0.20,
    
    risks: [
      'Forte exposition aux USA (~70%)',
      'Volatilité actions (pertes possibles de 20-30% sur un an)',
      'Risque de change EUR/USD',
      'Concentration sur les grandes capitalisations tech',
    ],
    advantages: [
      'Diversification mondiale automatique',
      'Exposition aux meilleures entreprises mondiales',
      'Frais très faibles via ETF',
      'Liquidité excellente',
      'Historique de performance solide sur le long terme',
    ],
    
    suitableFor: [
      'Investisseurs long terme (10+ ans)',
      'Débutants cherchant la simplicité',
      'Ceux qui acceptent la volatilité',
    ],
    notSuitableFor: [
      'Horizon court (<5 ans)',
      'Aversion forte au risque',
      'Besoin de revenus réguliers',
    ],
  },
  
  // -------------------------------------------------------------------------
  // ACTIONS EUROPE
  // -------------------------------------------------------------------------
  {
    id: 'stoxx-600',
    name: 'STOXX Europe 600',
    shortName: 'Europe 600',
    description: 'Indice regroupant 600 grandes, moyennes et petites capitalisations de 17 pays européens. Alternative européenne au MSCI World.',
    assetClass: 'actions',
    geographicZone: 'europe',
    riskLevel: 5,
    eligiblePEA: true,
    eligiblePER: true,
    
    annualizedReturn10Y: 7.2,
    annualizedReturn5Y: 8.5,
    annualizedReturn1Y: 8.8, // 2024
    volatility: 14.8,
    maxDrawdown: -45, // 2008-2009
    
    historicalPerformance: [
      { year: 2024, return: 8.8 },
      { year: 2023, return: 12.7 },
      { year: 2022, return: -12.9 },
      { year: 2021, return: 22.2 },
      { year: 2020, return: -4.0 },
      { year: 2019, return: 23.2 },
      { year: 2018, return: -13.2 },
      { year: 2017, return: 10.6 },
      { year: 2016, return: -1.2 },
      { year: 2015, return: 6.8 },
    ],
    
    composition: [
      { sector: 'Finance', weight: 18.5, color: '#10b981' },
      { sector: 'Industrie', weight: 16.2, color: '#ef4444' },
      { sector: 'Santé', weight: 14.8, color: '#f59e0b' },
      { sector: 'Consommation', weight: 12.5, color: '#8b5cf6' },
      { sector: 'Technologies', weight: 8.3, color: '#3b82f6' },
      { sector: 'Énergie', weight: 6.2, color: '#ec4899' },
      { sector: 'Autres', weight: 23.5, color: '#6b7280' },
    ],
    
    topHoldings: [
      { name: 'ASML', ticker: 'ASML', weight: 3.2, country: 'Pays-Bas' },
      { name: 'Novo Nordisk', ticker: 'NOVO-B', weight: 2.8, country: 'Danemark' },
      { name: 'Nestlé', ticker: 'NESN', weight: 2.1, country: 'Suisse' },
      { name: 'LVMH', ticker: 'MC', weight: 1.9, country: 'France' },
      { name: 'SAP', ticker: 'SAP', weight: 1.7, country: 'Allemagne' },
      { name: 'Roche', ticker: 'ROG', weight: 1.5, country: 'Suisse' },
      { name: 'AstraZeneca', ticker: 'AZN', weight: 1.4, country: 'UK' },
      { name: 'Shell', ticker: 'SHEL', weight: 1.3, country: 'UK' },
      { name: 'TotalEnergies', ticker: 'TTE', weight: 1.2, country: 'France' },
      { name: 'Siemens', ticker: 'SIE', weight: 1.1, country: 'Allemagne' },
    ],
    numberOfHoldings: 600,
    
    typicalTER: 0.15,
    
    risks: [
      'Croissance économique européenne plus faible que US',
      'Risques géopolitiques (Ukraine, Brexit)',
      'Moins de valeurs tech à forte croissance',
      'Démographie vieillissante',
    ],
    advantages: [
      'Éligible PEA sans synthétique',
      'Pas de risque de change EUR',
      'Valorisations plus attractives que US',
      'Dividendes plus élevés (~3%)',
      'Diversification sectorielle équilibrée',
    ],
    
    suitableFor: [
      'Investisseurs privilégiant l\'Europe',
      'Recherche de dividendes',
      'Complément à un ETF World',
    ],
    notSuitableFor: [
      'Recherche de forte croissance',
      'Exposition tech importante souhaitée',
    ],
  },
  
  // -------------------------------------------------------------------------
  // ACTIONS USA
  // -------------------------------------------------------------------------
  {
    id: 'sp500',
    name: 'S&P 500',
    shortName: 'S&P 500',
    description: 'Indice des 500 plus grandes entreprises américaines. Référence historique de la performance boursière mondiale.',
    assetClass: 'actions',
    geographicZone: 'usa',
    riskLevel: 5,
    eligiblePEA: true, // Via ETF synthétiques
    eligiblePER: true,
    
    annualizedReturn10Y: 13.1,
    annualizedReturn5Y: 14.8,
    annualizedReturn1Y: 28.5, // 2024
    volatility: 16.5,
    maxDrawdown: -50, // 2008-2009
    
    historicalPerformance: [
      { year: 2024, return: 28.5 },
      { year: 2023, return: 26.3 },
      { year: 2022, return: -18.1 },
      { year: 2021, return: 28.7 },
      { year: 2020, return: 18.4 },
      { year: 2019, return: 31.5 },
      { year: 2018, return: -4.4 },
      { year: 2017, return: 21.8 },
      { year: 2016, return: 12.0 },
      { year: 2015, return: 1.4 },
    ],
    
    composition: [
      { sector: 'Technologies', weight: 31.5, color: '#3b82f6' },
      { sector: 'Finance', weight: 13.2, color: '#10b981' },
      { sector: 'Santé', weight: 11.5, color: '#f59e0b' },
      { sector: 'Consommation', weight: 10.8, color: '#8b5cf6' },
      { sector: 'Communication', weight: 9.2, color: '#ec4899' },
      { sector: 'Industrie', weight: 8.3, color: '#ef4444' },
      { sector: 'Autres', weight: 15.5, color: '#6b7280' },
    ],
    
    topHoldings: [
      { name: 'Apple', ticker: 'AAPL', weight: 7.2, country: 'USA' },
      { name: 'Microsoft', ticker: 'MSFT', weight: 6.8, country: 'USA' },
      { name: 'NVIDIA', ticker: 'NVDA', weight: 6.1, country: 'USA' },
      { name: 'Amazon', ticker: 'AMZN', weight: 3.8, country: 'USA' },
      { name: 'Alphabet', ticker: 'GOOGL', weight: 3.5, country: 'USA' },
      { name: 'Meta', ticker: 'META', weight: 2.5, country: 'USA' },
      { name: 'Berkshire', ticker: 'BRK.B', weight: 1.7, country: 'USA' },
      { name: 'Tesla', ticker: 'TSLA', weight: 1.6, country: 'USA' },
      { name: 'JPMorgan', ticker: 'JPM', weight: 1.4, country: 'USA' },
      { name: 'UnitedHealth', ticker: 'UNH', weight: 1.2, country: 'USA' },
    ],
    numberOfHoldings: 503,
    
    typicalTER: 0.07,
    
    risks: [
      'Concentration géographique (100% USA)',
      'Risque de change EUR/USD important',
      'Valorisations élevées (PER ~22x)',
      'Concentration sur les "Magnificent 7"',
    ],
    advantages: [
      'Économie la plus dynamique au monde',
      'Innovation et tech leaders mondiaux',
      'Liquidité exceptionnelle',
      'Frais très faibles',
      'Historique de surperformance',
    ],
    
    suitableFor: [
      'Conviction sur l\'économie US',
      'Horizon très long terme',
      'Acceptation du risque de change',
    ],
    notSuitableFor: [
      'Recherche de diversification géographique',
      'Aversion au risque de change',
    ],
  },
  
  // -------------------------------------------------------------------------
  // OBLIGATIONS
  // -------------------------------------------------------------------------
  {
    id: 'euro-aggregate',
    name: 'Bloomberg Euro Aggregate',
    shortName: 'Oblig Euro',
    description: 'Indice d\'obligations investment grade libellées en euros : États, entreprises, covered bonds. Stabilité et revenus réguliers.',
    assetClass: 'obligations',
    geographicZone: 'europe',
    riskLevel: 3,
    eligiblePEA: false,
    eligiblePER: true,
    
    annualizedReturn10Y: 1.2,
    annualizedReturn5Y: -0.8,
    annualizedReturn1Y: 4.2, // 2024
    volatility: 4.5,
    maxDrawdown: -18, // 2022
    
    historicalPerformance: [
      { year: 2024, return: 4.2 },
      { year: 2023, return: 7.2 },
      { year: 2022, return: -17.2 },
      { year: 2021, return: -2.8 },
      { year: 2020, return: 4.0 },
      { year: 2019, return: 6.0 },
      { year: 2018, return: 0.4 },
      { year: 2017, return: 0.5 },
      { year: 2016, return: 3.3 },
      { year: 2015, return: 1.0 },
    ],
    
    composition: [
      { sector: 'Souverains', weight: 58.0, color: '#3b82f6' },
      { sector: 'Entreprises', weight: 22.0, color: '#10b981' },
      { sector: 'Covered Bonds', weight: 12.0, color: '#f59e0b' },
      { sector: 'Agences', weight: 8.0, color: '#8b5cf6' },
    ],
    
    topHoldings: [
      { name: 'France OAT', ticker: 'FR', weight: 22.5, country: 'France' },
      { name: 'Bund Allemand', ticker: 'DE', weight: 18.3, country: 'Allemagne' },
      { name: 'BTP Italien', ticker: 'IT', weight: 15.2, country: 'Italie' },
      { name: 'Bonos Espagne', ticker: 'ES', weight: 11.8, country: 'Espagne' },
      { name: 'Oblig Pays-Bas', ticker: 'NL', weight: 5.2, country: 'Pays-Bas' },
    ],
    numberOfHoldings: 3500,
    
    typicalTER: 0.15,
    
    risks: [
      'Sensibilité aux taux d\'intérêt',
      'Rendement réel potentiellement négatif après inflation',
      'Risque de crédit sur entreprises',
      'Pertes importantes si hausse des taux',
    ],
    advantages: [
      'Volatilité bien plus faible que les actions',
      'Revenus réguliers (coupons)',
      'Décorrélation partielle avec les actions',
      'Pas de risque de change EUR',
    ],
    
    suitableFor: [
      'Profils prudents',
      'Approche de la retraite',
      'Complément stabilisateur',
    ],
    notSuitableFor: [
      'Recherche de performance',
      'Horizon très long terme',
    ],
  },
  
  // -------------------------------------------------------------------------
  // FONDS EUROS (PER uniquement)
  // -------------------------------------------------------------------------
  {
    id: 'fonds-euros',
    name: 'Fonds Euros',
    shortName: 'Fonds €',
    description: 'Support garanti en capital disponible uniquement dans les contrats d\'assurance vie et PER. Rendement modéré mais sécurisé.',
    assetClass: 'monetaire',
    geographicZone: 'europe',
    riskLevel: 1,
    eligiblePEA: false,
    eligiblePER: true,
    
    annualizedReturn10Y: 1.8,
    annualizedReturn5Y: 2.1,
    annualizedReturn1Y: 2.6, // 2024 moyenne
    volatility: 0.2,
    maxDrawdown: 0, // Garanti en capital
    
    historicalPerformance: [
      { year: 2024, return: 2.6 },
      { year: 2023, return: 2.5 },
      { year: 2022, return: 2.0 },
      { year: 2021, return: 1.3 },
      { year: 2020, return: 1.3 },
      { year: 2019, return: 1.5 },
      { year: 2018, return: 1.8 },
      { year: 2017, return: 1.8 },
      { year: 2016, return: 1.9 },
      { year: 2015, return: 2.3 },
    ],
    
    composition: [
      { sector: 'Obligations État', weight: 45.0, color: '#3b82f6' },
      { sector: 'Obligations entreprises', weight: 30.0, color: '#10b981' },
      { sector: 'Immobilier', weight: 10.0, color: '#f59e0b' },
      { sector: 'Actions', weight: 8.0, color: '#8b5cf6' },
      { sector: 'Monétaire', weight: 7.0, color: '#6b7280' },
    ],
    
    topHoldings: [],
    numberOfHoldings: 0,
    
    typicalTER: 0.60,
    
    risks: [
      'Rendement réel potentiellement négatif après inflation',
      'Performance en baisse sur la décennie',
      'Frais de gestion annuels (0.5-1%)',
      'Garantie en capital uniquement sur le brut',
    ],
    advantages: [
      'Capital garanti (hors faillite assureur)',
      'Effet cliquet : gains acquis définitivement',
      'Aucune volatilité visible',
      'Idéal pour sécuriser avant la retraite',
    ],
    
    suitableFor: [
      'Profils très prudents',
      'Sécurisation progressive',
      'Court terme (<3 ans)',
    ],
    notSuitableFor: [
      'Recherche de performance',
      'Horizon long terme (>10 ans)',
    ],
  },
  
  // -------------------------------------------------------------------------
  // ACTIONS ÉMERGENTS
  // -------------------------------------------------------------------------
  {
    id: 'msci-em',
    name: 'MSCI Emerging Markets',
    shortName: 'Émergents',
    description: 'Indice des marchés émergents : Chine, Taïwan, Inde, Corée, Brésil, etc. Potentiel de croissance élevé mais volatilité importante.',
    assetClass: 'actions',
    geographicZone: 'emergents',
    riskLevel: 6,
    eligiblePEA: true, // Via synthétiques
    eligiblePER: true,
    
    annualizedReturn10Y: 4.2,
    annualizedReturn5Y: 3.8,
    annualizedReturn1Y: 8.1, // 2024
    volatility: 18.5,
    maxDrawdown: -55, // 2008
    
    historicalPerformance: [
      { year: 2024, return: 8.1 },
      { year: 2023, return: 10.3 },
      { year: 2022, return: -19.7 },
      { year: 2021, return: -2.5 },
      { year: 2020, return: 18.3 },
      { year: 2019, return: 18.4 },
      { year: 2018, return: -14.6 },
      { year: 2017, return: 37.3 },
      { year: 2016, return: 11.2 },
      { year: 2015, return: -14.9 },
    ],
    
    composition: [
      { sector: 'Technologies', weight: 22.5, color: '#3b82f6' },
      { sector: 'Finance', weight: 21.8, color: '#10b981' },
      { sector: 'Consommation', weight: 13.5, color: '#8b5cf6' },
      { sector: 'Communication', weight: 8.2, color: '#ec4899' },
      { sector: 'Énergie', weight: 5.5, color: '#ef4444' },
      { sector: 'Matériaux', weight: 7.8, color: '#f59e0b' },
      { sector: 'Autres', weight: 20.7, color: '#6b7280' },
    ],
    
    topHoldings: [
      { name: 'Taiwan Semiconductor', ticker: 'TSM', weight: 9.8, country: 'Taïwan' },
      { name: 'Tencent', ticker: '0700.HK', weight: 4.2, country: 'Chine' },
      { name: 'Samsung', ticker: '005930.KS', weight: 3.5, country: 'Corée' },
      { name: 'Alibaba', ticker: 'BABA', weight: 2.1, country: 'Chine' },
      { name: 'Reliance', ticker: 'RELIANCE.NS', weight: 1.5, country: 'Inde' },
    ],
    numberOfHoldings: 1440,
    
    typicalTER: 0.18,
    
    risks: [
      'Volatilité très élevée',
      'Risques géopolitiques (Chine, Taïwan)',
      'Risques de change multiples',
      'Gouvernance moins transparente',
      'Croissance chinoise en ralentissement',
    ],
    advantages: [
      'Potentiel de croissance démographique',
      'Valorisations attractives',
      'Diversification géographique',
      'Exposition à la classe moyenne émergente',
    ],
    
    suitableFor: [
      'Investisseurs expérimentés',
      'Horizon très long terme (15+ ans)',
      'Complément à un portefeuille World',
    ],
    notSuitableFor: [
      'Débutants',
      'Profils prudents',
      'Horizon court/moyen terme',
    ],
  },
];

// ============================================================================
// PROFILS D'ALLOCATION
// ============================================================================

export const RISK_PROFILES: RiskProfile[] = [
  {
    id: 'securitaire',
    name: 'Sécuritaire',
    description: 'Capital protégé, rendement modeste. Idéal pour sécuriser avant un projet.',
    riskTolerance: 2,
    suggestedAllocation: [
      { indexId: 'fonds-euros', weight: 80 },
      { indexId: 'euro-aggregate', weight: 20 },
    ],
    expectedReturn: 2.5,
    expectedVolatility: 1.0,
    horizon: '0-3 ans',
  },
  {
    id: 'prudent',
    name: 'Prudent',
    description: 'Priorité à la préservation du capital avec un peu de dynamisme.',
    riskTolerance: 3,
    suggestedAllocation: [
      { indexId: 'fonds-euros', weight: 50 },
      { indexId: 'euro-aggregate', weight: 25 },
      { indexId: 'stoxx-600', weight: 25 },
    ],
    expectedReturn: 3.5,
    expectedVolatility: 4.0,
    horizon: '3-5 ans',
  },
  {
    id: 'equilibre',
    name: 'Équilibré',
    description: 'Équilibre entre sécurité et performance. Le profil le plus courant.',
    riskTolerance: 4,
    suggestedAllocation: [
      { indexId: 'msci-world', weight: 50 },
      { indexId: 'stoxx-600', weight: 20 },
      { indexId: 'euro-aggregate', weight: 20 },
      { indexId: 'fonds-euros', weight: 10 },
    ],
    expectedReturn: 5.5,
    expectedVolatility: 9.0,
    horizon: '5-10 ans',
  },
  {
    id: 'dynamique',
    name: 'Dynamique',
    description: 'Recherche de performance, acceptation de la volatilité.',
    riskTolerance: 5,
    suggestedAllocation: [
      { indexId: 'msci-world', weight: 60 },
      { indexId: 'sp500', weight: 20 },
      { indexId: 'msci-em', weight: 10 },
      { indexId: 'stoxx-600', weight: 10 },
    ],
    expectedReturn: 7.5,
    expectedVolatility: 14.0,
    horizon: '10-15 ans',
  },
  {
    id: 'offensif',
    name: 'Offensif',
    description: 'Performance maximale, volatilité assumée. Réservé aux investisseurs avertis.',
    riskTolerance: 6,
    suggestedAllocation: [
      { indexId: 'sp500', weight: 50 },
      { indexId: 'msci-world', weight: 30 },
      { indexId: 'msci-em', weight: 20 },
    ],
    expectedReturn: 9.0,
    expectedVolatility: 17.0,
    horizon: '15+ ans',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getIndexById(id: string): IndexData | undefined {
  return INDICES_DATA.find(idx => idx.id === id);
}

export function getIndicesByEnvelope(envelope: 'pea' | 'per'): IndexData[] {
  return INDICES_DATA.filter(idx => 
    envelope === 'pea' ? idx.eligiblePEA : idx.eligiblePER
  );
}

export function getRiskProfileById(id: string): RiskProfile | undefined {
  return RISK_PROFILES.find(profile => profile.id === id);
}

export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    1: 'Très faible',
    2: 'Faible',
    3: 'Modéré',
    4: 'Moyen',
    5: 'Élevé',
    6: 'Très élevé',
    7: 'Extrême',
  };
  return labels[level];
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    1: '#10b981', // green
    2: '#22c55e',
    3: '#84cc16', // lime
    4: '#eab308', // yellow
    5: '#f97316', // orange
    6: '#ef4444', // red
    7: '#dc2626', // dark red
  };
  return colors[level];
}

// Performance moyenne PEA France basée sur données réelles
export const FRANCE_AVERAGES = {
  pea: {
    average10Y: 8.5, // Performance moyenne des PEA français
    median10Y: 6.2,
    topQuartile10Y: 12.5,
    bottomQuartile10Y: 2.8,
  },
  per: {
    fondsEuros2024: 2.6, // ACPR 2024
    bestFondsEuros2024: 4.5, // Meilleurs contrats
    uniteCompte10Y: 5.2, // UC moyennes
  },
};
