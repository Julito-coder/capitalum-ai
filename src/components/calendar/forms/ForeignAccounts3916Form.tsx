import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface AccountEntry {
  id: string;
  platform: string;
  country: string;
  accountNumber: string;
  openDate: string;
  closeDate: string;
  usage: 'trading' | 'staking' | 'epargne' | 'defi' | 'autre';
}

interface ForeignAccounts3916FormProps {
  initialData?: { accounts: AccountEntry[] };
  cryptoWalletAddress?: string;
  onSave: (data: { accounts: AccountEntry[] }) => void;
  onFieldFocus?: (fieldName: string) => void;
}

const PLATFORMS = ['Binance', 'Kraken', 'Coinbase', 'Crypto.com', 'Bybit', 'OKX', 'KuCoin', 'Bitstamp', 'Bitfinex', 'Gate.io'];
const COUNTRIES: { code: string; label: string }[] = [
  { code: 'MT', label: 'Malte' },
  { code: 'US', label: 'États-Unis' },
  { code: 'KY', label: 'Îles Caïmans' },
  { code: 'SG', label: 'Singapour' },
  { code: 'SC', label: 'Seychelles' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'IE', label: 'Irlande' },
  { code: 'OTHER', label: 'Autre' },
];

function createEmptyAccount(): AccountEntry {
  return {
    id: crypto.randomUUID(),
    platform: '',
    country: '',
    accountNumber: '',
    openDate: '',
    closeDate: '',
    usage: 'trading',
  };
}

export const ForeignAccounts3916Form = ({ initialData, cryptoWalletAddress, onSave, onFieldFocus }: ForeignAccounts3916FormProps) => {
  const [accounts, setAccounts] = useState<AccountEntry[]>(initialData?.accounts ?? [createEmptyAccount()]);

  const updateAccount = useCallback((id: string, field: keyof AccountEntry, value: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  }, []);

  const addAccount = () => setAccounts((prev) => [...prev, createEmptyAccount()]);
  const removeAccount = (id: string) => setAccounts((prev) => prev.filter((a) => a.id !== id));

  const handleSave = () => {
    onSave({ accounts });
    toast({ title: '✅ Formulaire sauvegardé', description: 'Les comptes 3916-bis ont été enregistrés.' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-info/5 border border-info/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Formulaire 3916-bis — Comptes d'actifs numériques à l'étranger</p>
            <p className="text-muted-foreground">
              Déclare ici tous tes comptes sur des plateformes crypto basées hors de France, 
              même s'ils sont inactifs ou à solde nul. Amende de 750 € par compte non déclaré.
            </p>
            {cryptoWalletAddress && (
              <p className="mt-2 font-medium text-primary">
                💡 Wallet détecté dans ton profil : {cryptoWalletAddress.slice(0, 10)}...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accounts list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Comptes à déclarer ({accounts.length})</h3>
          <Button variant="outline" size="sm" onClick={addAccount}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter un compte
          </Button>
        </div>

        {accounts.map((account, idx) => (
          <div key={account.id} className="p-4 rounded-xl border border-border/30 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Compte n°{idx + 1}</p>
              {accounts.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAccount(account.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Plateforme</Label>
                <Input
                  placeholder="Ex: Binance, Kraken..."
                  value={account.platform}
                  onChange={(e) => updateAccount(account.id, 'platform', e.target.value)}
                  onFocus={() => onFieldFocus?.('plateforme')}
                  list={`platforms-${account.id}`}
                />
                <datalist id={`platforms-${account.id}`}>
                  {PLATFORMS.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs">Pays du siège</Label>
                <Select value={account.country} onValueChange={(v) => updateAccount(account.id, 'country', v)}>
                  <SelectTrigger onFocus={() => onFieldFocus?.('pays')}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">N° de compte / identifiant</Label>
                <Input
                  placeholder="Numéro ou email"
                  value={account.accountNumber}
                  onChange={(e) => updateAccount(account.id, 'accountNumber', e.target.value)}
                  onFocus={() => onFieldFocus?.('numero_compte')}
                />
              </div>
              <div>
                <Label className="text-xs">Usage principal</Label>
                <Select value={account.usage} onValueChange={(v) => updateAccount(account.id, 'usage', v as AccountEntry['usage'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="staking">Staking</SelectItem>
                    <SelectItem value="epargne">Épargne</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date d'ouverture</Label>
                <Input
                  type="date"
                  value={account.openDate}
                  onChange={(e) => updateAccount(account.id, 'openDate', e.target.value)}
                  onFocus={() => onFieldFocus?.('date_ouverture')}
                />
              </div>
              <div>
                <Label className="text-xs">Date de fermeture (optionnel)</Label>
                <Input
                  type="date"
                  value={account.closeDate}
                  onChange={(e) => updateAccount(account.id, 'closeDate', e.target.value)}
                  onFocus={() => onFieldFocus?.('date_fermeture')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
        <p className="text-sm font-semibold mb-1">{accounts.length} compte(s) à déclarer</p>
        <p className="text-xs text-muted-foreground">
          Risque en cas de non-déclaration : {(accounts.length * 750).toLocaleString('fr-FR')} € d'amende minimum
        </p>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleSave}>
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={() => {
          toast({ title: '📄 Export PDF', description: 'Fonctionnalité bientôt disponible.' });
        }}>
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>
    </div>
  );
};
