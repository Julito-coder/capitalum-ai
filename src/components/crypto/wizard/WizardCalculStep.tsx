import { useState, useMemo } from 'react';
import { Info, Calculator, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { computeGlobalPV } from '@/domain/crypto/calculations';
import type { CryptoTransaction } from '@/domain/crypto/types';
import type { TxDraft, AccountDraft } from '@/pages/crypto/CryptoWizard';

// ── Constants ──
const FIAT_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const ACQUISITION_CLASSIFICATIONS = ['income', 'airdrop', 'mining', 'staking', 'gift'];
const TAXABLE_CLASSIFICATIONS = ['crypto_to_fiat', 'payment'];

// ── Helpers ──
const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

function isAcquisitionTx(t: TxDraft): boolean {
  const isFiatToCrypto = FIAT_CURRENCIES.includes(t.assetFrom?.toUpperCase?.() || '');
  return isFiatToCrypto || ACQUISITION_CLASSIFICATIONS.includes(t.classification);
}

function isCessionTx(t: TxDraft): boolean {
  return TAXABLE_CLASSIFICATIONS.includes(t.classification);
}

function draftsToTaxableTransactions(drafts: TxDraft[]): CryptoTransaction[] {
  return drafts
    .filter((d) => d.date && d.assetFrom && d.qtyFrom && isCessionTx(d))
    .filter((d) => d.fiatValueEur && parseFloat(d.fiatValueEur) > 0)
    .map((d) => ({
      id: d.id,
      userId: '',
      taxYear: 2025,
      txTimestamp: d.date,
      assetFrom: d.assetFrom,
      assetTo: d.assetTo || 'EUR',
      qtyFrom: parseFloat(d.qtyFrom) || 0,
      qtyTo: parseFloat(d.qtyTo) || 0,
      fiatValueEur: parseFloat(d.fiatValueEur) || 0,
      feesEur: parseFloat(d.feesEur) || 0,
      feesQty: 0,
      source: 'manual' as const,
      classification: d.classification,
      isTaxable: true,
      flags: [],
    }));
}

// ── Per-account stats ──
interface AccountStats {
  accountId: string;
  accountName: string;
  acquisitionCount: number;
  acquisitionTotal: number;
  cessionCount: number;
  cessionTotal: number;
}

function computeAccountStats(accounts: AccountDraft[], transactions: TxDraft[]): AccountStats[] {
  return accounts.map((acc) => {
    const accTxs = transactions.filter((t) => t.accountId === acc.id);
    const acqs = accTxs.filter(isAcquisitionTx);
    const cess = accTxs.filter(isCessionTx);
    return {
      accountId: acc.id,
      accountName: acc.name,
      acquisitionCount: acqs.length,
      acquisitionTotal: acqs.reduce((s, t) => s + (parseFloat(t.fiatValueEur) || 0), 0),
      cessionCount: cess.length,
      cessionTotal: cess.reduce((s, t) => s + (parseFloat(t.fiatValueEur) || 0), 0),
    };
  });
}

// ── Props ──
interface Props {
  transactions: TxDraft[];
  accounts: AccountDraft[];
}

// ── Component ──
export const WizardCalculStep = ({ transactions = [], accounts = [] }: Props) => {
  const taxableTxs = useMemo(() => draftsToTaxableTransactions(transactions), [transactions]);
  const accountStats = useMemo(() => computeAccountStats(accounts, transactions), [accounts, transactions]);

  const autoTotalAcquisitions = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (isAcquisitionTx(t)) return sum + (parseFloat(t.fiatValueEur) || 0);
      return sum;
    }, 0);
  }, [transactions]);

  const autoPortfolioValue = useMemo(() => {
    const totalCessions = taxableTxs.reduce((s, t) => s + (t.fiatValueEur || 0), 0);
    return autoTotalAcquisitions + totalCessions;
  }, [autoTotalAcquisitions, taxableTxs]);

  // Overrides optionnels
  const [totalAcquisitionsOverride, setTotalAcquisitionsOverride] = useState('');
  const [portfolioValueOverride, setPortfolioValueOverride] = useState('');

  const totalAcqNum = totalAcquisitionsOverride !== ''
    ? (parseFloat(totalAcquisitionsOverride) || 0)
    : autoTotalAcquisitions;
  const portfolioNum = portfolioValueOverride !== ''
    ? (parseFloat(portfolioValueOverride) || 0)
    : autoPortfolioValue;

  // Calcul automatique dès que les données le permettent
  const canCompute = taxableTxs.length > 0 && totalAcqNum > 0 && portfolioNum > 0;

  const computation = useMemo(() => {
    if (!canCompute) return null;
    return computeGlobalPV(taxableTxs, totalAcqNum, portfolioNum);
  }, [canCompute, taxableTxs, totalAcqNum, portfolioNum]);

  const totalCessionsFromTxs = taxableTxs.reduce((s, t) => s + (t.fiatValueEur || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 5 — Calcul PV / MV</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Le calcul PMPA est lancé automatiquement à partir de vos transactions.
        </p>
      </div>

      {/* Formule info */}
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Méthode PMPA (art. 150 VH bis CGI)</p>
            <div className="font-mono text-xs bg-muted/30 p-3 rounded-lg mt-2">
              PV = Prix de cession<br />
              &nbsp;&nbsp;&nbsp;− (Prix total acquisition × Prix cession / Valeur globale portefeuille)<br />
              &nbsp;&nbsp;&nbsp;− Frais de cession
            </div>
          </div>
        </div>
      </div>

      {/* Récap par compte */}
      {accountStats.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <h3 className="text-sm font-semibold">Récapitulatif par compte</h3>
            {accountStats.map((s) => (
              <div key={s.accountId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20">
                <span className="font-semibold">{s.accountName}</span>
                <div className="flex gap-4 text-muted-foreground">
                  <span>{s.acquisitionCount} achat{s.acquisitionCount > 1 ? 's' : ''} = {formatEur(s.acquisitionTotal)}</span>
                  <span>{s.cessionCount} vente{s.cessionCount > 1 ? 's' : ''} = {formatEur(s.cessionTotal)}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-border/30">
              <span>Total</span>
              <div className="flex gap-4">
                <span className="text-success">Acquisitions : {formatEur(autoTotalAcquisitions)}</span>
                <span className="text-primary">Cessions : {formatEur(totalCessionsFromTxs)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paramètres ajustables (optionnels) */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2">
          <ChevronDown className="h-3 w-3" />
          Ajuster manuellement les paramètres (optionnel)
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Prix total d&apos;acquisition (EUR)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Auto : {formatEur(autoTotalAcquisitions)}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder={String(autoTotalAcquisitions)}
                    value={totalAcquisitionsOverride}
                    onChange={(e) => setTotalAcquisitionsOverride(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Valeur globale du portefeuille (EUR)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Auto : {formatEur(autoPortfolioValue)}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder={String(autoPortfolioValue)}
                    value={portfolioValueOverride}
                    onChange={(e) => setPortfolioValueOverride(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Résumé cessions */}
      {taxableTxs.length > 0 && (
        <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/20">
          <span className="font-semibold">{taxableTxs.length}</span> cession{taxableTxs.length > 1 ? 's' : ''} taxable{taxableTxs.length > 1 ? 's' : ''} pour un total de <span className="font-semibold">{formatEur(totalCessionsFromTxs)}</span>
        </div>
      )}

      {/* Résultats */}
      {taxableTxs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Calculator className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Ajoutez des cessions taxables (vente → EUR ou paiement) avec une valorisation EUR aux étapes précédentes.
          </p>
        </div>
      ) : computation ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className={computation.netGainEur >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Gain net</p>
                <p className="text-lg font-bold flex items-center justify-center gap-1">
                  {computation.netGainEur >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  {formatEur(computation.netGainEur)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total cessions</p>
                <p className="text-lg font-bold">{formatEur(computation.totalCessionsEur)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Plus-values</p>
                <p className="text-sm font-bold text-success">{formatEur(computation.gainsEur)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Moins-values</p>
                <p className="text-sm font-bold text-destructive">{formatEur(computation.lossesEur)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detail lines */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Détail par cession</h3>
            {computation.computedLines.map((line) => (
              <Card key={line.transactionId} className="border-border/20">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{line.date} — {line.assetName}</span>
                    <Badge variant={line.plusValue >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                      {line.plusValue >= 0 ? '+' : ''}{formatEur(line.plusValue)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>Prix cession : {formatEur(line.prixCession)}</span>
                    <span>Frais : {formatEur(line.frais)}</span>
                    <span>Fraction cédée : {(line.fractionCedee * 100).toFixed(2)}%</span>
                    <span>Acq. fraction : {formatEur(line.prixAcquisitionFraction)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Audit trail */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground font-semibold py-2">
              📋 Journal d&apos;audit (détail des calculs)
            </summary>
            <div className="space-y-2 mt-2">
              {computation.auditTrail.map((entry, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-muted/10 border border-border/10">
                  <p className="font-semibold">{entry.step}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{entry.formula}</p>
                  <p className="text-[10px]">Résultat : <span className="font-bold">{formatEur(entry.result)}</span></p>
                </div>
              ))}
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
};
