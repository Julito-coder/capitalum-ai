import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const SelfEmployedSection = ({ data, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>SIRET</Label>
        <Input value={data.siret} onChange={(e) => onChange({ siret: e.target.value })} placeholder="123 456 789 00012" />
      </div>
      <div className="space-y-2">
        <Label>Date de création</Label>
        <Input type="date" value={data.companyCreationDate} onChange={(e) => onChange({ companyCreationDate: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Code APE</Label>
        <Input value={data.apeCode} onChange={(e) => onChange({ apeCode: e.target.value })} placeholder="6201Z" />
      </div>
      <div className="space-y-2">
        <Label>Statut fiscal</Label>
        <Select value={data.fiscalStatus} onValueChange={(v) => onChange({ fiscalStatus: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="micro">Micro-entreprise</SelectItem>
            <SelectItem value="micro_social">Micro-social</SelectItem>
            <SelectItem value="reel_simplifie">Réel simplifié</SelectItem>
            <SelectItem value="reel_normal">Réel normal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>CA annuel HT (€)</Label>
        <Input type="number" value={data.annualRevenueHt || ''} onChange={(e) => onChange({ annualRevenueHt: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Charges sociales (€/an)</Label>
        <Input type="number" value={data.socialChargesPaid || ''} onChange={(e) => onChange({ socialChargesPaid: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Loyer bureau (€/mois)</Label>
        <Input type="number" value={data.officeRent || ''} onChange={(e) => onChange({ officeRent: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Frais véhicule (€/an)</Label>
        <Input type="number" value={data.vehicleExpenses || ''} onChange={(e) => onChange({ vehicleExpenses: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Fournitures (€/an)</Label>
        <Input type="number" value={data.professionalSupplies || ''} onChange={(e) => onChange({ professionalSupplies: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Logiciel comptable</Label>
        <Input value={data.accountingSoftware} onChange={(e) => onChange({ accountingSoftware: e.target.value })} placeholder="Indy, Pennylane…" />
      </div>
    </div>
  );
};
