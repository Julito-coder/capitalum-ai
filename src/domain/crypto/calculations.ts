/**
 * Moteur de calcul PV crypto — Méthode FR Article 150 VH bis CGI.
 *
 * Formule par cession :
 *   PV = Prix de cession
 *        − (Prix total d'acquisition du portefeuille × (Prix de cession / Valeur globale du portefeuille))
 *        − Frais de cession
 *
 * Toutes les fonctions sont pures, isolées et testables.
 */

import type {
  CryptoTransaction,
  ComputedLine,
  AuditTrailEntry,
  CryptoTaxComputation,
  FieldMapping,
  QualityAlert,
} from './types';

// ── Helpers ─────────────────────────────────────

/** Arrondi au centime */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// ── Core: compute one cession line ──────────────

export interface CessionInput {
  transactionId: string;
  date: string;
  assetName: string;
  prixCession: number;
  prixTotalAcquisitionPortefeuille: number;
  valeurGlobalePortefeuille: number;
  frais: number;
}

/**
 * Calcule la plus-value ou moins-value d'une cession selon la méthode PMPA.
 * Retourne un ComputedLine avec le détail du calcul.
 */
export function computeCessionLine(input: CessionInput): ComputedLine {
  const { prixCession, prixTotalAcquisitionPortefeuille, valeurGlobalePortefeuille, frais } = input;

  if (valeurGlobalePortefeuille <= 0) {
    return {
      transactionId: input.transactionId,
      date: input.date,
      assetName: input.assetName,
      prixCession,
      prixTotalAcquisitionPortefeuille,
      valeurGlobalePortefeuille,
      fractionCedee: 0,
      prixAcquisitionFraction: 0,
      frais,
      plusValue: 0,
    };
  }

  const fractionCedee = roundCents(prixCession / valeurGlobalePortefeuille);
  const prixAcquisitionFraction = roundCents(prixTotalAcquisitionPortefeuille * fractionCedee);
  const plusValue = roundCents(prixCession - prixAcquisitionFraction - frais);

  return {
    transactionId: input.transactionId,
    date: input.date,
    assetName: input.assetName,
    prixCession,
    prixTotalAcquisitionPortefeuille,
    valeurGlobalePortefeuille,
    fractionCedee,
    prixAcquisitionFraction,
    frais,
    plusValue,
  };
}

// ── Aggregate: compute full tax year ────────────

export interface TaxYearInput {
  userId: string;
  taxYear: number;
  /** Only taxable cession events (crypto_to_fiat, payment, etc.) */
  cessions: CessionInput[];
  /** Total acquisition cost of the whole portfolio at start of year */
  totalAcquisitionsEur: number;
  /** Global portfolio value at each cession moment — simplified: pass once */
  portfolioValueEur: number;
}

/**
 * Produit un CryptoTaxComputation complet avec audit trail.
 */
export function computeTaxYear(input: TaxYearInput): CryptoTaxComputation {
  const auditTrail: AuditTrailEntry[] = [];
  const computedLines: ComputedLine[] = [];
  let gainsEur = 0;
  let lossesEur = 0;
  let totalCessionsEur = 0;

  for (const cession of input.cessions) {
    const line = computeCessionLine(cession);
    computedLines.push(line);
    totalCessionsEur += line.prixCession;

    if (line.plusValue >= 0) {
      gainsEur += line.plusValue;
    } else {
      lossesEur += line.plusValue; // negative
    }

    auditTrail.push({
      step: `Cession ${line.assetName} du ${line.date}`,
      formula: 'PV = Prix_cession - (Prix_total_acq × (Prix_cession / Valeur_globale)) - Frais',
      inputs: {
        prix_cession: line.prixCession,
        prix_total_acquisition: line.prixTotalAcquisitionPortefeuille,
        valeur_globale: line.valeurGlobalePortefeuille,
        frais: line.frais,
      },
      result: line.plusValue,
      timestamp: new Date().toISOString(),
    });
  }

  const netGainEur = roundCents(gainsEur + lossesEur);

  auditTrail.push({
    step: 'Résultat global',
    formula: 'Net = somme(PV) + somme(MV)',
    inputs: { total_pv: roundCents(gainsEur), total_mv: roundCents(lossesEur) },
    result: netGainEur,
    timestamp: new Date().toISOString(),
  });

  return {
    id: '', // will be set by DB
    userId: input.userId,
    taxYear: input.taxYear,
    method: 'FR_150_VH_bis',
    totalCessionsEur: roundCents(totalCessionsEur),
    totalAcquisitionsEur: input.totalAcquisitionsEur,
    portfolioValueEur: input.portfolioValueEur,
    gainsEur: roundCents(gainsEur),
    lossesEur: roundCents(lossesEur),
    netGainEur,
    computedLines,
    auditTrail,
    status: 'draft',
  };
}

