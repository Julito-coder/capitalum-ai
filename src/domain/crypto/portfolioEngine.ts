/**
 * Moteur de calcul chronologique PMPA — Art. 150 VH bis CGI.
 *
 * Contrairement à computeGlobalPV (qui appliquait une valeur globale fixe),
 * ce moteur traite les transactions CHRONOLOGIQUEMENT et met à jour :
 *   - totalAcquisitionCost (prix total d'acquisition du portefeuille)
 *   - portfolioValue (valeur globale du portefeuille)
 *   - holdings (quantités détenues par actif)
 * après chaque cession.
 *
 * Formule par cession :
 *   PV = Prix_cession
 *      − (Prix_total_acq × Prix_cession / Valeur_globale)
 *      − Frais_cession
 *
 * Après chaque cession, le prix total d'acquisition est réduit de la fraction cédée :
 *   totalAcq_new = totalAcq_old − (totalAcq_old × Prix_cession / Valeur_globale)
 *
 * IMPORTANT : aucun arrondi intermédiaire. Arrondi uniquement en fin de calcul.
 */

import type {
  ComputedLine,
  AuditTrailEntry,
  CryptoTaxComputation,
  FieldMapping,
  QualityAlert,
} from './types';

// ── Types ─────────────────────────────────────

export interface NormalizedTransaction {
  id: string;
  date: string; // ISO date
  type: 'acquisition' | 'cession' | 'transfer' | 'non_taxable';
  assetFrom: string;
  assetTo: string;
  qtyFrom: number;
  qtyTo: number;
  fiatValueEur: number; // valeur EUR de l'opération
  feesEur: number;
  classification: string;
  accountId?: string;
  /** Valeur globale du portefeuille au moment de cette cession (optionnel, sinon estimée) */
  portfolioValueOverride?: number;
}

export interface PortfolioSnapshot {
  totalAcquisitionCost: number;
  portfolioValue: number;
  holdings: Record<string, number>; // asset -> qty
}

export interface CessionDetail extends ComputedLine {
  portfolioSnapshot: PortfolioSnapshot;
}

export interface ChronologicalResult {
  cessionLines: CessionDetail[];
  auditTrail: AuditTrailEntry[];
  finalSnapshot: PortfolioSnapshot;
  totalCessionsEur: number;
  gainsEur: number;
  lossesEur: number;
  netGainEur: number;
}

// ── FIAT detection ──────────────────────────────

const FIAT_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY']);

function isFiat(asset: string): boolean {
  return FIAT_CURRENCIES.has(asset?.toUpperCase?.() || '');
}

// ── Transaction classification ──────────────────

const ACQUISITION_CLASSIFICATIONS = new Set([
  'income', 'airdrop', 'mining', 'staking', 'gift',
]);

const TAXABLE_CESSION_CLASSIFICATIONS = new Set([
  'crypto_to_fiat', 'payment',
]);

export function classifyTransaction(tx: {
  assetFrom: string;
  assetTo: string;
  classification: string;
}): 'acquisition' | 'cession' | 'transfer' | 'non_taxable' {
  if (tx.classification === 'transfer') return 'transfer';
  if (TAXABLE_CESSION_CLASSIFICATIONS.has(tx.classification)) return 'cession';
  if (ACQUISITION_CLASSIFICATIONS.has(tx.classification)) return 'acquisition';
  // Fiat → Crypto = acquisition
  if (isFiat(tx.assetFrom) && !isFiat(tx.assetTo)) return 'acquisition';
  // Crypto → Crypto = non taxable (en France, échange crypto/crypto n'est pas taxable)
  if (!isFiat(tx.assetFrom) && !isFiat(tx.assetTo) && tx.classification === 'crypto_to_crypto') {
    return 'non_taxable';
  }
  return 'non_taxable';
}

// ── Core engine ─────────────────────────────────

/**
 * Calcule les PV/MV chronologiquement avec mise à jour du portefeuille après chaque cession.
 *
 * @param transactions - Toutes les transactions, seront triées par date
 * @param initialPortfolioValue - Valeur globale du portefeuille au début de la période
 *                                 (si 0 ou non fourni, estimée à partir des acquisitions)
 */
