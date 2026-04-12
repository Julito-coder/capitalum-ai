import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModernOnboardingData, DEFAULT_MODERN_ONBOARDING } from '@/data/modernOnboardingTypes';
import { calculateElioScore, ElioScoreResult } from '@/lib/scoreElioEngine';
import { storeQuizData } from '@/hooks/usePostAuthQuizSync';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { ProfessionalStep } from './ProfessionalStep';
import { FamilyHousingStep } from './FamilyHousingStep';
import { ChildrenStep } from './ChildrenStep';
import { HousingStep } from './HousingStep';
import { RevenueStep } from './RevenueStep';
import { SavingsStep } from './SavingsStep';
import { TaxDeclarationStep } from './TaxDeclarationStep';
import { ScoreResultStep } from './ScoreResultStep';

const STEPS = ['welcome', 'age', 'professional', 'family', 'children', 'housing', 'revenue', 'savings', 'tax', 'score'] as const;
type StepKey = (typeof STEPS)[number];

const swipeVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export const ModernOnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<ModernOnboardingData>({ ...DEFAULT_MODERN_ONBOARDING });
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep: StepKey = STEPS[step];
  const questionSteps = STEPS.length - 2; // exclude welcome & score

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

  const handleSelect = useCallback((updates: Partial<ModernOnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      next();
    }, 300);
  }, [next]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const saveAndNavigate = useCallback((tab: 'signup' | 'login') => {
    storeQuizData({
      data,
      score: scoreResult.score,
      totalLoss: scoreResult.totalLoss,
    });
    navigate(`/auth?tab=${tab}`);
  }, [data, scoreResult, navigate]);

  const handleCreateAccount = useCallback(() => saveAndNavigate('signup'), [saveAndNavigate]);
  const handleLogin = useCallback(() => saveAndNavigate('login'), [saveAndNavigate]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 50;
      if (info.offset.x < -threshold && step < STEPS.length - 1) {
        next();
      } else if (info.offset.x > threshold && step > 0) {
        prev();
      }
    },
    [step, next, prev]
  );

  const questionIndex = step - 1;
  const showProgress = currentStep !== 'welcome' && currentStep !== 'score';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(27,58,92,0.08), transparent 50%)' }} />

      <div className="relative max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={prev}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                {questionIndex + 1} sur {questionSteps}
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((questionIndex + 1) / questionSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

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
              drag={showProgress ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
            >
              {currentStep === 'welcome' && <WelcomeStep onStart={next} onLogin={handleLogin} />}
              {currentStep === 'age' && <ProfileStep data={data} onSelect={handleSelect} />}
              {currentStep === 'professional' && <ProfessionalStep data={data} onSelect={handleSelect} />}
              {currentStep === 'family' && <FamilyHousingStep data={data} onSelect={handleSelect} />}
              {currentStep === 'children' && <ChildrenStep data={data} onSelect={handleSelect} />}
              {currentStep === 'housing' && <HousingStep data={data} onSelect={handleSelect} />}
              {currentStep === 'revenue' && <RevenueStep data={data} onSelect={handleSelect} />}
              {currentStep === 'savings' && <SavingsStep data={data} onSelect={handleSelect} />}
              {currentStep === 'tax' && <TaxDeclarationStep data={data} onSelect={handleSelect} />}
              {currentStep === 'score' && (
                <ScoreResultStep
                  result={scoreResult}
                  onCreateAccount={handleCreateAccount}
                  onLogin={handleLogin}
                  isSubmitting={false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
