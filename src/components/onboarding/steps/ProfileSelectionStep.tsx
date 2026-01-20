import { OnboardingData, ProfileType, PROFILE_ICONS, PROFILE_LABELS } from '@/data/onboardingTypes';
import { Check } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

const PROFILES: ProfileType[] = ['employee', 'self_employed', 'retired', 'investor'];

export const ProfileSelectionStep = ({ data, updateData }: Props) => {
  const toggleProfile = (profile: ProfileType) => {
    const current = data.profileTypes;
    if (current.includes(profile)) {
      updateData('profileTypes', current.filter(p => p !== profile));
    } else {
      updateData('profileTypes', [...current, profile]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Bienvenue sur CAPITALUM 👋</h2>
        <p className="text-muted-foreground">
          Sélectionnez toutes les sources de revenus qui vous concernent
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROFILES.map((profile) => {
          const isSelected = data.profileTypes.includes(profile);
          return (
            <button
              key={profile}
              onClick={() => toggleProfile(profile)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <span className="text-4xl mb-3 block">{PROFILE_ICONS[profile]}</span>
              <h3 className="font-semibold text-lg mb-1">{PROFILE_LABELS[profile]}</h3>
              <p className="text-sm text-muted-foreground">
                {profile === 'employee' && 'CDI, CDD, intérim, fonction publique'}
                {profile === 'self_employed' && 'Micro-entrepreneur, profession libérale, TNS'}
                {profile === 'retired' && 'Pension CNAV, complémentaires, cumul emploi-retraite'}
                {profile === 'investor' && 'Immobilier locatif, bourse, crypto, SCPI'}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Vous pouvez sélectionner plusieurs profils si vous avez des revenus mixtes
      </p>
    </div>
  );
};