export function computeChronologicalPMPA(
  transactions: NormalizedTransaction[],
  initialPortfolioValue: number = 0
): ChronologicalResult {
  // Trier par date chronologique
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const auditTrail: AuditTrailEntry[] = [];
  const cessionLines: CessionDetail[] = [];

  // État du portefeuille
  const snapshot: PortfolioSnapshot = {
    totalAcquisitionCost: 0,
    portfolioValue: initialPortfolioValue,
    holdings: {},
  };

  let gainsEur = 0;
  let lossesEur = 0;
  let totalCessionsEur = 0;

  // Phase 1 : reconstruire le portefeuille (acquisitions avant la première cession)
  // Phase 2 : traiter chronologiquement

  for (const tx of sorted) {
    const txType = tx.type;

    if (txType === 'acquisition') {
      // Mise à jour du portefeuille
      snapshot.totalAcquisitionCost += tx.fiatValueEur;
      snapshot.portfolioValue += tx.fiatValueEur;

      // Mise à jour des holdings
      if (tx.assetTo && !isFiat(tx.assetTo)) {
        snapshot.holdings[tx.assetTo] = (snapshot.holdings[tx.assetTo] || 0) + tx.qtyTo;
      }

      auditTrail.push({
        step: `Acquisition ${tx.assetTo} du ${tx.date}`,
        formula: 'totalAcq += fiatValue ; portfolioValue += fiatValue',
        inputs: {
          fiat_value: tx.fiatValueEur,
          total_acq_apres: snapshot.totalAcquisitionCost,
          portfolio_value_apres: snapshot.portfolioValue,
        },
        result: tx.fiatValueEur,
        timestamp: new Date().toISOString(),
      });
    } else if (txType === 'cession') {
      const prixCession = tx.fiatValueEur;
      const frais = tx.feesEur;

      // Valeur globale du portefeuille : override si fournie, sinon état courant
      const valeurGlobale = tx.portfolioValueOverride && tx.portfolioValueOverride > 0
        ? tx.portfolioValueOverride
        : snapshot.portfolioValue;

      // Protection contre division par zéro
      const effectivePortfolioValue = valeurGlobale > 0 ? valeurGlobale : prixCession;

      // Calcul PMPA — SANS arrondi intermédiaire
      const fractionCedee = prixCession / effectivePortfolioValue;
      const prixAcquisitionFraction = snapshot.totalAcquisitionCost * fractionCedee;
      const plusValue = prixCession - prixAcquisitionFraction - frais;

      const line: CessionDetail = {
        transactionId: tx.id,
        date: tx.date,
        assetName: tx.assetFrom,
        prixCession,
        prixTotalAcquisitionPortefeuille: snapshot.totalAcquisitionCost,
        valeurGlobalePortefeuille: effectivePortfolioValue,
        fractionCedee,
        prixAcquisitionFraction,
        frais,
        plusValue,
        portfolioSnapshot: {
          totalAcquisitionCost: snapshot.totalAcquisitionCost,
          portfolioValue: effectivePortfolioValue,
          holdings: { ...snapshot.holdings },
        },
      };

      cessionLines.push(line);
      totalCessionsEur += prixCession;

      if (plusValue >= 0) {
        gainsEur += plusValue;
      } else {
        lossesEur += plusValue;
      }

      auditTrail.push({
        step: `Cession ${tx.assetFrom} du ${tx.date}`,
        formula: 'PV = Prix_cession - (Total_acq × Prix_cession / Valeur_globale) - Frais',
        inputs: {
          prix_cession: prixCession,
          total_acquisition: snapshot.totalAcquisitionCost,
          valeur_globale: effectivePortfolioValue,
          fraction_cedee: fractionCedee,
          prix_acq_fraction: prixAcquisitionFraction,
          frais,
        },
        result: plusValue,
        timestamp: new Date().toISOString(),
      });

      // Mise à jour du portefeuille APRÈS la cession
      snapshot.totalAcquisitionCost -= prixAcquisitionFraction;
      snapshot.portfolioValue -= prixCession;

      // Protection : ne pas passer en négatif
      if (snapshot.totalAcquisitionCost < 0) snapshot.totalAcquisitionCost = 0;
      if (snapshot.portfolioValue < 0) snapshot.portfolioValue = 0;

      // Réduire les holdings
      if (tx.assetFrom && !isFiat(tx.assetFrom)) {
        snapshot.holdings[tx.assetFrom] = Math.max(
          0,
          (snapshot.holdings[tx.assetFrom] || 0) - tx.qtyFrom
        );
      }

      auditTrail.push({
        step: `État portefeuille après cession`,
        formula: 'totalAcq -= fraction × totalAcq ; portfolioValue -= prixCession',
        inputs: {
          total_acq_apres: snapshot.totalAcquisitionCost,
          portfolio_value_apres: snapshot.portfolioValue,
        },
        result: snapshot.totalAcquisitionCost,
        timestamp: new Date().toISOString(),
      });
    } else if (txType === 'transfer') {
      // Les transferts internes ne modifient ni le prix d'acq ni la valeur du portefeuille
      // Mais on ajuste les holdings si on transfère entre wallets
      auditTrail.push({
        step: `Transfert ${tx.assetFrom} du ${tx.date}`,
        formula: 'Transfert interne — pas d\'impact fiscal',
        inputs: { asset: tx.assetFrom as string, qty: tx.qtyFrom },
        result: 0,
        timestamp: new Date().toISOString(),
      });
    }
    // non_taxable : aucun traitement
  }

  // Arrondi final uniquement
  const netGainEur = roundCents(gainsEur + lossesEur);

  auditTrail.push({
    step: 'Résultat global annuel',
    formula: 'Net = Σ(PV) + Σ(MV)',
    inputs: {
      total_plus_values: roundCents(gainsEur),
      total_moins_values: roundCents(lossesEur),
      nombre_cessions: cessionLines.length,
    },
    result: netGainEur,
    timestamp: new Date().toISOString(),
  });

  return {
    cessionLines: cessionLines.map((l) => ({
      ...l,
      fractionCedee: roundCents(l.fractionCedee * 10000) / 10000, // 4 decimals for fraction
      prixAcquisitionFraction: roundCents(l.prixAcquisitionFraction),
      plusValue: roundCents(l.plusValue),
    })),
    auditTrail,
    finalSnapshot: { ...snapshot },
    totalCessionsEur: roundCents(totalCessionsEur),
    gainsEur: roundCents(gainsEur),
    lossesEur: roundCents(lossesEur),
    netGainEur,
  };
}

