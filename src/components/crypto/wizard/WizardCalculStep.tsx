import { useState, useMemo } from 'react';
import { Info, Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeGlobalPV } from '@/domain/crypto/calculations';
import type { CryptoTransaction } from '@/domain/crypto/types';
import type { TxDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
}

function draftsToTaxableTransactions(drafts: TxDraft[]): CryptoTransaction[] {
  return drafts
    .filter((d) => d.date && d.assetFrom && d.qtyFrom && ['crypto_to_fiat', 'payment'].includes(d.classification))
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

export const WizardCalculStep = ({ transactions = [] }: Props) => {
  const taxableTxs = useMemo(() => draftsToTaxableTransactions(transactions), [transactions]);

  // Auto-calcul du prix total d'acquisition à partir des transactions d'achat
  const autoTotalAcquisitions = useMemo(() => {
    const FIAT_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
    const ACQUISITION_CLASSIFICATIONS: string[] = [
      'income', 'airdrop', 'mining', 'staking', 'gift',
    ];
    return transactions.reduce((sum, t) => {
      const isFiatToCrypto = FIAT_CURRENCIES.includes(t.assetFrom?.toUpperCase?.() || '');
      const isAcquisitionType = ACQUISITION_CLASSIFICATIONS.includes(t.classification);
      if (isFiatToCrypto || isAcquisitionType) {
        return sum + (parseFloat(t.fiatValueEur) || 0);
      }
      return sum;
    }, 0);
  }, [transactions]);

  // Auto-calcul de la valeur globale du portefeuille :
  // Acquisitions + somme des cessions (approximation conservatrice)
  const autoPortfolioValue = useMemo(() => {
    const totalCessions = taxableTxs.reduce((s, t) => s + (t.fiatValueEur || 0), 0);
    return autoTotalAcquisitions + totalCessions;
  }, [autoTotalAcquisitions, taxableTxs]);

  // L'utilisateur peut ajuster manuellement (override)
  const [totalAcquisitionsOverride, setTotalAcquisitionsOverride] = useState('');
  const [portfolioValueOverride, setPortfolioValueOverride] = useState('');

  const totalAcqNum = totalAcquisitionsOverride !== ''
    ? (parseFloat(totalAcquisitionsOverride) || 0)
    : autoTotalAcquisitions;
  const portfolioNum = portfolioValueOverride !== ''
    ? (parseFloat(portfolioValueOverride) || 0)
    : autoPortfolioValue;

  const canCompute = taxableTxs.length > 0 && totalAcqNum > 0 && portfolioNum > 0;

  const computation = useMemo(() => {
    if (!canCompute) return null;
    return computeGlobalPV(taxableTxs, totalAcqNum, portfolioNum);
  }, [canCompute, taxableTxs, totalAcqNum, portfolioNum]);

  const formatEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const totalCessionsFromTxs = taxableTxs.reduce((s, t) => s + (t.fiatValueEur || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 5 — Calcul PV / MV</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capitalum applique la méthode officielle française (art. 150 VH bis CGI).
        </p>
      </div>

      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Formule de calcul (PMPA)</p>
            <div className="font-mono text-xs bg-muted/30 p-3 rounded-lg mt-2">
              PV = Prix de cession<br />
              &nbsp;&nbsp;&nbsp;− (Prix total acquisition × Prix cession / Valeur globale portefeuille)<br />
              &nbsp;&nbsp;&nbsp;− Frais de cession
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pour appliquer cette formule, tu dois renseigner le <strong>prix total d&apos;acquisition</strong> (somme
              de tous tes achats crypto en EUR) et la <strong>valeur globale de ton portefeuille</strong> au moment
              des cessions.
            </p>
          </div>
        </div>
      </div>

      {/* Paramètres du portefeuille */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <h3 className="text-sm font-semibold">Paramètres du portefeuille</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Prix total d&apos;acquisition (EUR)</Label>
              <p className="text-[10px] text-muted-foreground mb-1">
                Pré-rempli depuis tes achats ({formatEur(autoTotalAcquisitions)}). Modifie si besoin.
              </p>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="Ex : 10000"
                value={totalAcquisitionsOverride !== '' ? totalAcquisitionsOverride : (autoTotalAcquisitions > 0 ? String(autoTotalAcquisitions) : '')}
                onChange={(e) => setTotalAcquisitionsOverride(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Valeur globale du portefeuille (EUR)</Label>
              <p className="text-[10px] text-muted-foreground mb-1">
                Estimée à {formatEur(autoPortfolioValue)}. Ajuste avec la valeur réelle.
              </p>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="Ex : 15000"
                value={portfolioValueOverride !== '' ? portfolioValueOverride : (autoPortfolioValue > 0 ? String(autoPortfolioValue) : '')}
                onChange={(e) => setPortfolioValueOverride(e.target.value)}
              />
            </div>
          </div>

          {taxableTxs.length > 0 && (
            <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/20">
              <span className="font-semibold">{taxableTxs.length}</span> cession{taxableTxs.length > 1 ? 's' : ''} taxable{taxableTxs.length > 1 ? 's' : ''} détectée{taxableTxs.length > 1 ? 's' : ''} pour un total de <span className="font-semibold">{formatEur(totalCessionsFromTxs)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats */}
      {taxableTxs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Calculator className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Ajoute des transactions taxables (vente → EUR ou paiement) avec une valorisation EUR aux étapes précédentes.
          </p>
        </div>
      ) : !canCompute ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
          <p className="text-sm text-muted-foreground">
            Renseigne le prix total d&apos;acquisition et la valeur globale du portefeuille ci-dessus pour lancer le calcul.
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
