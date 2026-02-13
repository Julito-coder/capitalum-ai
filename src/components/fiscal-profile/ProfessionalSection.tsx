import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FiscalProfileData } from '@/lib/fiscalProfileService';
import { ProfileType, PROFILE_LABELS, PROFILE_ICONS } from '@/data/onboardingTypes';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

const TYPES: ProfileType[] = ['employee', 'self_employed', 'retired', 'investor'];

export const ProfessionalSection = ({ data, onChange }: Props) => {
  const toggle = (type: ProfileType) => {
    const current = [...data.profileTypes];
    const idx = current.indexOf(type);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(type);
    onChange({ profileTypes: current });
  };

  return (
    <div className="space-y-4">
      <Label>Types de profil (sélection multiple possible)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TYPES.map((type) => (
          <label
            key={type}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              data.profileTypes.includes(type)
                ? 'border-primary/50 bg-primary/10'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <Checkbox
              checked={data.profileTypes.includes(type)}
              onCheckedChange={() => toggle(type)}
            />
            <span className="text-lg">{PROFILE_ICONS[type]}</span>
            <span className="font-medium text-sm">{PROFILE_LABELS[type]}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
