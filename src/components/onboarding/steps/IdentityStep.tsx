import { OnboardingData } from '@/data/onboardingTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const IdentityStep = ({ data, updateData }: Props) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet *</Label>
          <Input
            id="fullName"
            placeholder="Jean Dupont"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nif">Numéro fiscal (NIF)</Label>
          <Input
            id="nif"
            placeholder="13 chiffres"
            value={data.nif}
            onChange={(e) => updateData('nif', e.target.value)}
            maxLength={13}
          />
          <p className="text-xs text-muted-foreground">Visible sur votre avis d'imposition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthYear">Année de naissance</Label>
          <Input
            id="birthYear"
            type="number"
            min={1920}
            max={2010}
            value={data.birthYear}
            onChange={(e) => updateData('birthYear', parseInt(e.target.value) || 1985)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={data.phone}
            onChange={(e) => updateData('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-medium mb-4">Adresse fiscale</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addressStreet">Rue</Label>
            <Input
              id="addressStreet"
              placeholder="123 rue de la Paix"
              value={data.addressStreet}
              onChange={(e) => updateData('addressStreet', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">Code postal</Label>
              <Input
                id="addressPostalCode"
                placeholder="75001"
                value={data.addressPostalCode}
                onChange={(e) => updateData('addressPostalCode', e.target.value)}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCity">Ville</Label>
              <Input
                id="addressCity"
                placeholder="Paris"
                value={data.addressCity}
                onChange={(e) => updateData('addressCity', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="residenceDuration">Durée à cette adresse (années)</Label>
              <Input
                id="residenceDuration"
                type="number"
                min={0}
                value={data.residenceDurationYears}
                onChange={(e) => updateData('residenceDurationYears', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <Label htmlFor="isHomeowner" className="cursor-pointer">Propriétaire</Label>
              <Switch
                id="isHomeowner"
                checked={data.isHomeowner}
                onCheckedChange={(v) => updateData('isHomeowner', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
