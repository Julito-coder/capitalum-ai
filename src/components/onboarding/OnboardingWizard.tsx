import { useState, useMemo } from 'react';
import { OnboardingData, DEFAULT_ONBOARDING_DATA, ProfileType } from '@/data/onboardingTypes';
import { ProfileSelectionStep } from './steps/ProfileSelectionStep';
import { IdentityStep } from './steps/IdentityStep';
import { FamilyStep } from './steps/FamilyStep';
import { ObjectiveStep } from './steps/ObjectiveStep';
import { EmployeeStep } from './steps/EmployeeStep';
import { SelfEmployedStep } from './steps/SelfEmployedStep';
import { RetiredStep } from './steps/RetiredStep';
import { InvestorStep } from './steps/InvestorStep';
import { ConsentStep } from './steps/ConsentStep';
import { ArrowLeft, ArrowRight, Check, Shield, TrendingUp } from 'lucide-react';

interface Props {
  onComplete: (data: OnboardingData) => void;
  initialData?: Partial<OnboardingData>;
}

type StepId = 'profile' | 'identity' | 'family' | 'objective' | 'employee' | 'self_employed' | 'retired' | 'investor' | 'consent';

interface Step {
  id: StepId;
  title: string;
  description: string;
  condition?: (data: OnboardingData) => boolean;
}

const ALL_STEPS: Step[] = [
  { id: 'profile', title: 'Votre profil', description: 'Sélectionnez vos sources de revenus' },
  { id: 'identity', title: 'Identité', description: 'Informations personnelles et fiscales' },
  { id: 'family', title: 'Situation familiale', description: 'Foyer fiscal et personnes à charge' },
  { id: 'objective', title: 'Objectif principal', description: 'Que souhaitez-vous optimiser ?' },
  { id: 'employee', title: 'Revenus salariés', description: 'Salaires, primes et avantages', condition: (d) => d.profileTypes.includes('employee') },
  { id: 'self_employed', title: 'Activité indépendante', description: 'CA, charges et statut fiscal', condition: (d) => d.profileTypes.includes('self_employed') },
  { id: 'retired', title: 'Revenus retraite', description: 'Pensions et complémentaires', condition: (d) => d.profileTypes.includes('retired') },
  { id: 'investor', title: 'Investissements', description: 'Immobilier, finance et crypto', condition: (d) => d.profileTypes.includes('investor') },
  { id: 'consent', title: 'Validation', description: 'Consentements et récapitulatif' },
];

export const OnboardingWizard = ({ onComplete, initialData }: Props) => {
  const [data, setData] = useState<OnboardingData>({ ...DEFAULT_ONBOARDING_DATA, ...initialData });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [estimatedSavings, setEstimatedSavings] = useState(0);

  const visibleSteps = useMemo(() => {
    return ALL_STEPS.filter(step => !step.condition || step.condition(data));
  }, [data]);

  const currentStep = visibleSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / visibleSteps.length) * 100;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  const updateData = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData(prev => {
      const newData = { ...prev, [field]: value };
      // Recalculate estimated savings based on data
      calculateEstimatedSavings(newData);
      return newData;
    });
  };

  const calculateEstimatedSavings = (d: OnboardingData) => {
    let savings = 0;
    // Simple estimation logic
    if (d.hasRealExpenses && d.realExpensesAmount > 0) savings += Math.min(d.realExpensesAmount * 0.3, 2000);
    if (d.peeAmount > 0) savings += d.peeAmount * 0.1;
    if (d.annualRevenueHt > 0 && d.fiscalStatus === 'micro') savings += 500;
    if (d.rentalProperties.length > 0) savings += 800;
    if (d.peaBalance > 0) savings += 300;
    if (d.lifeInsuranceBalance > 0) savings += 200;
    setEstimatedSavings(Math.round(savings));
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(data);
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep.id) {
      case 'profile':
        return data.profileTypes.length > 0;
      case 'identity':
        return data.fullName.trim().length > 0;
      case 'consent':
        return data.gdprConsent;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case 'profile':
        return <ProfileSelectionStep data={data} updateData={updateData} />;
      case 'identity':
        return <IdentityStep data={data} updateData={updateData} />;
      case 'family':
        return <FamilyStep data={data} updateData={updateData} />;
      case 'objective':
        return <ObjectiveStep data={data} updateData={updateData} />;
      case 'employee':
        return <EmployeeStep data={data} updateData={updateData} />;
      case 'self_employed':
        return <SelfEmployedStep data={data} updateData={updateData} />;
      case 'retired':
        return <RetiredStep data={data} updateData={updateData} />;
      case 'investor':
        return <InvestorStep data={data} updateData={updateData} />;
      case 'consent':
        return <ConsentStep data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Étape {currentStepIndex + 1}/{visibleSteps.length}</p>
                <h1 className="text-xl font-semibold">{currentStep.title}</h1>
              </div>
            </div>
            {estimatedSavings > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">+{estimatedSavings}€/an estimé</span>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{currentStep.description}</p>
        </div>

        {/* Step content */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6 animate-in fade-in duration-300">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button 
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Précédent
          </button>
          <button 
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Terminer
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Security notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Données chiffrées AES-256 • RGPD conforme • Supprimables en 1 clic</span>
        </div>
      </div>
    </div>
  );
};
