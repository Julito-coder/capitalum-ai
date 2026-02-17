import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TxDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
  setTransactions: React.Dispatch<React.SetStateAction<TxDraft[]>>;
}

export const WizardValorisationStep = ({ transactions, setTransactions }: Props) => {
  const taxableTypes = ['crypto_to_fiat', 'payment', 'crypto_to_crypto'];
  const taxableTxs = transactions.filter((t) => taxableTypes.includes(t.classification));

  const updateTx = (id: string, value: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, fiatValueEur: value } : t)));
  };

  const completedCount = taxableTxs.filter((t) => t.fiatValueEur && parseFloat(t.fiatValueEur) > 0).length;
  const completionPct = taxableTxs.length > 0 ? Math.round((completedCount / taxableTxs.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 3 — Valorisation en EUR</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque événement taxable doit avoir une valorisation en euros au moment de la cession.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Comment ça marche ?</p>
            <ul className="space-y-1 text-xs">
              <li>• Si tu as saisi la valeur EUR dans tes transactions, c&apos;est déjà fait ✓</li>
              <li>• Sinon, complète les valorisations manquantes ci-dessous</li>
              <li>• Les estimations seront marquées &quot;faible confiance&quot;</li>
            </ul>
          </div>
        </div>
      </div>

      {taxableTxs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Ajoute des transactions taxables à l&apos;étape précédente pour voir les valorisations ici.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Complétude valorisations</span>
            <Badge variant={completionPct === 100 ? 'default' : 'secondary'}>
              {completedCount}/{taxableTxs.length} — {completionPct}%
            </Badge>
          </div>

          <div className="space-y-3">
            {taxableTxs.map((tx, idx) => {
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
