import { OnboardingData, PrimaryObjective, OBJECTIVE_LABELS } from '@/data/onboardingTypes';
import { Target, Building, Wallet, Users } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

const OBJECTIVES: { id: PrimaryObjective; icon: React.ElementType; description: string }[] = [
  { id: 'reduce_ir', icon: Target, description: 'Optimiser vos déductions, niches fiscales et crédits d\'impôt' },
  { id: 'optimize_is', icon: Building, description: 'Stratégie fiscale pour votre entreprise (SAS, SARL, EURL)' },
  { id: 'treasury', icon: Wallet, description: 'Anticiper vos échéances et améliorer votre cash-flow' },
  { id: 'hiring', icon: Users, description: 'Aides à l\'embauche, charges patronales, contrats aidés' },
];

export const ObjectiveStep = ({ data, updateData }: Props) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Quel est votre objectif principal ?</h2>
        <p className="text-muted-foreground">
          Nous personnaliserons vos recommandations en fonction de cette priorité
        </p>
      </div>

      <div className="space-y-3">
        {OBJECTIVES.map(({ id, icon: Icon, description }) => {
          const isSelected = data.primaryObjective === id;
          return (
            <button
              key={id}
              onClick={() => updateData('primaryObjective', id)}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4 ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{OBJECTIVE_LABELS[id]}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
