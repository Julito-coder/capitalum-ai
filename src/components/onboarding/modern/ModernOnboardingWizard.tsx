import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ModernOnboardingData, DEFAULT_MODERN_ONBOARDING } from '@/data/modernOnboardingTypes';
import { saveModernOnboarding } from '@/lib/modernOnboardingService';
import { calculateElioScore, ElioScoreResult } from '@/lib/scoreElioEngine';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { FamilyHousingStep } from './FamilyHousingStep';
import { RevenueStep } from './RevenueStep';
import { FiscalStep } from './FiscalStep';
import { ScoreResultStep } from './ScoreResultStep';

const STEPS = ['welcome', 'profile', 'family', 'revenue', 'fiscal', 'score'] as const;
type StepKey = (typeof STEPS)[number];

const swipeVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export const ModernOnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<ModernOnboardingData>({
    ...DEFAULT_MODERN_ONBOARDING,
    fullName: user?.user_metadata?.full_name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep: StepKey = STEPS[step];
  const totalSteps = STEPS.length - 1; // exclude welcome
  const displayStep = step;

  const handleChange = useCallback((updates: Partial<ModernOnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'profile':
        return data.professionalStatus !== null;
      case 'family':
        return data.familySituation !== null;
      case 'revenue':
        return data.incomeRange !== null;
      case 'fiscal':
        return data.declaresInFrance !== null;
      default:
        return true;
    }
  }, [currentStep, data]);

  const scoreResult: ElioScoreResult = useMemo(() => calculateElioScore(data), [data]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleComplete = useCallback(async () => {
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
  }, [user, data, toast, navigate]);

  const handleSkip = useCallback(async () => {
    if (!user) return;
    setIsSubmitting(true);
    await saveModernOnboarding(user.id, data, true);
    setIsSubmitting(false);
    navigate('/', { state: { onboardingJustCompleted: true } });
  }, [user, data, navigate]);

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 50;
      if (info.offset.x < -threshold && canProceed() && step < STEPS.length - 1) {
        next();
      } else if (info.offset.x > threshold && step > 0) {
        prev();
      }
    },
    [canProceed, step, next, prev]
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(27,58,92,0.08), transparent 50%)' }} />

      <div className="relative max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Header: progress + skip */}
        {currentStep !== 'welcome' && currentStep !== 'score' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Étape {displayStep} sur {totalSteps - 1}
              </span>
              {currentStep === 'fiscal' && (
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Passer
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(135deg, hsl(210 53% 23%), hsl(37 55% 51%))' }}
                initial={{ width: 0 }}
                animate={{ width: `${(displayStep / (totalSteps - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* Step content with swipe */}
        <div className="flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              drag={currentStep !== 'welcome' && currentStep !== 'score' ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
            >
              {currentStep === 'welcome' && <WelcomeStep onStart={next} />}
              {currentStep === 'profile' && <ProfileStep data={data} onChange={handleChange} />}
              {currentStep === 'family' && <FamilyHousingStep data={data} onChange={handleChange} />}
              {currentStep === 'revenue' && <RevenueStep data={data} onChange={handleChange} />}
              {currentStep === 'fiscal' && <FiscalStep data={data} onChange={handleChange} />}
              {currentStep === 'score' && (
                <ScoreResultStep
                  result={scoreResult}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  isSubmitting={isSubmitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        {currentStep !== 'welcome' && currentStep !== 'score' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center pt-6 pb-4"
          >
            <button
              onClick={prev}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
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
