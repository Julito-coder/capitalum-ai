import { useMemo } from 'react';
import { Info, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeGlobalPV } from '@/domain/crypto/calculations';
import type { CryptoTransaction } from '@/domain/crypto/types';
import type { TxDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
}

function draftsToTransactions(drafts: TxDraft[]): CryptoTransaction[] {
  return drafts
    .filter((d) => d.date && d.assetFrom && d.qtyFrom)
    .map((d) => ({
      id: d.id,
      userId: '',
      taxYear: 2025,
      txTimestamp: d.date,
      assetFrom: d.assetFrom,
      assetTo: d.assetTo || 'EUR',
      qtyFrom: parseFloat(d.qtyFrom) || 0,
      qtyTo: parseFloat(d.qtyTo) || 0,
      fiatValueEur: parseFloat(d.fiatValueEur) || undefined,
      feesEur: parseFloat(d.feesEur) || 0,
      feesQty: 0,
      source: 'manual' as const,
      classification: d.classification,
      isTaxable: ['crypto_to_fiat', 'payment'].includes(d.classification),
      flags: [],
    }));
}

export const WizardCalculStep = ({ transactions }: Props) => {
  const domainTxs = useMemo(() => draftsToTransactions(transactions), [transactions]);

  const taxableTxs = domainTxs.filter((t) => t.isTaxable && t.fiatValueEur && t.fiatValueEur > 0);

  const totalAcquisitions = domainTxs
    .filter((t) => t.fiatValueEur)
    .reduce((sum, t) => sum + (t.fiatValueEur || 0), 0);

  const portfolioValue = totalAcquisitions * 1.1; // simplified placeholder

  const computation = useMemo(() => {
    if (taxableTxs.length === 0) return null;
    return computeGlobalPV(taxableTxs, totalAcquisitions, portfolioValue);
  }, [taxableTxs, totalAcquisitions, portfolioValue]);

  const formatEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

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
          </div>
        </div>
      </div>

      {!computation || taxableTxs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Calculator className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Complète les étapes précédentes (transactions taxables avec valorisation EUR) pour lancer le calcul.
          </p>
        </div>
      ) : (
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

          {/* Detail lines */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Détail par cession</h3>
            {computation.computedLines.map((line, idx) => (
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
        </>
      )}
    </div>
  );
};
