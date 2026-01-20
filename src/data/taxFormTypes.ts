// Tax Form Types for French Tax Declaration 2026
// Supports: 2042, 2031, 2035, 2065, 2074, 2047, 2086, 3916

// ============== FORM TYPE ENUM ==============

export type TaxFormType = 
  | '2042'       // Main income declaration
  | '2042-C'     // Complementary (self-employed, capital gains)
  | '2042-C-PRO' // Liberal professions
  | '2042-RICI'  // Reductions and credits
  | '2044'       // Real estate income
  | '2031'       // SCI, LMNP, partnerships
  | '2035'       // Liberal professions (BNC)
  | '2065'       // Corporate tax (IS)
  | '2074'       // Capital gains
  | '2047'       // Foreign income
  | '2086'       // Crypto assets
  | '3916'       // Foreign accounts
  | '3916-bis'   // Foreign digital asset accounts
  | 'unknown';

export interface TaxFormInfo {
  code: TaxFormType;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  commonErrors: string[];
  keyBoxes: string[];
}

export const TAX_FORMS: Record<TaxFormType, TaxFormInfo> = {
  '2042': {
    code: '2042',
    name: 'Déclaration de revenus',
    description: 'Formulaire principal de déclaration des revenus',
    category: 'Déclaration principale',
    complexity: 'medium',
    commonErrors: [
      'Confusion entre net imposable et net perçu',
      'Oubli des revenus exceptionnels',
      'Mauvaise case pour les indemnités'
    ],
    keyBoxes: ['1AJ', '1BJ', '0', 'C', 'D', 'N', 'H', 'G']
  },
  '2042-C': {
    code: '2042-C',
    name: 'Déclaration complémentaire',
    description: 'Revenus et plus-values complémentaires',
    category: 'Déclaration principale',
    complexity: 'complex',
    commonErrors: [
      'Plus-values non déclarées',
      'Mauvais régime fiscal choisi',
      'Oubli de l\'abattement pour durée de détention'
    ],
    keyBoxes: ['3VG', '3VH', '5HQ', '5IQ']
  },
  '2042-C-PRO': {
    code: '2042-C-PRO',
    name: 'Revenus professionnels',
    description: 'BIC, BNC, BA professionnels',
    category: 'Revenus non salariés',
    complexity: 'complex',
    commonErrors: [
      'Dépassement seuil micro sans changement de régime',
      'Confusion BIC/BNC',
      'Charges non déductibles incluses'
    ],
    keyBoxes: ['5KO', '5KP', '5HQ', '5IQ', '5QC']
  },
  '2042-RICI': {
    code: '2042-RICI',
    name: 'Réductions et crédits',
    description: 'Réductions et crédits d\'impôt',
    category: 'Déclaration principale',
    complexity: 'simple',
    commonErrors: [
      'Double déclaration de dons',
      'Plafonds non respectés',
      'Justificatifs manquants'
    ],
    keyBoxes: ['7UD', '7UF', '7DB', '7DF', '7GA', '7GB']
  },
  '2044': {
    code: '2044',
    name: 'Revenus fonciers',
    description: 'Déclaration des revenus fonciers au réel',
    category: 'Immobilier',
    complexity: 'complex',
    commonErrors: [
      'Confusion charges/travaux déductibles',
      'Déficit mal reporté',
      'Intérêts d\'emprunt oubliés'
    ],
    keyBoxes: ['211', '221', '222', '223', '224', '229']
  },
  '2031': {
    code: '2031',
    name: 'BIC / LMNP / LMP',
    description: 'Bénéfices industriels et commerciaux, Location meublée',
    category: 'Immobilier / Entreprise',
    complexity: 'expert',
    commonErrors: [
      'Amortissements mal calculés',
      'Passage LMNP→LMP non détecté',
      'Déficits mal imputés',
      'Cotisations sociales oubliées'
    ],
    keyBoxes: ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'FP', 'FR']
  },
  '2035': {
    code: '2035',
    name: 'BNC - Professions libérales',
    description: 'Bénéfices non commerciaux',
    category: 'Revenus non salariés',
    complexity: 'expert',
    commonErrors: [
      'Créances/dettes mal comptabilisées',
      'Amortissements erronés',
      'Charges mixtes mal proratisées',
      'TVA non déduite'
    ],
    keyBoxes: ['AA', 'AB', 'AC', 'AD', 'AE', 'BT', 'BU', 'BV', 'CP']
  },
  '2065': {
    code: '2065',
    name: 'IS - Impôt sur les sociétés',
    description: 'Déclaration d\'impôt sur les sociétés',
    category: 'Entreprise',
    complexity: 'expert',
    commonErrors: [
      'Charges non déductibles incluses',
      'Report déficitaire mal calculé',
      'Contribution sociale oubliée',
      'Acomptes mal imputés'
    ],
    keyBoxes: ['ZN', 'ZO', 'ZP', 'ZR', 'ZS', 'I1', 'I2']
  },
  '2074': {
    code: '2074',
    name: 'Plus-values mobilières',
    description: 'Déclaration des plus-values sur valeurs mobilières',
    category: 'Revenus financiers',
    complexity: 'complex',
    commonErrors: [
      'Moins-values non reportées',
      'Abattement durée oublié',
      'Frais d\'acquisition omis',
      'PEA partiellement taxable déclaré exonéré'
    ],
    keyBoxes: ['3VG', '3VH', '3SG', '3SH', '3UA', '3VT']
  },
  '2047': {
    code: '2047',
    name: 'Revenus étrangers',
    description: 'Déclaration des revenus de source étrangère',
    category: 'International',
    complexity: 'complex',
    commonErrors: [
      'Crédit d\'impôt étranger oublié',
      'Convention fiscale mal appliquée',
      'Double imposition non éliminée',
      'Revenus exonérés déclarés imposables'
    ],
    keyBoxes: ['1AC', '8TK', '8TL', '8TM', '8TN', '8TO']
  },
  '2086': {
    code: '2086',
    name: 'Crypto-actifs',
    description: 'Plus-values sur actifs numériques',
    category: 'Crypto',
    complexity: 'expert',
    commonErrors: [
      'Méthode FIFO non appliquée',
      'Conversion crypto→crypto considérée comme cession',
      'Airdrops/staking non déclarés',
      'Prix d\'acquisition global mal calculé'
    ],
    keyBoxes: ['3AN', '3BN', '3SN']
  },
  '3916': {
    code: '3916',
    name: 'Comptes étrangers',
    description: 'Déclaration des comptes bancaires à l\'étranger',
    category: 'International',
    complexity: 'simple',
    commonErrors: [
      'Compte oublié (courtier, banque)',
      'Date d\'ouverture incorrecte',
      'N° de compte incomplet'
    ],
    keyBoxes: ['Identification', 'Organisme', 'Numéro', 'Date']
  },
  '3916-bis': {
    code: '3916-bis',
    name: 'Comptes crypto étrangers',
    description: 'Déclaration des comptes d\'actifs numériques à l\'étranger',
    category: 'Crypto',
    complexity: 'medium',
    commonErrors: [
      'Exchange oublié (Binance, Kraken, etc.)',
      'Confusion wallet custodial/non-custodial',
      'Plateforme DeFi non déclarée'
    ],
    keyBoxes: ['Plateforme', 'Pays', 'Numéro', 'Date']
  },
  'unknown': {
    code: 'unknown',
    name: 'Formulaire non identifié',
    description: 'Type de formulaire à déterminer',
    category: 'Autre',
    complexity: 'medium',
    commonErrors: [],
    keyBoxes: []
  }
};

