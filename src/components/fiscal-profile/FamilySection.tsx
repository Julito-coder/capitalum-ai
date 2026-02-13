import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const FamilySection = ({ data, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Situation familiale</Label>
        <Select value={data.familyStatus} onValueChange={(v) => onChange({ familyStatus: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Célibataire</SelectItem>
            <SelectItem value="married">Marié(e)</SelectItem>
            <SelectItem value="pacs">Pacsé(e)</SelectItem>
            <SelectItem value="divorced">Divorcé(e)</SelectItem>
            <SelectItem value="widowed">Veuf/Veuve</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="childrenCount">Nombre d'enfants à charge</Label>
        <Input
          id="childrenCount"
          type="number"
          min={0}
          value={data.childrenCount}
          onChange={(e) => onChange({ childrenCount: parseInt(e.target.value) || 0 })}
        />
      </div>
      {(data.familyStatus === 'married' || data.familyStatus === 'pacs') && (
        <div className="space-y-2">
          <Label htmlFor="spouseIncome">Revenu annuel du conjoint (€)</Label>
          <Input
            id="spouseIncome"
            type="number"
            value={data.spouseIncome || ''}
            onChange={(e) => onChange({ spouseIncome: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      )}
      <div className="flex items-center gap-3 md:col-span-2">
        <Switch
          checked={data.isHomeowner}
          onCheckedChange={(v) => onChange({ isHomeowner: v })}
        />
        <Label>Propriétaire de ma résidence principale</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="residenceDuration">Durée de résidence (années)</Label>
        <Input
          id="residenceDuration"
          type="number"
          min={0}
          value={data.residenceDurationYears || ''}
          onChange={(e) => onChange({ residenceDurationYears: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
};