// ── Field mapping ───────────────────────────────

export function computeFieldMapping(result: ChronologicalResult): FieldMapping {
  return {
    case3AN: Math.max(0, roundCents(result.netGainEur)),
    case3BN: Math.abs(Math.min(0, roundCents(result.netGainEur))),
  };
}

// ── Tax estimation ──────────────────────────────

export interface TaxEstimation {
  regime: 'pfu' | 'bareme';
  netTaxable: number;
  irAmount: number;
  socialCharges: number;
  totalTax: number;
  effectiveRate: number;
}

const BAREME_TRANCHES = [
  { limit: 11294, rate: 0 },
  { limit: 28797, rate: 0.11 },
  { limit: 82341, rate: 0.30 },
  { limit: 177106, rate: 0.41 },
  { limit: Infinity, rate: 0.45 },
];

export function estimateTaxPFU(case3AN: number): TaxEstimation {
  const irRate = 0.128;
  const socialRate = 0.172;
  const irAmount = roundCents(case3AN * irRate);
  const socialCharges = roundCents(case3AN * socialRate);
  return {
    regime: 'pfu',
    netTaxable: case3AN,
    irAmount,
    socialCharges,
    totalTax: roundCents(irAmount + socialCharges),
    effectiveRate: case3AN > 0 ? 0.30 : 0,
  };
}

export function estimateTaxBareme(
  case3AN: number,
  otherIncome: number = 0,
  parts: number = 1
): TaxEstimation {
  const socialRate = 0.172;
  const socialCharges = roundCents(case3AN * socialRate);

  // Calcul IR au barème progressif
  const totalIncome = case3AN + otherIncome;
  const quotient = totalIncome / parts;

  let irQuotient = 0;
  let prevLimit = 0;
  for (const tranche of BAREME_TRANCHES) {
    if (quotient <= prevLimit) break;
    const taxableInTranche = Math.min(quotient, tranche.limit) - prevLimit;
    if (taxableInTranche > 0) {
      irQuotient += taxableInTranche * tranche.rate;
    }
    prevLimit = tranche.limit;
  }

  const totalIR = roundCents(irQuotient * parts);
  // Proportion attribuable aux crypto
  const cryptoProportion = totalIncome > 0 ? case3AN / totalIncome : 1;
  const irCrypto = roundCents(totalIR * cryptoProportion);

  return {
    regime: 'bareme',
    netTaxable: case3AN,
    irAmount: irCrypto,
    socialCharges,
    totalTax: roundCents(irCrypto + socialCharges),
    effectiveRate: case3AN > 0 ? roundCents((irCrypto + socialCharges) / case3AN * 100) / 100 : 0,
  };
}

// ── Quality alerts (enhanced) ───────────────────

