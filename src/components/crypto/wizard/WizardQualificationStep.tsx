import { Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TransactionClassification } from '@/domain/crypto/types';
import type { TxDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
  setTransactions: React.Dispatch<React.SetStateAction<TxDraft[]>>;
}

const TAXABLE_TYPES: TransactionClassification[] = ['crypto_to_fiat', 'payment'];
const NON_TAXABLE_TYPES: TransactionClassification[] = ['transfer'];
const REVIEW_TYPES: TransactionClassification[] = ['staking', 'airdrop', 'income', 'mining', 'gift'];

const CLASSIFICATIONS: { value: TransactionClassification; label: string }[] = [
  { value: 'crypto_to_fiat', label: 'Vente → EUR (taxable)' },
  { value: 'crypto_to_crypto', label: 'Échange crypto → crypto' },
  { value: 'payment', label: 'Paiement en crypto (taxable)' },
  { value: 'transfer', label: 'Transfert interne (non taxable)' },
  { value: 'income', label: 'Revenu / rémunération' },
  { value: 'airdrop', label: 'Airdrop' },
  { value: 'mining', label: 'Mining' },
  { value: 'staking', label: 'Staking' },
  { value: 'gift', label: 'Don' },
];

function getQualificationBadge(classification: TransactionClassification) {
  if (TAXABLE_TYPES.includes(classification)) return <Badge className="bg-destructive/10 text-destructive text-[10px]">Taxable</Badge>;
  if (NON_TAXABLE_TYPES.includes(classification)) return <Badge className="bg-success/10 text-success text-[10px]">Non taxable</Badge>;
  if (REVIEW_TYPES.includes(classification)) return <Badge className="bg-warning/10 text-warning text-[10px]">À vérifier</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Crypto→Crypto</Badge>;
}

export const WizardQualificationStep = ({ transactions, setTransactions }: Props) => {
  const updateClassification = (id: string, value: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, classification: value as TransactionClassification } : t)));
  };

  const taxableCount = transactions.filter((t) => TAXABLE_TYPES.includes(t.classification)).length;
  const reviewCount = transactions.filter((t) => REVIEW_TYPES.includes(t.classification)).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 4 — Qualification fiscale</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capitalum classe automatiquement chaque opération. Vérifie et corrige si besoin.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Règles de qualification (France)</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                <span><strong>Taxable :</strong> vente crypto → EUR, achat de bien/service en crypto</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span><strong>Non taxable :</strong> transfert interne, achat crypto</span>
              </li>
              <li className="flex items-start gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                <span><strong>À vérifier :</strong> staking, airdrops, revenus (selon nature et montant)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Ajoute des transactions à l&apos;étape 2 pour les qualifier ici.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{taxableCount} taxable{taxableCount > 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{transactions.length - taxableCount} non taxable{transactions.length - taxableCount > 1 ? 's' : ''}</span>
            {reviewCount > 0 && (
              <>
                <span>•</span>
                <span className="text-warning font-semibold">{reviewCount} à vérifier</span>
              </>
            )}
          </div>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="border-border/30">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">
                      {tx.date || 'Sans date'} — {tx.assetFrom || '?'} ({tx.qtyFrom || '0'})
                    </span>
                    {getQualificationBadge(tx.classification)}
                  </div>
                  <Select value={tx.classification} onValueChange={(v) => updateClassification(tx.id, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
