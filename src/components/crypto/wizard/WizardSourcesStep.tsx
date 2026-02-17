import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Building2, Wallet, Info } from 'lucide-react';
import type { AccountDraft } from '@/pages/crypto/CryptoWizard';

interface Props {
  accounts: AccountDraft[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountDraft[]>>;
}

export const WizardSourcesStep = ({ accounts, setAccounts }: Props) => {
  const addAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        accountType: 'exchange',
        country: 'FR',
        isForeignAccount: false,
      },
    ]);
  };

  const updateAccount = (id: string, field: keyof AccountDraft, value: string | boolean) => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, [field]: value };
        if (field === 'country') {
          updated.isForeignAccount = value !== 'FR';
        }
        return updated;
      })
    );
  };

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const hasForeignAccounts = accounts.some((a) => a.isForeignAccount);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Étape 1 — Sources & Comptes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ajoute tous tes exchanges et wallets utilisés pour des opérations crypto en 2025.
        </p>
      </div>

      {hasForeignAccounts && (
        <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning">
              <strong>Compte étranger détecté.</strong> Tu devras également déclarer ce compte via
              le formulaire 3916-bis.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.id} className="border-border/30">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {account.accountType === 'exchange' ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Wallet className="h-4 w-4 text-accent" />
                  )}
                  <span className="text-sm font-semibold">
                    {account.name || 'Nouveau compte'}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAccount(account.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nom</Label>
                  <Input placeholder="Ex: Binance, Ledger..." value={account.name} onChange={(e) => updateAccount(account.id, 'name', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={account.accountType} onValueChange={(v) => updateAccount(account.id, 'accountType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exchange">Exchange</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label className="text-xs">Pays</Label>
                  <Select value={account.country} onValueChange={(v) => updateAccount(account.id, 'country', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="US">États-Unis</SelectItem>
                      <SelectItem value="MT">Malte</SelectItem>
                      <SelectItem value="SG">Singapour</SelectItem>
                      <SelectItem value="KY">Îles Caïmans</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={account.isForeignAccount} onCheckedChange={(v) => updateAccount(account.id, 'isForeignAccount', v)} />
                  <Label className="text-xs">Compte étranger</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addAccount} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un compte
      </Button>

      {accounts.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Ajoute au moins un exchange ou wallet pour continuer.
        </div>
      )}
    </div>
  );
};
