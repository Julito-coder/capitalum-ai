import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const InvestmentRealEstateSection = ({ data, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center gap-3 md:col-span-2">
        <Switch
          checked={data.hasRentalIncome}
          onCheckedChange={(v) => onChange({ hasRentalIncome: v })}
        />
        <Label>J'ai des revenus locatifs</Label>
      </div>
      {data.hasRentalIncome && (
        <>
          <div className="space-y-2">
            <Label>Régime locatif</Label>
            <Select value={data.rentalScheme} onValueChange={(v) => onChange({ rentalScheme: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nu">Location nue</SelectItem>
                <SelectItem value="meuble">Meublé</SelectItem>
                <SelectItem value="lmnp">LMNP</SelectItem>
                <SelectItem value="lmp">LMP</SelectItem>
                <SelectItem value="pinel">Pinel</SelectItem>
                <SelectItem value="denormandie">Denormandie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Travaux annuels (€)</Label>
            <Input type="number" value={data.annualRentalWorks || ''} onChange={(e) => onChange({ annualRentalWorks: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Crédit restant (€)</Label>
            <Input type="number" value={data.mortgageRemaining || ''} onChange={(e) => onChange({ mortgageRemaining: parseFloat(e.target.value) || 0 })} />
          </div>
        </>
      )}
      <div className="flex items-center gap-3 md:col-span-2">
        <Switch checked={data.ifiLiable} onCheckedChange={(v) => onChange({ ifiLiable: v })} />
        <Label>Assujetti à l'IFI</Label>
      </div>
    </div>
  );
};
