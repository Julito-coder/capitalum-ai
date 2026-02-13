import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const IdentitySection = ({ data, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          value={data.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          placeholder="Jean Dupont"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nif">Numéro fiscal (NIF)</Label>
        <Input
          id="nif"
          value={data.nif}
          onChange={(e) => onChange({ nif: e.target.value })}
          placeholder="13 chiffres"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthYear">Année de naissance</Label>
        <Input
          id="birthYear"
          type="number"
          value={data.birthYear || ''}
          onChange={(e) => onChange({ birthYear: parseInt(e.target.value) || 0 })}
          placeholder="1985"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="06 12 34 56 78"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="addressStreet">Adresse</Label>
        <Input
          id="addressStreet"
          value={data.addressStreet}
          onChange={(e) => onChange({ addressStreet: e.target.value })}
          placeholder="12 rue de la Paix"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressCity">Ville</Label>
        <Input
          id="addressCity"
          value={data.addressCity}
          onChange={(e) => onChange({ addressCity: e.target.value })}
          placeholder="Paris"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressPostalCode">Code postal</Label>
        <Input
          id="addressPostalCode"
          value={data.addressPostalCode}
          onChange={(e) => onChange({ addressPostalCode: e.target.value })}
          placeholder="75001"
        />
      </div>
    </div>
  );
};
