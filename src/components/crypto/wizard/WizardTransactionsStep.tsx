import { useMemo, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Trash2, Upload, FileSpreadsheet, Info, Lightbulb, Building2,
  Search, Filter, CheckCircle2, AlertTriangle, X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { TransactionClassification } from '@/domain/crypto/types';
import type { TxDraft, AccountDraft } from '@/pages/crypto/CryptoWizard';
import { parseCsvTransactions } from '@/domain/crypto/portfolioEngine';

interface Props {
  transactions: TxDraft[];
  setTransactions: React.Dispatch<React.SetStateAction<TxDraft[]>>;
  accounts: AccountDraft[];
}

const CLASSIFICATIONS: { value: TransactionClassification; label: string; short: string }[] = [
  { value: 'crypto_to_fiat', label: 'Vente → EUR (taxable)', short: 'Vente' },
  { value: 'fiat_to_crypto', label: 'Achat EUR → crypto (acquisition)', short: 'Achat' },
  { value: 'crypto_to_crypto', label: 'Échange crypto → crypto', short: 'Échange' },
  { value: 'payment', label: 'Paiement en crypto (taxable)', short: 'Paiement' },
  { value: 'transfer', label: 'Transfert interne', short: 'Transfert' },
  { value: 'income', label: 'Revenu / rémunération', short: 'Revenu' },
  { value: 'airdrop', label: 'Airdrop', short: 'Airdrop' },
  { value: 'mining', label: 'Mining', short: 'Mining' },
  { value: 'staking', label: 'Staking', short: 'Staking' },
  { value: 'gift', label: 'Don', short: 'Don' },
];

const FIAT_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CHF']);

export const WizardTransactionsStep = ({ transactions = [], setTransactions, accounts = [] }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTransaction = useCallback((accountId = '') => {
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
  }, [setTransactions]);

  const updateTx = useCallback((id: string, field: keyof TxDraft, value: string) => {
    setTransactions((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const updated = { ...t, [field]: value };
      // Auto-classification based on asset pair
      if (field === 'assetFrom' || field === 'assetTo') {
        const from = (field === 'assetFrom' ? value : t.assetFrom)?.toUpperCase() || '';
        const to = (field === 'assetTo' ? value : t.assetTo)?.toUpperCase() || '';
        if (FIAT_CURRENCIES.has(from) && to && !FIAT_CURRENCIES.has(to)) {
          updated.classification = 'fiat_to_crypto' as TransactionClassification;
        } else if (from && !FIAT_CURRENCIES.has(from) && FIAT_CURRENCIES.has(to)) {
          updated.classification = 'crypto_to_fiat' as TransactionClassification;
        }
      }
      return updated;
    }));
  }, [setTransactions]);

  const removeTx = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [setTransactions]);

  const removeSelected = useCallback(() => {
    setTransactions((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  }, [selectedIds, setTransactions]);

  // ── CSV Import ──
  const handleCsvImport = useCallback(async (file: File) => {
    setImportProgress(10);
    try {
      const text = await file.text();
      setImportProgress(40);

      const result = parseCsvTransactions(text);
      setImportProgress(70);

      if (result.warnings.length > 0) {
        toast({
          title: `⚠️ ${result.warnings.length} avertissement(s)`,
          description: result.warnings.slice(0, 3).join('\n'),
        });
      }

      const newTxs: TxDraft[] = result.transactions.map((tx) => ({
        id: crypto.randomUUID(),
        accountId: accounts.length === 1 ? accounts[0].id : '',
        date: tx.date,
        assetFrom: tx.assetFrom,
        assetTo: tx.assetTo,
        qtyFrom: String(tx.qtyFrom),
        qtyTo: String(tx.qtyTo),
        fiatValueEur: String(tx.fiatValueEur),
        feesEur: String(tx.feesEur),
        classification: tx.classification as TransactionClassification,
      }));

      setTransactions((prev) => [...prev, ...newTxs]);
      setImportProgress(100);

      toast({
        title: `✅ ${newTxs.length} transaction(s) importée(s)`,
        description: result.duplicatesDetected > 0
          ? `${result.duplicatesDetected} doublon(s) ignoré(s)`
          : undefined,
      });
    } catch (err) {
      console.error('CSV import error:', err);
      toast({ title: 'Erreur', description: 'Impossible de lire le fichier CSV', variant: 'destructive' });
    } finally {
      setTimeout(() => setImportProgress(null), 1500);
    }
  }, [accounts, setTransactions]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCsvImport(file);
    e.target.value = '';
  }, [handleCsvImport]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleCsvImport(file);
    }
  }, [handleCsvImport]);

  // ── Filtering ──
  const filteredTxs = useMemo(() => {
    let result = transactions;
    if (filterType !== 'all') {
      result = result.filter((t) => t.classification === filterType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.assetFrom.toLowerCase().includes(q) ||
        t.assetTo.toLowerCase().includes(q) ||
        t.date.includes(q)
      );
    }
    return result;
  }, [transactions, filterType, searchQuery]);

  // ── Stats ──
  const taxableCount = transactions.filter((t) =>
    ['crypto_to_fiat', 'payment'].includes(t.classification)
  ).length;
  const acquisitionCount = transactions.filter((t) =>
    FIAT_CURRENCIES.has(t.assetFrom?.toUpperCase?.() || '') ||
    ['income', 'airdrop', 'mining', 'staking', 'gift'].includes(t.classification)
  ).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTxs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTxs.map((t) => t.id)));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 2 — Transactions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Importe ou saisis toutes tes opérations crypto de l'année.
        </p>
      </div>

      {/* CSV Import */}
      <Card
        className="border-dashed border-2 border-primary/20 bg-primary/5 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="py-6 text-center space-y-2">
          <Upload className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm font-semibold">Importer un fichier CSV</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop ou clique — Binance, Coinbase, Kraken, etc.
          </p>
          {importProgress !== null && (
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {importProgress < 100 ? 'Import en cours...' : '✓ Import terminé'}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFileChange}
          />
        </CardContent>
      </Card>

      {/* Toolbar */}
      {transactions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (actif, date...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {CLASSIFICATIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.short}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Supprimer ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      {/* Stats bar */}
      {transactions.length > 0 && (
        <div className="flex items-center gap-3 text-xs">
          <Badge variant="secondary">{transactions.length} total</Badge>
          <Badge className="bg-destructive/10 text-destructive">{taxableCount} taxable{taxableCount > 1 ? 's' : ''}</Badge>
          <Badge className="bg-success/10 text-success">{acquisitionCount} acquisition{acquisitionCount > 1 ? 's' : ''}</Badge>
        </div>
      )}

      {/* Table view */}
      {transactions.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border/30">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === filteredTxs.length && filteredTxs.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[100px]">Date</TableHead>
                <TableHead className="min-w-[70px]">De</TableHead>
                <TableHead className="min-w-[60px]">Qté</TableHead>
                <TableHead className="min-w-[70px]">Vers</TableHead>
                <TableHead className="min-w-[100px]">Valeur EUR</TableHead>
                <TableHead className="min-w-[80px]">Frais EUR</TableHead>
                <TableHead className="min-w-[120px]">Type</TableHead>
                {accounts.length > 1 && <TableHead className="min-w-[100px]">Compte</TableHead>}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxs.map((tx) => (
                <TableRow key={tx.id} className={selectedIds.has(tx.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(tx.id)}
                      onCheckedChange={() => toggleSelect(tx.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={tx.date}
                      onChange={(e) => updateTx(tx.id, 'date', e.target.value)}
                      className="h-8 text-xs w-[130px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={tx.assetFrom}
                      onChange={(e) => updateTx(tx.id, 'assetFrom', e.target.value)}
                      placeholder="BTC"
                      className="h-8 text-xs w-[70px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={tx.qtyFrom}
                      onChange={(e) => updateTx(tx.id, 'qtyFrom', e.target.value)}
                      className="h-8 text-xs w-[80px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={tx.assetTo}
                      onChange={(e) => updateTx(tx.id, 'assetTo', e.target.value)}
                      placeholder="EUR"
                      className="h-8 text-xs w-[70px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={tx.fiatValueEur}
                      onChange={(e) => updateTx(tx.id, 'fiatValueEur', e.target.value)}
                      placeholder="0.00"
                      className="h-8 text-xs w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={tx.feesEur}
                      onChange={(e) => updateTx(tx.id, 'feesEur', e.target.value)}
                      placeholder="0.00"
                      className="h-8 text-xs w-[80px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={tx.classification} onValueChange={(v) => updateTx(tx.id, 'classification', v)}>
                      <SelectTrigger className="h-8 text-xs w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSIFICATIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.short}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {accounts.length > 1 && (
                    <TableCell>
                      <Select value={tx.accountId || ''} onValueChange={(v) => updateTx(tx.id, 'accountId', v)}>
                        <SelectTrigger className="h-8 text-xs w-[100px]">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTx(tx.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Info className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Importe un CSV ou ajoute des transactions manuellement.</p>
        </div>
      )}

      {/* Add button */}
      <Button variant="outline" onClick={() => addTransaction(accounts.length === 1 ? accounts[0].id : '')} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une transaction
      </Button>
    </div>
  );
};
