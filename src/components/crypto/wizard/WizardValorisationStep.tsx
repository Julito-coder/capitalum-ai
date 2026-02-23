import { useMemo } from 'react';
import { Info, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TxDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
  setTransactions: React.Dispatch<React.SetStateAction<TxDraft[]>>;
  initialPortfolioValue: string;
  setInitialPortfolioValue: React.Dispatch<React.SetStateAction<string>>;
}

const FIAT = new Set(['EUR', 'USD', 'GBP', 'CHF']);

export const WizardValorisationStep = ({
  transactions,
  setTransactions,
  initialPortfolioValue,
  setInitialPortfolioValue,
}: Props) => {
  const taxableTypes = ['crypto_to_fiat', 'payment'];
  const taxableTxs = transactions.filter((t) => taxableTypes.includes(t.classification));

  const updateTx = (id: string, value: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, fiatValueEur: value } : t)));
  };

  const completedCount = taxableTxs.filter((t) => t.fiatValueEur && parseFloat(t.fiatValueEur) > 0).length;
  const completionPct = taxableTxs.length > 0 ? Math.round((completedCount / taxableTxs.length) * 100) : 0;

  // Estimer la valeur du portefeuille à partir des acquisitions
  const estimatedPortfolioValue = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const isBuy = FIAT.has(t.assetFrom?.toUpperCase?.() || '') ||
        ['income', 'airdrop', 'mining', 'staking', 'gift'].includes(t.classification);
      if (isBuy) return sum + (parseFloat(t.fiatValueEur) || 0);
      return sum;
    }, 0);
  }, [transactions]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 3 — Valorisation en EUR</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque cession taxable doit avoir une valorisation EUR. Renseigne aussi la valeur de ton portefeuille.
        </p>
      </div>

      {/* Valeur globale du portefeuille */}
      <Card className="border-primary/20">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Valeur globale du portefeuille</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            La valeur totale de <strong>tous tes actifs numériques</strong> au 1er janvier ou au moment de ta première cession.
            C'est le dénominateur de la formule PMPA. Plus cette valeur est précise, plus le calcul est juste.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Valeur portefeuille (EUR)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder={estimatedPortfolioValue > 0 ? String(estimatedPortfolioValue) : '0.00'}
                value={initialPortfolioValue}
                onChange={(e) => setInitialPortfolioValue(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-2">
              <p className="text-[10px] text-muted-foreground">
                Estimation auto à partir des achats : <strong>{estimatedPortfolioValue.toLocaleString('fr-FR')} €</strong>
                {!initialPortfolioValue && estimatedPortfolioValue > 0 && (
                  <span className="text-warning"> (utilisée par défaut)</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-3 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Rappel méthode PMPA</p>
            <p>
              PV = Prix de cession − (Prix total acq. × Prix de cession / <strong>Valeur globale portefeuille</strong>) − Frais.
              La valeur du portefeuille est mise à jour après chaque cession.
            </p>
          </div>
        </div>
      </div>

      {/* Valorisations des cessions */}
      {taxableTxs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Ajoute des transactions taxables à l'étape précédente.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Valorisations renseignées</span>
            <Badge variant={completionPct === 100 ? 'default' : 'secondary'}>
              {completedCount}/{taxableTxs.length} — {completionPct}%
            </Badge>
          </div>

          <div className="space-y-3">
            {taxableTxs.map((tx) => {
              const hasValue = tx.fiatValueEur && parseFloat(tx.fiatValueEur) > 0;
              return (
                <Card key={tx.id} className={`border-border/30 ${hasValue ? 'bg-success/5' : 'bg-warning/5'}`}>
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        {tx.date || 'Sans date'} — {tx.assetFrom || '?'} → {tx.assetTo || 'EUR'}
                      </span>
                      {hasValue ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs whitespace-nowrap">Valeur EUR</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0.00"
                        value={tx.fiatValueEur}
                        onChange={(e) => updateTx(tx.id, e.target.value)}
                        className="max-w-[150px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
