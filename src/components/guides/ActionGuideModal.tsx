import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useActionGuide } from './ActionGuideContext';
import { formatCurrency } from '@/lib/dashboardService';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: { duration: 0.2 }
  }
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: { duration: 0.2 }
  })
};

export const ActionGuideModal = () => {
  const {
    isOpen,
    currentGuide,
    currentStep,
    profile,
    closeGuide,
    nextStep,
    prevStep,
    markActionCompleted,
    markActionPending
  } = useActionGuide();

  if (!currentGuide) return null;

  const step = currentGuide.steps[currentStep];
  const progress = ((currentStep + 1) / currentGuide.steps.length) * 100;
  const isLastStep = currentStep === currentGuide.steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleComplete = () => {
    markActionCompleted(currentGuide.id);
    closeGuide();
  };

  const handleLater = () => {
    markActionPending(currentGuide.id);
    closeGuide();
  };

  const StepComponent = step.component;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeGuide}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] bg-card border border-border/50 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/30 px-5 py-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <h2 className="text-lg font-semibold truncate">{currentGuide.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{currentGuide.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">+{formatCurrency(currentGuide.estimatedGain)}</p>
                    <p className="text-[10px] text-muted-foreground">économie</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeGuide}
                    className="h-9 w-9 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Étape {currentStep + 1} sur {currentGuide.steps.length}
                  </span>
                  <span className="font-medium">{step.title}</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] px-5 py-6">
              <AnimatePresence mode="wait" custom={1}>
                <motion.div
                  key={currentStep}
                  custom={1}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {StepComponent ? (
                    <StepComponent 
                      onNext={nextStep} 
                      onBack={!isFirstStep ? prevStep : undefined}
                      profile={profile}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border/30 px-5 py-4 space-y-3">
              {isLastStep ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 min-h-[48px]"
                    onClick={handleLater}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Je le ferai plus tard
                  </Button>
                  <Button
                    className="flex-1 min-h-[48px] bg-success hover:bg-success/90"
                    onClick={handleComplete}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Action réalisée
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      className="min-h-[48px] px-4"
                      onClick={prevStep}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    className="flex-1 min-h-[48px]"
                    onClick={nextStep}
                  >
                    Continuer
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