export function generateEnhancedAlerts(
  transactions: NormalizedTransaction[],
  result: ChronologicalResult
): QualityAlert[] {
  const alerts: QualityAlert[] = [];

  // 1. Vérifier les cessions sans valorisation
  for (const tx of transactions) {
    if (tx.type === 'cession' && (!tx.fiatValueEur || tx.fiatValueEur <= 0)) {
      alerts.push({
        id: `no_val_${tx.id}`,
        type: 'blocking',
        category: 'Valorisation manquante',
        message: `Cession ${tx.assetFrom} du ${tx.date} sans valeur EUR`,
        transactionId: tx.id,
        fix: 'Saisir la valorisation en EUR au moment de la cession',
      });
    }

    if (!tx.date) {
      alerts.push({
        id: `no_date_${tx.id}`,
        type: 'blocking',
        category: 'Date manquante',
        message: `Transaction sans date`,
        transactionId: tx.id,
        fix: 'Ajouter la date de la transaction',
      });
    }
  }

  // 2. Vérifier la cohérence du portefeuille
  const cessions = transactions.filter((t) => t.type === 'cession');
  const acquisitions = transactions.filter((t) => t.type === 'acquisition');

  if (cessions.length > 0 && acquisitions.length === 0) {
    alerts.push({
      id: 'no_acquisitions',
      type: 'blocking',
      category: 'Acquisitions manquantes',
      message: 'Aucune acquisition renseignée — le prix de revient est considéré comme nul (PV maximale)',
      fix: 'Ajouter vos achats crypto (fiat → crypto) pour un calcul juste',
    });
  }

  // 3. Vérifier si la valeur du portefeuille est cohérente
  if (result.finalSnapshot.portfolioValue < 0) {
    alerts.push({
      id: 'negative_portfolio',
      type: 'blocking',
      category: 'Portefeuille incohérent',
      message: 'La valeur du portefeuille est devenue négative — vérifiez les montants',
      fix: 'Corriger les valorisations ou ajouter les acquisitions manquantes',
    });
  }

  // 4. Vérifier les ventes sans stock suffisant
  const holdingsCheck: Record<string, number> = {};
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const tx of sortedTxs) {
    if (tx.type === 'acquisition' && tx.assetTo && !isFiat(tx.assetTo)) {
      holdingsCheck[tx.assetTo] = (holdingsCheck[tx.assetTo] || 0) + tx.qtyTo;
    }
    if (tx.type === 'cession' && tx.assetFrom && !isFiat(tx.assetFrom)) {
      const available = holdingsCheck[tx.assetFrom] || 0;
      if (tx.qtyFrom > available * 1.01) { // 1% tolerance for rounding
        alerts.push({
          id: `oversell_${tx.id}`,
          type: 'warning',
          category: 'Vente sans stock',
          message: `Vente de ${tx.qtyFrom} ${tx.assetFrom} mais seulement ${available.toFixed(8)} détenu(s)`,
          transactionId: tx.id,
          fix: 'Vérifier les transactions antérieures ou ajouter les achats manquants',
        });
      }
      holdingsCheck[tx.assetFrom] = Math.max(0, available - tx.qtyFrom);
    }
  }

  // 5. Comptes étrangers non déclarés
  // (sera vérifié côté wizard avec les comptes)

  // 6. Frais manquants
  for (const tx of cessions) {
    if (tx.feesEur === 0) {
      alerts.push({
        id: `no_fees_${tx.id}`,
        type: 'warning',
        category: 'Frais non renseignés',
        message: `Aucun frais déclaré pour la cession ${tx.assetFrom} du ${tx.date}`,
        transactionId: tx.id,
        fix: 'Vérifier et ajouter les frais de transaction',
      });
    }
  }

  return alerts;
}

/**
 * Score de fiabilité 0-100
 */
export function computeReliabilityScore(
  transactions: NormalizedTransaction[],
  alerts: QualityAlert[]
): { score: number; level: 'high' | 'medium' | 'low'; label: string } {
  if (transactions.length === 0) return { score: 0, level: 'low', label: 'Aucune donnée' };

  const blockingCount = alerts.filter((a) => a.type === 'blocking').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;

  const score = Math.max(0, Math.min(100, 100 - blockingCount * 20 - warningCount * 5));

  if (score >= 80) return { score, level: 'high', label: 'Fiabilité haute' };
  if (score >= 50) return { score, level: 'medium', label: 'Fiabilité moyenne' };
  return { score, level: 'low', label: 'Fiabilité faible' };
}

// ── Helpers ─────────────────────────────────────

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// ── CSV Parser ──────────────────────────────────

