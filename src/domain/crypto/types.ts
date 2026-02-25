/**
 * Domain types for the Crypto 2086 module.
 * Aligned with DB schema but independent for domain logic isolation.
 */

// ── Classification ──────────────────────────────
export type TransactionClassification =
  | 'crypto_to_fiat'
  | 'fiat_to_crypto'
  | 'crypto_to_crypto'
  | 'payment'
  | 'income'
  | 'airdrop'
  | 'mining'
  | 'staking'
  | 'gift'
  | 'transfer';

export type TransactionFlag =
  | 'missing_rate'
  | 'missing_fee'
  | 'suspected_duplicate'
  | 'transfer_pair_candidate';

export type DraftStatus = 'draft' | 'in_review' | 'ready' | 'reported' | 'archived';

// ── Entities ────────────────────────────────────
export interface CryptoAccount {
  id: string;
  userId: string;
  taxYear: number;
  name: string;
  accountType: 'exchange' | 'wallet';
  country: string;
  isForeignAccount: boolean;
  identifiers: Record<string, string>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CryptoTransaction {
  id: string;
  userId: string;
  taxYear: number;
  accountId?: string;
  txTimestamp: string;
  assetFrom: string;
  assetTo: string;
  qtyFrom: number;
  qtyTo: number;
  fiatValueEur?: number;
  feesEur: number;
  feesAsset?: string;
  feesQty: number;
  source: 'manual' | 'import';
  sourceFileName?: string;
  classification: TransactionClassification;
  isTaxable: boolean;
  flags: TransactionFlag[];
  notes?: string;
}

export interface ComputedLine {
  transactionId: string;
  date: string;
  assetName: string;
  prixCession: number;
  prixTotalAcquisitionPortefeuille: number;
  valeurGlobalePortefeuille: number;
  fractionCedee: number;
  prixAcquisitionFraction: number;
  frais: number;
  plusValue: number;
}

export interface AuditTrailEntry {
  step: string;
  formula: string;
  inputs: Record<string, number | string>;
  result: number;
  timestamp: string;
}

export interface CryptoTaxComputation {
  id: string;
  userId: string;
  taxYear: number;
  method: string;
  totalCessionsEur: number;
  totalAcquisitionsEur: number;
  portfolioValueEur: number;
  gainsEur: number;
  lossesEur: number;
  netGainEur: number;
  computedLines: ComputedLine[];
  auditTrail: AuditTrailEntry[];
  status: 'draft' | 'validated';
}

export interface FieldMapping {
  case3AN: number; // Plus-values nettes
  case3BN: number; // Moins-values nettes
}

export interface TaxForm2086Draft {
  id: string;
  userId: string;
  taxYear: number;
  computationId?: string;
  identitySnapshot: Record<string, string>;
  foreignAccountsSummary: CryptoAccount[];
  taxableEventsSummary: ComputedLine[];
  fieldMapping: FieldMapping;
  regime: 'pfu' | 'bareme';
  notes?: string;
  assumptions?: string;
  readyForReport: boolean;
  reportedAt?: string;
  status: DraftStatus;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  taxYear: number;
  module: string;
  label: string;
  status: 'todo' | 'done';
  evidenceDocUrl?: string;
  completedAt?: string;
}

// ── Wizard state ────────────────────────────────
export type WizardStep =
  | 'sources'
  | 'transactions'
  | 'valorisation'
  | 'qualification'
  | 'calcul'
  | 'preparation';

export interface WizardState {
  currentStep: WizardStep;
  taxYear: number;
  accounts: CryptoAccount[];
  transactions: CryptoTransaction[];
  computation?: CryptoTaxComputation;
  draft?: TaxForm2086Draft;
  completionPct: number;
  confidencePct: number;
}

// ── Alert types ─────────────────────────────────
export interface QualityAlert {
  id: string;
  type: 'blocking' | 'warning';
  category: string;
  message: string;
  transactionId?: string;
  fix?: string;
}

// ── Report field ────────────────────────────────
export interface ReportField {
  fieldId: string;
  label: string;
  location: string; // "Annexes > 2086 > Section X"
  value: number;
  explanation: string;
  auditRef?: string;
}
