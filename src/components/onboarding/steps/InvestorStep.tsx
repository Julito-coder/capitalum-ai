import { OnboardingData, RentalProperty, RentalScheme } from '@/data/onboardingTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, TrendingUp, Bitcoin, Plus, Trash2 } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const InvestorStep = ({ data, updateData }: Props) => {
  const addProperty = () => {
    updateData('rentalProperties', [
      ...data.rentalProperties, 
      { address: '', annualRent: 0, annualCharges: 0, scheme: 'nu' }
    ]);
  };

  const removeProperty = (index: number) => {
    updateData('rentalProperties', data.rentalProperties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, field: keyof RentalProperty, value: string | number) => {
    const newProperties = [...data.rentalProperties];
    newProperties[index] = { ...newProperties[index], [field]: value };
    updateData('rentalProperties', newProperties);
  };

  return (
    <div className="space-y-6">
      {/* Real Estate */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Immobilier locatif</h3>
          </div>
          <button
            onClick={addProperty}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter un bien
          </button>
        </div>

        {data.rentalProperties.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 border border-dashed rounded-lg text-sm">
            Aucun bien locatif déclaré
          </p>
        ) : (
          <div className="space-y-4">
            {data.rentalProperties.map((property, index) => (
              <div key={index} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Bien {index + 1}</span>
                  <button
                    onClick={() => removeProperty(index)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Adresse"
                    value={property.address}
                    onChange={(e) => updateProperty(index, 'address', e.target.value)}
                  />
                  <Select 
                    value={property.scheme} 
                    onValueChange={(v) => updateProperty(index, 'scheme', v as RentalScheme)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Régime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nu">Location nue</SelectItem>
                      <SelectItem value="meuble">Meublé classique</SelectItem>
                      <SelectItem value="lmnp">LMNP</SelectItem>
                      <SelectItem value="lmp">LMP</SelectItem>
                      <SelectItem value="pinel">Pinel</SelectItem>
                      <SelectItem value="denormandie">Denormandie</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Loyers annuels (€)"
                    value={property.annualRent}
                    onChange={(e) => updateProperty(index, 'annualRent', parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Charges annuelles (€)"
                    value={property.annualCharges}
                    onChange={(e) => updateProperty(index, 'annualCharges', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="annualRentalWorks">Travaux 2025 (€)</Label>
            <Input
              id="annualRentalWorks"
              type="number"
              min={0}
              value={data.annualRentalWorks}
              onChange={(e) => updateData('annualRentalWorks', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mortgageRemaining">Capital restant dû (€)</Label>
            <Input
              id="mortgageRemaining"
              type="number"
              min={0}
              value={data.mortgageRemaining}
              onChange={(e) => updateData('mortgageRemaining', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-background mt-4">
          <div>
            <Label className="cursor-pointer">Assujetti à l'IFI</Label>
            <p className="text-xs text-muted-foreground">Patrimoine immobilier &gt; 1,3M€</p>
          </div>
          <Switch
            checked={data.ifiLiable}
            onCheckedChange={(v) => updateData('ifiLiable', v)}
          />
        </div>
      </div>

      {/* Financial Investments */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Investissements financiers</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peaBalance">PEA - Encours (€)</Label>
            <Input
              id="peaBalance"
              type="number"
              min={0}
              value={data.peaBalance}
              onChange={(e) => updateData('peaBalance', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="peaContributions2025">PEA - Versements 2025 (€)</Label>
            <Input
              id="peaContributions2025"
              type="number"
              min={0}
              value={data.peaContributions2025}
              onChange={(e) => updateData('peaContributions2025', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ctoDividends">CTO - Dividendes (€)</Label>
            <Input
              id="ctoDividends"
              type="number"
              min={0}
              value={data.ctoDividends}
              onChange={(e) => updateData('ctoDividends', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctoCapitalGains">CTO - Plus-values (€)</Label>
            <Input
              id="ctoCapitalGains"
              type="number"
              min={0}
              value={data.ctoCapitalGains}
              onChange={(e) => updateData('ctoCapitalGains', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="lifeInsuranceBalance">Assurance-vie encours (€)</Label>
            <Input
              id="lifeInsuranceBalance"
              type="number"
              min={0}
              value={data.lifeInsuranceBalance}
              onChange={(e) => updateData('lifeInsuranceBalance', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lifeInsuranceContributions">Versements 2025 (€)</Label>
            <Input
              id="lifeInsuranceContributions"
              type="number"
              min={0}
              value={data.lifeInsuranceContributions}
              onChange={(e) => updateData('lifeInsuranceContributions', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lifeInsuranceWithdrawals">Rachats 2025 (€)</Label>
            <Input
              id="lifeInsuranceWithdrawals"
              type="number"
              min={0}
              value={data.lifeInsuranceWithdrawals}
              onChange={(e) => updateData('lifeInsuranceWithdrawals', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="scpiInvestments">SCPI (€)</Label>
            <Input
              id="scpiInvestments"
              type="number"
              min={0}
              value={data.scpiInvestments}
              onChange={(e) => updateData('scpiInvestments', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crowdfundingInvestments">Crowdfunding immo (€)</Label>
            <Input
              id="crowdfundingInvestments"
              type="number"
              min={0}
              value={data.crowdfundingInvestments}
              onChange={(e) => updateData('crowdfundingInvestments', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Crypto */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bitcoin className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Crypto-actifs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cryptoWalletAddress">Wallet principal (optionnel)</Label>
            <Input
              id="cryptoWalletAddress"
              placeholder="0x..."
              value={data.cryptoWalletAddress}
              onChange={(e) => updateData('cryptoWalletAddress', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cryptoPnl2025">P&L 2025 (€)</Label>
            <Input
              id="cryptoPnl2025"
              type="number"
              value={data.cryptoPnl2025}
              onChange={(e) => updateData('cryptoPnl2025', parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">Positif = gains, négatif = pertes</p>
          </div>
        </div>
      </div>
    </div>
  );
};
