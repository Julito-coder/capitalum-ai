import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, FileSpreadsheet, Info, Lightbulb, Building2 } from 'lucide-react';
import type { TransactionClassification } from '@/domain/crypto/types';
import type { TxDraft, AccountDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  transactions: TxDraft[];
  setTransactions: React.Dispatch<React.SetStateAction<TxDraft[]>>;
  accounts: AccountDraft[];
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

export const WizardTransactionsStep = ({ transactions = [], setTransactions, accounts = [] }: Props) => {
  const addTransaction = (accountId = '') => {
    setTransactions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        accountId,
        date: '',
        assetFrom: '',
        assetTo: 'EUR',
        qtyFrom: '',
        qtyTo: '',
        fiatValueEur: '',
        feesEur: '',
        classification: 'crypto_to_fiat' as TransactionClassification,
      },
    ]);
  };

  const updateTx = (id: string, field: keyof TxDraft, value: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTx = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Grouper les transactions par compte
  const grouped = useMemo(() => {
    const groups: { accountId: string; accountName: string; txs: TxDraft[] }[] = [];
    
    if (accounts.length > 0) {
      for (const acc of accounts) {
        groups.push({
          accountId: acc.id,
          accountName: acc.name,
          txs: transactions.filter((t) => t.accountId === acc.id),
        });
      }
      const orphans = transactions.filter((t) => !t.accountId || !accounts.find((a) => a.id === t.accountId));
      if (orphans.length > 0) {
        groups.push({ accountId: '', accountName: 'Sans compte', txs: orphans });
      }
    } else {
      groups.push({ accountId: '', accountName: '', txs: transactions });
    }
    
    return groups;
  }, [transactions, accounts]);

  const renderTxCard = (tx: TxDraft, idx: number) => (
    <Card key={tx.id} className="border-border/30">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Transaction n°{idx + 1}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTx(tx.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Compte selector si plusieurs comptes */}
        {accounts.length > 0 && (
          <div>
            <Label className="text-xs">Compte</Label>
            <Select value={tx.accountId || ''} onValueChange={(v) => updateTx(tx.id, 'accountId', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un compte" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.country})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 2 — Transactions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Importe ou saisis manuellement toutes tes opérations crypto de l&apos;année.
        </p>
      </div>

      {/* CSV tip banner */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">💡 Astuce : exporte tes transactions en CSV</p>
            <p className="text-xs text-muted-foreground">
              La plupart des plateformes (Binance, Coinbase, Kraken, Bitpanda, Revolut, Trade Republic…) 
              permettent d&apos;exporter l&apos;historique de tes transactions au format CSV depuis les paramètres 
              ou la section « Historique / Rapports ». C&apos;est plus fiable et plus rapide que la saisie manuelle.
            </p>
          </div>
        </div>
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

      {/* Separator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">ou saisie manuelle</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Transactions groupées par compte */}
      {accounts.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.accountId || 'orphan'} className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{group.accountName}</h3>
                <span className="text-[10px] text-muted-foreground">
                  ({group.txs.length} transaction{group.txs.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="space-y-3 pl-2 border-l-2 border-border/30">
                {group.txs.map((tx, idx) => renderTxCard(tx, idx))}
                {group.accountId && (
                  <Button variant="outline" size="sm" onClick={() => addTransaction(group.accountId)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter sur {group.accountName}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, idx) => renderTxCard(tx, idx))}
        </div>
      )}

      <Button variant="outline" onClick={() => addTransaction(accounts.length === 1 ? accounts[0].id : '')} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une transaction
      </Button>

      {transactions.length === 0 && (
        <div className="text-center py-4">
          <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Importe un CSV ou ajoute des transactions manuellement.</p>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
          <p className="text-sm font-semibold text-success">
            {transactions.length} transaction{transactions.length > 1 ? 's' : ''} saisie{transactions.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};