// ── Field mapping for 2086 ──────────────────────

export function computeFieldMapping(computation: CryptoTaxComputation): FieldMapping {
  const net = computation.netGainEur;
  return {
    case3AN: Math.max(0, roundCents(net)),
    case3BN: Math.abs(Math.min(0, roundCents(net))),
  };
}

// ── Tax estimation ──────────────────────────────

export function estimateTax(case3AN: number, regime: 'pfu' | 'bareme', tmi?: number): number {
  if (regime === 'pfu') {
    return roundCents(case3AN * 0.30); // 12.8% IR + 17.2% PS
  }
  // Barème progressif: TMI + 17.2% PS
  const effectiveTmi = tmi ?? 0.30;
  return roundCents(case3AN * (effectiveTmi + 0.172));
}

// ── Quality alerts ──────────────────────────────

export function generateAlerts(transactions: CryptoTransaction[]): QualityAlert[] {
  const alerts: QualityAlert[] = [];

  for (const tx of transactions) {
    if (!tx.txTimestamp) {
      alerts.push({
        id: `no_date_${tx.id}`,
        type: 'blocking',
        category: 'Donnée manquante',
        message: `Transaction sans date`,
        transactionId: tx.id,
        fix: 'Ajouter la date de la transaction',
      });
    }

    if (tx.isTaxable && (tx.fiatValueEur === undefined || tx.fiatValueEur === null)) {
      alerts.push({
        id: `no_eur_${tx.id}`,
        type: 'blocking',
        category: 'Valorisation manquante',
        message: `Événement taxable sans valeur EUR`,
        transactionId: tx.id,
        fix: 'Saisir ou importer la valorisation en EUR',
      });
    }

    if (tx.flags.includes('suspected_duplicate')) {
      alerts.push({
        id: `dup_${tx.id}`,
        type: 'blocking',
        category: 'Doublon probable',
        message: `Transaction possiblement en doublon`,
        transactionId: tx.id,
        fix: 'Vérifier et supprimer le doublon',
      });
    }

    if (tx.flags.includes('missing_fee')) {
      alerts.push({
        id: `fee_${tx.id}`,
        type: 'warning',
        category: 'Frais manquants',
        message: `Frais non renseignés`,
        transactionId: tx.id,
        fix: 'Ajouter les frais de transaction',
      });
    }

    if (tx.flags.includes('missing_rate')) {
      alerts.push({
        id: `rate_${tx.id}`,
        type: 'warning',
        category: 'Confiance faible',
        message: `Taux de change estimé — faible confiance`,
        transactionId: tx.id,
      });
    }
  }

  return alerts;
}

/**
 * Calcule un score de fiabilité (0-100) basé sur la complétude et l'absence d'alertes.
 */
export function computeReliabilityScore(
  transactions: CryptoTransaction[],
  alerts: QualityAlert[]
): number {
  if (transactions.length === 0) return 0;

  const blockingCount = alerts.filter((a) => a.type === 'blocking').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;

  // Base 100, -15 per blocking, -3 per warning
  const score = Math.max(0, 100 - blockingCount * 15 - warningCount * 3);
  return Math.min(100, score);
}

/**
 * Détecte les transferts internes potentiels (withdraw/deposit matching).
 */
export function detectInternalTransfers(transactions: CryptoTransaction[]): string[][] {
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
        new Date(w.txTimestamp).getTime() - new Date(d.txTimestamp).getTime()
      );
      const within24h = timeDiff < 24 * 60 * 60 * 1000;

      if (sameAsset && similarQty && within24h) {
        pairs.push([w.id, d.id]);
      }
    }
  }

  return pairs;
}