export interface CsvParseResult {
  transactions: Array<{
    date: string;
    assetFrom: string;
    assetTo: string;
    qtyFrom: number;
    qtyTo: number;
    fiatValueEur: number;
    feesEur: number;
    classification: string;
  }>;
  warnings: string[];
  duplicatesDetected: number;
}

const KNOWN_COLUMN_MAPPINGS: Record<string, Record<string, string>> = {
  binance: {
    'date(utc)': 'date',
    'date': 'date',
    'pair': 'pair',
    'side': 'side',
    'price': 'price',
    'executed': 'qty',
    'amount': 'amount',
    'fee': 'fee',
  },
  generic: {
    'date': 'date',
    'timestamp': 'date',
    'type': 'type',
    'from': 'assetFrom',
    'to': 'assetTo',
    'amount': 'amount',
    'quantity': 'qty',
    'price': 'price',
    'fee': 'fee',
    'fees': 'fee',
    'total': 'total',
    'currency': 'currency',
    'asset': 'asset',
  },
};

export function parseCsvTransactions(csvContent: string): CsvParseResult {
  const warnings: string[] = [];
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return { transactions: [], warnings: ['Fichier CSV vide ou invalide'], duplicatesDetected: 0 };
  }

  // Detect separator
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  const transactions: CsvParseResult['transactions'] = [];
  const seen = new Set<string>();
  let duplicatesDetected = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(separator).map((v) => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    // Try to extract fields
    const date = row['date'] || row['date(utc)'] || row['timestamp'] || row['time'] || '';
    const type = (row['type'] || row['side'] || row['operation'] || '').toLowerCase();
    const assetFrom = row['from'] || row['sell currency'] || row['currency sold'] || '';
    const assetTo = row['to'] || row['buy currency'] || row['currency bought'] || '';
    const amount = parseFloat(row['amount'] || row['total'] || row['quantity'] || '0') || 0;
    const qty = parseFloat(row['quantity'] || row['executed'] || row['amount'] || '0') || 0;
    const price = parseFloat(row['price'] || row['rate'] || '0') || 0;
    const fee = parseFloat(row['fee'] || row['fees'] || row['commission'] || '0') || 0;

    if (!date) {
      warnings.push(`Ligne ${i + 1}: date manquante, ignorée`);
      continue;
    }

    // Deduplicate
    const fingerprint = `${date}_${assetFrom}_${assetTo}_${amount}_${qty}`;
    if (seen.has(fingerprint)) {
      duplicatesDetected++;
      continue;
    }
    seen.add(fingerprint);

    // Determine classification
    let classification = 'crypto_to_fiat';
    if (type.includes('buy') || type.includes('achat') || type.includes('deposit')) {
      classification = 'crypto_to_crypto'; // will be reclassified
    } else if (type.includes('sell') || type.includes('vente')) {
      classification = 'crypto_to_fiat';
    } else if (type.includes('transfer') || type.includes('withdraw') || type.includes('deposit')) {
      classification = 'transfer';
    } else if (type.includes('staking') || type.includes('reward')) {
      classification = 'staking';
    }

    const fiatValue = amount > 0 ? amount : qty * price;

    transactions.push({
      date: normalizeDate(date),
      assetFrom: assetFrom || '?',
      assetTo: assetTo || 'EUR',
      qtyFrom: qty || amount,
      qtyTo: 0,
      fiatValueEur: fiatValue,
      feesEur: fee,
      classification,
    });
  }

  if (duplicatesDetected > 0) {
    warnings.push(`${duplicatesDetected} doublon(s) détecté(s) et ignoré(s)`);
  }

  return { transactions, warnings, duplicatesDetected };
}

function normalizeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

// ── Detect internal transfers ───────────────────

export function detectInternalTransfers(transactions: NormalizedTransaction[]): string[][] {
  const pairs: string[][] = [];
  const withdrawals = transactions.filter(
    (tx) => tx.classification === 'transfer' && tx.qtyFrom > 0
  );
  const deposits = transactions.filter(
    (tx) => tx.classification === 'transfer' && tx.qtyTo > 0
  );

  for (const w of withdrawals) {
    for (const d of deposits) {
      if (w.id === d.id) continue;
      const sameAsset = w.assetFrom === d.assetTo;
      const similarQty = Math.abs(w.qtyFrom - d.qtyTo) / Math.max(w.qtyFrom, 1) < 0.02;
      const timeDiff = Math.abs(
        new Date(w.date).getTime() - new Date(d.date).getTime()
      );
      const within24h = timeDiff < 24 * 60 * 60 * 1000;

      if (sameAsset && similarQty && within24h) {
        pairs.push([w.id, d.id]);
      }
    }
  }

  return pairs;
}