// ============== FORM DETECTION PATTERNS ==============

export const FORM_DETECTION_PATTERNS: { pattern: RegExp; formType: TaxFormType }[] = [
  { pattern: /formulaire\s*2086|cerfa.*2086|crypto[- ]?actifs|actifs\s*num[eé]riques/i, formType: '2086' },
  { pattern: /formulaire\s*3916[- ]?bis|3916[- ]?bis|comptes?\s*crypto|exchanges?\s*[eé]trangers?/i, formType: '3916-bis' },
  { pattern: /formulaire\s*3916|cerfa.*3916|comptes?\s*bancaires?\s*[eé]trangers?/i, formType: '3916' },
  { pattern: /formulaire\s*2074|cerfa.*2074|plus[- ]?values?\s*mobili[eè]res?/i, formType: '2074' },
  { pattern: /formulaire\s*2047|cerfa.*2047|revenus?\s*[eé]trangers?|source\s*[eé]trang[eè]re/i, formType: '2047' },
  { pattern: /formulaire\s*2035|cerfa.*2035|b[eé]n[eé]fices?\s*non\s*commerciaux|professions?\s*lib[eé]rales?/i, formType: '2035' },
  { pattern: /formulaire\s*2031|cerfa.*2031|lmnp|lmp|location\s*meubl[eé]e|sci\s*[àa]\s*l'?ir/i, formType: '2031' },
  { pattern: /formulaire\s*2065|cerfa.*2065|imp[oô]t\s*sur\s*les?\s*soci[eé]t[eé]s?|is\s*soci[eé]t[eé]/i, formType: '2065' },
  { pattern: /formulaire\s*2044|cerfa.*2044|revenus?\s*fonciers?|location\s*nue/i, formType: '2044' },
  { pattern: /2042[- ]?c[- ]?pro|revenus?\s*professionnels?|bic|bnc|micro[- ]?entreprise/i, formType: '2042-C-PRO' },
  { pattern: /2042[- ]?rici|r[eé]ductions?.*cr[eé]dits?|dons?|emploi\s*domicile/i, formType: '2042-RICI' },
  { pattern: /2042[- ]?c(?!-)|compl[eé]mentaire|plus[- ]?values?/i, formType: '2042-C' },
  { pattern: /formulaire\s*2042|cerfa.*2042|d[eé]claration\s*de\s*revenus?|case\s*1aj/i, formType: '2042' },
];

// ============== EXTENDED INPUT FOR SPECIFIC FORMS ==============

export interface CryptoTransaction {
  date: Date;
  type: 'buy' | 'sell' | 'swap' | 'airdrop' | 'staking' | 'lending' | 'gift';
  assetIn?: string;
  assetOut?: string;
  amountIn: number;
  amountOut: number;
  fiatValueIn: number;
  fiatValueOut: number;
  platform: string;
  fees: number;
}

export interface ForeignAccount {
  institution: string;
  country: string;
  accountNumber: string;
  type: 'bank' | 'broker' | 'crypto' | 'insurance' | 'trust';
  openDate: Date;
  closeDate?: Date;
  isActive: boolean;
  maxBalance: number;
}

export interface RentalProperty {
  type: 'nude' | 'furnished' | 'seasonal' | 'airbnb';
  regime: 'micro' | 'real' | 'lmnp_micro' | 'lmnp_real' | 'lmp';
  grossIncome: number;
  charges: number;
  works: number;
  loanInterests: number;
  depreciation: number;
  startDate: Date;
  address: string;
  isMain: boolean;
}

export interface CapitalGain {
  type: 'stock' | 'bond' | 'pea' | 'crypto' | 'real_estate' | 'art' | 'startup';
  acquisitionDate: Date;
  saleDate: Date;
  acquisitionPrice: number;
  salePrice: number;
  fees: number;
  abatementEligible: boolean;
  abatementRate: number;
}

export interface ExtendedTaxInput {
  // Crypto-specific (2086)
  cryptoTransactions: CryptoTransaction[];
  totalCryptoAcquisitionValue: number;
  totalCryptoPortfolioValue: number;
  hasUsedFIFO: boolean;
  hasDeclaredAirdrops: boolean;
  hasStakingIncome: boolean;
  hasLendingIncome: boolean;
  
  // Foreign accounts (3916 / 3916-bis)
  foreignAccounts: ForeignAccount[];
  hasUndeclaredForeignAccounts: boolean;
  
  // Capital gains (2074)
  capitalGains: CapitalGain[];
  carryForwardLosses: number;
  hasOptedProgressiveTax: boolean;
  
  // Rental properties (2031 / 2044)
  rentalProperties: RentalProperty[];
  totalRentalDeficit: number;
  carryForwardRentalDeficit: number;
  isLMNP: boolean;
  isLMP: boolean;
  lmpThresholdCheck: { rentalIncome: number; otherIncome: number; passedThreshold: boolean };
  
  // Professional income (2035 / 2065)
  professionType: 'liberal' | 'commercial' | 'artisan' | 'farmer' | 'none';
  hasVAT: boolean;
  vatRegime: 'franchise' | 'simplified' | 'real';
  fiscalYear: { start: Date; end: Date };
  hasAccountant: boolean;
  
  // Foreign income (2047)
  foreignIncomeByCountry: { country: string; income: number; taxPaid: number; convention: boolean }[];
  hasTaxTreaty: boolean;
  taxCreditMethod: 'credit' | 'exemption' | 'none';
}

export const DEFAULT_EXTENDED_INPUT: ExtendedTaxInput = {
  cryptoTransactions: [],
  totalCryptoAcquisitionValue: 0,
  totalCryptoPortfolioValue: 0,
  hasUsedFIFO: false,
  hasDeclaredAirdrops: false,
  hasStakingIncome: false,
  hasLendingIncome: false,
  foreignAccounts: [],
  hasUndeclaredForeignAccounts: false,
  capitalGains: [],
  carryForwardLosses: 0,
  hasOptedProgressiveTax: false,
  rentalProperties: [],
  totalRentalDeficit: 0,
  carryForwardRentalDeficit: 0,
  isLMNP: false,
  isLMP: false,
  lmpThresholdCheck: { rentalIncome: 0, otherIncome: 0, passedThreshold: false },
  professionType: 'none',
  hasVAT: false,
  vatRegime: 'franchise',
  fiscalYear: { start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) },
  hasAccountant: false,
  foreignIncomeByCountry: [],
  hasTaxTreaty: false,
  taxCreditMethod: 'none'
};
