import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface WizardStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const WizardStepIndicator = ({
  steps,
  currentStep,
  onStepClick,
  className
}: WizardStepIndicatorProps) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Simple progress */}
      <div className="md:hidden flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden md:block">
        <div className="flex items-start">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && index <= currentStep;

            return (
              <div key={step.id} className="flex-1 flex items-start">
                {/* Step content */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(index)}
                  className={cn(
                    "flex flex-col items-center w-full group",
                    isClickable && "cursor-pointer"
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary bg-primary/10 text-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground/50",
                      isClickable && !isCurrent && "group-hover:border-primary/50"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden lg:block">
                      {step.description}
                    </p>
                  </div>
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mt-5 px-2">
                    <div className={cn(
                      "h-0.5 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                    )} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
