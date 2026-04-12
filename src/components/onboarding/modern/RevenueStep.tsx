import { motion } from 'framer-motion';
import { ModernOnboardingData, INCOME_OPTIONS, PATRIMONY_OPTIONS } from '@/data/modernOnboardingTypes';

interface Props {
  data: ModernOnboardingData;
  onChange: (updates: Partial<ModernOnboardingData>) => void;
}

export const RevenueStep = ({ data, onChange }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Monthly income */}
      <div>
        <h2 className="text-xl font-bold mb-1">Tes finances</h2>
        <p className="text-sm text-muted-foreground mb-4">Revenus mensuels nets</p>
        <div className="grid grid-cols-2 gap-3">
          {INCOME_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ incomeRange: opt.value })}
              className={`p-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200 ${
                data.incomeRange === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
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
        <h3 className="text-lg font-semibold mb-1">Ton épargne totale</h3>
        <p className="text-xs text-muted-foreground mb-3">Tous comptes confondus (approximatif)</p>
        <div className="grid grid-cols-2 gap-3">
          {PATRIMONY_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ patrimonyRange: opt.value })}
              className={`p-4 rounded-2xl border-2 text-sm font-medium transition-all duration-200 ${
                data.patrimonyRange === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border/50 bg-card/50 hover:border-primary/30'
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
