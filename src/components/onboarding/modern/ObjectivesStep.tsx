import { motion } from 'framer-motion';
import { ModernOnboardingData, OBJECTIVE_OPTIONS, FinancialObjective } from '@/data/modernOnboardingTypes';
import { Check } from 'lucide-react';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const ObjectivesStep = ({ data, onChange }: Props) => {
  const toggle = (value: FinancialObjective) => {
    const current = data.financialObjectives;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ financialObjectives: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-1">Tes objectifs financiers</h3>
        <p className="text-sm text-muted-foreground mb-5">Sélectionne tout ce qui t'intéresse (multi-choix)</p>
      </div>

      <div className="space-y-3">
        {OBJECTIVE_OPTIONS.map((opt, i) => {
          const selected = data.financialObjectives.includes(opt.value);
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggle(opt.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                selected
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <div
                className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
