import { motion } from 'framer-motion';
import { ModernOnboardingData, INCOME_OPTIONS, PATRIMONY_OPTIONS } from '@/data/modernOnboardingTypes';
import { Wallet, PiggyBank } from 'lucide-react';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const PatrimonyStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Income */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Revenu net mensuel approximatif</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Ordre de grandeur, pas besoin d'être précis</p>
        <div className="grid grid-cols-2 gap-3">
          {INCOME_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ incomeRange: opt.value })}
              className={`p-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200 ${
                data.incomeRange === opt.value
                  ? 'border-primary bg-primary/10 shadow-md text-primary'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Patrimony */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank className="h-5 w-5 text-success" />
          <h3 className="text-lg font-semibold">Patrimoine financier actuel</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Épargne, placements, investissements</p>
        <div className="grid grid-cols-2 gap-3">
          {PATRIMONY_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ patrimonyRange: opt.value })}
              className={`p-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200 ${
                data.patrimonyRange === opt.value
                  ? 'border-success bg-success/10 shadow-md text-success'
                  : 'border-border/50 bg-card/50 hover:border-success/30'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
