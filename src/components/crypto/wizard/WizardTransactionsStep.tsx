import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, FileSpreadsheet, Info } from 'lucide-react';
import type { TransactionClassification } from '@/domain/crypto/types';

interface TxDraft {
  id: string;
  date: string;
  assetFrom: string;
  assetTo: string;
  qtyFrom: string;
  qtyTo: string;
  fiatValueEur: string;
  feesEur: string;
  classification: TransactionClassification;
}

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

export const WizardTransactionsStep = () => {
  const [transactions, setTransactions] = useState<TxDraft[]>([]);

  const addTransaction = () => {
    setTransactions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: '',
        assetFrom: '',
        assetTo: 'EUR',
        qtyFrom: '',
        qtyTo: '',
        fiatValueEur: '',
        feesEur: '',
        classification: 'crypto_to_fiat',
      },
    ]);
  };

  const updateTx = (id: string, field: keyof TxDraft, value: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTx = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 2 — Transactions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Importe ou saisis manuellement toutes tes opérations crypto de l'année.
        </p>
      </div>

      {/* CSV Import placeholder */}
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center space-y-2">
          <Upload className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm font-semibold">Importer un fichier CSV</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop ou clique pour uploader un export de ton exchange
          </p>
          <Button variant="outline" size="sm" disabled>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Sélectionner un CSV
          </Button>
        </CardContent>
      </Card>

      {/* Manual entry */}
      <div className="space-y-3">
        {transactions.map((tx, idx) => (
          <Card key={tx.id} className="border-border/30">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Transaction n°{idx + 1}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTx(tx.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={tx.date} onChange={(e) => updateTx(tx.id, 'date', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={tx.classification} onValueChange={(v) => updateTx(tx.id, 'classification', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Actif vendu</Label>
                  <Input placeholder="BTC" value={tx.assetFrom} onChange={(e) => updateTx(tx.id, 'assetFrom', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Quantité</Label>
                  <Input type="number" min={0} step="any" value={tx.qtyFrom} onChange={(e) => updateTx(tx.id, 'qtyFrom', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Valeur EUR</Label>
                  <Input type="number" min={0} step="any" placeholder="0.00" value={tx.fiatValueEur} onChange={(e) => updateTx(tx.id, 'fiatValueEur', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Frais EUR</Label>
                  <Input type="number" min={0} step="any" placeholder="0.00" value={tx.feesEur} onChange={(e) => updateTx(tx.id, 'feesEur', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addTransaction} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une transaction
      </Button>

      {transactions.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Importe un CSV ou ajoute des transactions manuellement.</p>
        </div>
      )}
    </div>
  );
};
