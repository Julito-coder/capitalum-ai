import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ModernOnboardingData, DEFAULT_MODERN_ONBOARDING } from '@/data/modernOnboardingTypes';
import { saveModernOnboarding } from '@/lib/modernOnboardingService';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { ObjectivesStep } from './ObjectivesStep';
import { PatrimonyStep } from './PatrimonyStep';
import { RiskStep } from './RiskStep';
import { FiscalStep } from './FiscalStep';
import { SummaryStep } from './SummaryStep';

const STEPS = ['welcome', 'profile', 'objectives', 'patrimony', 'risk', 'fiscal', 'summary'] as const;
type StepKey = (typeof STEPS)[number];

export const ModernOnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ModernOnboardingData>({
    ...DEFAULT_MODERN_ONBOARDING,
    fullName: user?.user_metadata?.full_name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep: StepKey = STEPS[step];
  const totalSteps = STEPS.length - 1; // exclude welcome
  const displayStep = step; // 0 = welcome, 1-6 = steps

  const handleChange = useCallback((updates: Partial<ModernOnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'profile':
        return data.professionalStatus !== null;
      case 'objectives':
        return data.financialObjectives.length > 0;
      case 'patrimony':
        return data.incomeRange !== null;
      case 'risk':
        return data.riskTolerance !== null;
      case 'fiscal':
        return data.declaresInFrance !== null;
      default:
        return true;
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const result = await saveModernOnboarding(user.id, data, false);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: '✅ Profil configuré !', description: 'Ton tableau de bord est personnalisé.' });
      navigate('/', { state: { onboardingJustCompleted: true } });
    } else {
      toast({ title: 'Erreur', description: result.error || 'Une erreur est survenue', variant: 'destructive' });
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setIsSubmitting(true);
    await saveModernOnboarding(user.id, data, true);
    setIsSubmitting(false);
    navigate('/', { state: { onboardingJustCompleted: true } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

      <div className="relative max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Header: progress + skip */}
        {currentStep !== 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Étape {displayStep} sur {totalSteps}
              </span>
              {/* Only show skip on fiscal and summary steps */}
              {(currentStep === 'fiscal' || currentStep === 'summary') && (
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Passer
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(displayStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* Step content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && <WelcomeStep key="welcome" onStart={next} />}
            {currentStep === 'profile' && <ProfileStep key="profile" data={data} onChange={handleChange} />}
            {currentStep === 'objectives' && <ObjectivesStep key="objectives" data={data} onChange={handleChange} />}
            {currentStep === 'patrimony' && <PatrimonyStep key="patrimony" data={data} onChange={handleChange} />}
            {currentStep === 'risk' && <RiskStep key="risk" data={data} onChange={handleChange} />}
            {currentStep === 'fiscal' && <FiscalStep key="fiscal" data={data} onChange={handleChange} />}
            {currentStep === 'summary' && (
              <SummaryStep
                key="summary"
                data={data}
                onComplete={handleComplete}
                onSkip={handleSkip}
                isSubmitting={isSubmitting}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons (not on welcome or summary) */}
        {currentStep !== 'welcome' && currentStep !== 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center pt-6 pb-4"
          >
            <button
              onClick={prev}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <button
              onClick={next}
              disabled={!canProceed()}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
